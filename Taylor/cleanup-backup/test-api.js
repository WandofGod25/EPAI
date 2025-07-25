#!/usr/bin/env node

/**
 * EPAI API Test Script
 * 
 * This script tests the various API endpoints of the EPAI platform.
 */

// Test script for EPAI API endpoints
import fetch from 'node-fetch';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Test user credentials
const TEST_USER_EMAIL = 'ange_andre25@yahoo.com';
const TEST_USER_PASSWORD = 'Taylortest';

// Function to log with color
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`),
};

// Test authentication
async function testAuthentication() {
  log.info('Testing authentication...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log.success('Authentication successful!');
      log.info(`User ID: ${data.user.id}`);
      log.info(`Access Token: ${data.access_token.substring(0, 10)}...`);
      return data;
    } else {
      log.error(`Authentication failed: ${data.error || 'Unknown error'}`);
      log.error(`Status: ${response.status}`);
      return null;
    }
  } catch (error) {
    log.error(`Authentication error: ${error.message}`);
    return null;
  }
}

// Test Edge Functions
async function testEdgeFunction(functionName, token = null) {
  log.info(`Testing Edge Function: ${functionName}...`);
  
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['apikey'] = SUPABASE_SERVICE_KEY;
    }
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      headers,
    });
    
    if (response.ok) {
      const data = await response.json();
      log.success(`Edge Function ${functionName} successful!`);
      log.info(`Response: ${JSON.stringify(data).substring(0, 100)}...`);
      return data;
    } else {
      const errorText = await response.text();
      log.error(`Edge Function ${functionName} failed: ${errorText}`);
      log.error(`Status: ${response.status}`);
      return null;
    }
  } catch (error) {
    log.error(`Edge Function ${functionName} error: ${error.message}`);
    return null;
  }
}

// Main test function
async function runTests() {
  log.info('Starting API tests...');
  
  // Test authentication
  const authData = await testAuthentication();
  
  if (!authData) {
    log.error('Authentication failed, cannot continue with authenticated tests');
    return;
  }
  
  // Test Edge Functions that require authentication
  await testEdgeFunction('get-models', authData.access_token);
  await testEdgeFunction('get-insights', authData.access_token);
  await testEdgeFunction('api-key-manager', authData.access_token);
  
  log.info('Tests completed!');
}

runTests(); 