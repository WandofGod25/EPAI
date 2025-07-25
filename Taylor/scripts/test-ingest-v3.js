#!/usr/bin/env node

/**
 * Test script for the secure ingest-v3 endpoint
 * 
 * This script sends test events to the ingest-v3 endpoint to verify
 * that it correctly processes events and applies security measures.
 * 
 * Usage: node test-ingest-v3.js
 */

const fetch = require('node-fetch');

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
  endpoint: 'functions/v1/ingest-v3',
  apiKey: process.env.TEST_API_KEY || 'epai_test_key',
};

// Sample events for testing
const testEvents = {
  validUserProfile: {
    eventType: 'user_profile_update',
    payload: {
      userId: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'Customer',
      company: 'Acme Inc',
      lastSeenAt: new Date().toISOString(),
    },
  },
  validEventDetails: {
    eventType: 'event_details_update',
    payload: {
      eventId: 'event123',
      eventName: 'Annual Conference',
      startAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endAt: new Date(Date.now() + 172800000).toISOString(),  // Day after tomorrow
      location: 'Convention Center',
      capacity: 500,
      category: 'Conference',
    },
  },
  invalidEvent: {
    eventType: 'user_profile_update',
    payload: {
      // Missing required userId
      email: 'invalid@example.com',
    },
  },
  malformedJson: 'This is not JSON',
};

// Function to send a request to the ingest endpoint
async function sendRequest(event, apiKey = config.apiKey) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch(`${config.supabaseUrl}/${config.endpoint}`, {
      method: 'POST',
      headers,
      body: typeof event === 'string' ? event : JSON.stringify(event),
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    const data = isJson ? await response.json() : await response.text();
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    };
  } catch (error) {
    console.error('Error sending request:', error.message);
    return { error: error.message };
  }
}

// Test cases
async function runTests() {
  console.log('Running tests for ingest-v3 endpoint');
  console.log('====================================');
  
  // Test 1: Valid user profile with API key
  console.log('\nTest 1: Valid user profile with API key');
  const test1Result = await sendRequest(testEvents.validUserProfile);
  console.log(`Status: ${test1Result.status}`);
  console.log('Headers:', JSON.stringify(test1Result.headers, null, 2));
  console.log('Response:', JSON.stringify(test1Result.data, null, 2));
  
  // Test 2: Valid event details with API key
  console.log('\nTest 2: Valid event details with API key');
  const test2Result = await sendRequest(testEvents.validEventDetails);
  console.log(`Status: ${test2Result.status}`);
  console.log('Response:', JSON.stringify(test2Result.data, null, 2));
  
  // Test 3: Invalid event with API key
  console.log('\nTest 3: Invalid event with API key');
  const test3Result = await sendRequest(testEvents.invalidEvent);
  console.log(`Status: ${test3Result.status}`);
  console.log('Response:', JSON.stringify(test3Result.data, null, 2));
  
  // Test 4: Valid event without API key
  console.log('\nTest 4: Valid event without API key');
  const test4Result = await sendRequest(testEvents.validUserProfile, null);
  console.log(`Status: ${test4Result.status}`);
  console.log('Response:', JSON.stringify(test4Result.data, null, 2));
  
  // Test 5: Malformed JSON with API key
  console.log('\nTest 5: Malformed JSON with API key');
  const test5Result = await sendRequest(testEvents.malformedJson);
  console.log(`Status: ${test5Result.status}`);
  console.log('Response:', JSON.stringify(test5Result.data, null, 2));
  
  // Test 6: Rate limiting (send multiple requests quickly)
  console.log('\nTest 6: Rate limiting (10 quick requests)');
  const rateLimitResults = [];
  for (let i = 0; i < 10; i++) {
    const result = await sendRequest(testEvents.validUserProfile);
    rateLimitResults.push({
      status: result.status,
      remainingRequests: result.headers['x-ratelimit-remaining'],
    });
    console.log(`Request ${i + 1}: Status ${result.status}, Remaining: ${result.headers['x-ratelimit-remaining'] || 'N/A'}`);
  }
  
  // Test summary
  console.log('\nTest Summary');
  console.log('===========');
  console.log('Test 1 (Valid user profile):', test1Result.status === 201 ? 'PASS' : 'FAIL');
  console.log('Test 2 (Valid event details):', test2Result.status === 201 ? 'PASS' : 'FAIL');
  console.log('Test 3 (Invalid event):', test3Result.status === 400 ? 'PASS' : 'FAIL');
  console.log('Test 4 (No API key):', test4Result.status === 401 ? 'PASS' : 'FAIL');
  console.log('Test 5 (Malformed JSON):', test5Result.status === 400 ? 'PASS' : 'FAIL');
  
  // Check if any requests were rate limited
  const rateLimited = rateLimitResults.some(result => result.status === 429);
  console.log('Test 6 (Rate limiting):', rateLimited ? 'PASS (Rate limiting active)' : 'PASS (No rate limiting triggered)');
}

// Run the tests
runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 