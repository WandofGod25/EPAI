#!/usr/bin/env node

/**
 * EPAI Security Testing Script
 * 
 * This script tests various security implementations in the EPAI platform.
 * It can be used for both manual testing and as part of automated security verification.
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup paths and environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from test.env
dotenv.config({ path: path.join(__dirname, 'test.env') });

// Constants
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;
const TEST_EMAIL = 'security-test@example.com';
const TEST_PASSWORD = 'SecureTestPassword123!';
const PARTNER_ID = '00000000-0000-4000-a000-000000000001';
const SEC_EVENT_ID = '00000000-0000-4000-a000-000000000010';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test result tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  details: []
};

/**
 * Helper function to log test results
 */
function logTest(name, result, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  testResults.total++;
  if (result) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  
  testResults.details.push({
    name,
    result,
    details
  });
}

/**
 * Helper function to skip a test
 */
function skipTest(name, reason) {
  console.log(`⚠️ SKIP - ${name}`);
  console.log(`   Reason: ${reason}`);
  
  testResults.total++;
  testResults.skipped++;
  
  testResults.details.push({
    name,
    result: 'skipped',
    details: reason
  });
}

/**
 * Test Rate Limiting
 */
async function testRateLimiting() {
  console.log('\n--- Testing Rate Limiting ---');
  
  // Get a test API key
  const { data: apiKeyData, error: apiKeyError } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('partner_id', PARTNER_ID)
    .limit(1);
  
  if (apiKeyError || !apiKeyData || apiKeyData.length === 0) {
    skipTest('Rate Limiting', 'Could not retrieve API key for testing');
    return;
  }
  
  const apiKey = apiKeyData[0].api_key || process.env.TEST_API_KEY || 'epai_test_key_12345';
  
  // Test rate limiting by making multiple requests in quick succession
  const rateLimitEndpoint = `${API_BASE_URL}/ingest-v2`;
  const requestCount = 15; // Should trigger rate limiting
  const requests = [];
  
  for (let i = 0; i < requestCount; i++) {
    requests.push(
      fetch(rateLimitEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          event_type: 'user_engagement',
          timestamp: new Date().toISOString(),
          data: {
            user_id: `test-user-${i}`,
            action: 'rate_limit_test',
            content_id: `content-${i}`
          }
        })
      })
    );
  }
  
  try {
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(response => response.status === 429);
    
    logTest('Rate Limiting', rateLimited, 
      rateLimited 
        ? `Rate limiting correctly triggered after multiple requests` 
        : `Rate limiting did not trigger after ${requestCount} requests`
    );
  } catch (error) {
    logTest('Rate Limiting', false, `Error testing rate limiting: ${error.message}`);
  }
}

/**
 * Test API Key Authentication
 */
async function testApiKeyAuthentication() {
  console.log('\n--- Testing API Key Authentication ---');
  
  // Test with invalid API key
  try {
    const invalidKeyResponse = await fetch(`${API_BASE_URL}/ingest-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'invalid-api-key'
      },
      body: JSON.stringify({
        event_type: 'user_engagement',
        timestamp: new Date().toISOString(),
        data: {
          user_id: 'test-user',
          action: 'test_action',
          content_id: 'content-1'
        }
      })
    });
    
    const invalidKeyResult = invalidKeyResponse.status === 401;
    logTest('Invalid API Key Rejection', invalidKeyResult, 
      invalidKeyResult 
        ? 'Invalid API key correctly rejected with 401' 
        : `Invalid API key not rejected correctly (status: ${invalidKeyResponse.status})`
    );
  } catch (error) {
    logTest('Invalid API Key Rejection', false, `Error testing invalid API key: ${error.message}`);
  }
  
  // Test with valid API key
  const { data: apiKeyData, error: apiKeyError } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('partner_id', PARTNER_ID)
    .limit(1);
  
  if (apiKeyError || !apiKeyData || apiKeyData.length === 0) {
    skipTest('Valid API Key Acceptance', 'Could not retrieve API key for testing');
    return;
  }
  
  const apiKey = apiKeyData[0].api_key || process.env.TEST_API_KEY || 'epai_test_key_12345';
  
  try {
    const validKeyResponse = await fetch(`${API_BASE_URL}/ingest-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        event_type: 'user_engagement',
        timestamp: new Date().toISOString(),
        data: {
          user_id: 'test-user',
          action: 'test_action',
          content_id: 'content-1'
        }
      })
    });
    
    const validKeyResult = validKeyResponse.status === 201;
    logTest('Valid API Key Acceptance', validKeyResult, 
      validKeyResult 
        ? 'Valid API key correctly accepted' 
        : `Valid API key not accepted correctly (status: ${validKeyResponse.status})`
    );
  } catch (error) {
    logTest('Valid API Key Acceptance', false, `Error testing valid API key: ${error.message}`);
  }
}

/**
 * Test Security Headers
 */
async function testSecurityHeaders() {
  console.log('\n--- Testing Security Headers ---');
  
  // Test security headers on a public endpoint
  try {
    const response = await fetch(`${API_BASE_URL}/get-public-insight`);
    const headers = response.headers;
    
    // Check for required security headers
    const hasContentTypeOptions = headers.get('x-content-type-options') === 'nosniff';
    logTest('X-Content-Type-Options Header', hasContentTypeOptions);
    
    const hasXssProtection = headers.get('x-xss-protection') === '1; mode=block';
    logTest('X-XSS-Protection Header', hasXssProtection);
    
    const hasFrameOptions = headers.get('x-frame-options') === 'DENY';
    logTest('X-Frame-Options Header', hasFrameOptions);
    
    const hasCsp = !!headers.get('content-security-policy');
    logTest('Content-Security-Policy Header', hasCsp);
    
    const hasCors = !!headers.get('access-control-allow-origin');
    logTest('CORS Headers', hasCors);
  } catch (error) {
    logTest('Security Headers', false, `Error testing security headers: ${error.message}`);
  }
}

/**
 * Test SQL Injection Protection
 */
async function testSqlInjectionProtection() {
  console.log('\n--- Testing SQL Injection Protection ---');
  
  // Test SQL injection in API key parameter
  try {
    const sqlInjectionResponse = await fetch(`${API_BASE_URL}/get-public-insight?apiKey=1' OR '1'='1`, {
      method: 'GET'
    });
    
    const sqlInjectionResult = sqlInjectionResponse.status === 401 || sqlInjectionResponse.status === 400;
    logTest('SQL Injection in API Key Parameter', sqlInjectionResult, 
      sqlInjectionResult 
        ? 'SQL injection attempt correctly rejected' 
        : `SQL injection not handled correctly (status: ${sqlInjectionResponse.status})`
    );
  } catch (error) {
    logTest('SQL Injection in API Key Parameter', false, `Error testing SQL injection: ${error.message}`);
  }
}

/**
 * Test XSS Protection
 */
async function testXssProtection() {
  console.log('\n--- Testing XSS Protection ---');
  
  // Get a test API key
  const { data: apiKeyData, error: apiKeyError } = await supabase
    .from('api_keys')
    .select('key_value')
    .limit(1);
  
  if (apiKeyError || !apiKeyData || apiKeyData.length === 0) {
    skipTest('XSS Protection', 'Could not retrieve API key for testing');
    return;
  }
  
  const apiKey = apiKeyData[0].key_value;
  
  // Test XSS in data payload
  try {
    const xssPayload = '<script>alert("XSS")</script>';
    const xssResponse = await fetch(`${API_BASE_URL}/ingest-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        event_type: 'user_engagement',
        timestamp: new Date().toISOString(),
        data: {
          user_id: xssPayload,
          action: xssPayload,
          content_id: xssPayload
        }
      })
    });
    
    // Check if the request was accepted (we're testing if the XSS payload was sanitized, not rejected)
    const xssResult = xssResponse.status === 201;
    logTest('XSS Payload Sanitization', xssResult, 
      xssResult 
        ? 'XSS payload correctly handled' 
        : `XSS payload not handled correctly (status: ${xssResponse.status})`
    );
    
    // Now check if the data was sanitized in the database
    if (xssResult) {
      const { data: eventData, error: eventError } = await supabase
        .from('ingestion_events')
        .select('data')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (eventError || !eventData || eventData.length === 0) {
        logTest('XSS Payload Database Sanitization', false, 'Could not retrieve event data from database');
      } else {
        const eventDataObj = eventData[0].data;
        const containsRawXss = 
          (eventDataObj.user_id && eventDataObj.user_id.includes('<script>')) ||
          (eventDataObj.action && eventDataObj.action.includes('<script>')) ||
          (eventDataObj.content_id && eventDataObj.content_id.includes('<script>'));
        
        logTest('XSS Payload Database Sanitization', !containsRawXss, 
          !containsRawXss 
            ? 'XSS payload correctly sanitized in database' 
            : 'XSS payload not sanitized in database'
        );
      }
    }
  } catch (error) {
    logTest('XSS Protection', false, `Error testing XSS protection: ${error.message}`);
  }
}

/**
 * Generate a summary report
 */
function generateReport() {
  console.log('\n--- Security Test Summary ---');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Skipped: ${testResults.skipped}`);
  
  const passRate = testResults.total > 0 
    ? Math.round((testResults.passed / (testResults.total - testResults.skipped)) * 100) 
    : 0;
  
  console.log(`Pass Rate: ${passRate}%`);
  
  // Write results to file
  const reportPath = path.join(__dirname, '..', 'pentest-prep', 'security-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\nDetailed report written to: ${reportPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log('EPAI Security Testing Script');
  console.log('===========================');
  
  try {
    await testRateLimiting();
    await testApiKeyAuthentication();
    await testSecurityHeaders();
    await testSqlInjectionProtection();
    await testXssProtection();
    
    // Generate summary report
    generateReport();
  } catch (error) {
    console.error('Error running security tests:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 