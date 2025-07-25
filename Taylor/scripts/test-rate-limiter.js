#!/usr/bin/env node

/**
 * Test script for the rate limiter
 * 
 * This script sends multiple requests to the rate-limiter-test endpoint
 * to verify that the rate limiting is working correctly.
 * 
 * Usage: node test-rate-limiter.js
 */

const fetch = require('node-fetch');

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
  endpoint: 'functions/v1/rate-limiter-test',
  testKey: 'test-key-' + Math.floor(Math.random() * 1000),
  requestCount: 10, // Number of requests to send
  delayBetweenRequests: 500, // Delay between requests in ms
};

// Function to send a request to the rate limiter test endpoint
async function sendRequest(requestNumber) {
  try {
    const response = await fetch(`${config.supabaseUrl}/${config.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testKey: config.testKey }),
    });

    const data = await response.json();
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const status = response.status;

    console.log(`Request ${requestNumber}: Status ${status}, Remaining: ${remaining || 'N/A'}`);
    
    if (status === 429) {
      console.log(`  Rate limited! Reset: ${response.headers.get('X-RateLimit-Reset') || 'N/A'}`);
    } else {
      console.log(`  Response: ${JSON.stringify(data)}`);
    }

    return { status, data, remaining };
  } catch (error) {
    console.error(`Error in request ${requestNumber}:`, error.message);
    return { status: 'error', error: error.message };
  }
}

// Main function to run the test
async function runTest() {
  console.log('Rate Limiter Test');
  console.log('================');
  console.log(`Endpoint: ${config.supabaseUrl}/${config.endpoint}`);
  console.log(`Test Key: ${config.testKey}`);
  console.log(`Request Count: ${config.requestCount}`);
  console.log(`Delay Between Requests: ${config.delayBetweenRequests}ms`);
  console.log('');

  const results = {
    successful: 0,
    rateLimited: 0,
    errors: 0,
  };

  // Send requests sequentially
  for (let i = 1; i <= config.requestCount; i++) {
    const result = await sendRequest(i);
    
    if (result.status === 200) {
      results.successful++;
    } else if (result.status === 429) {
      results.rateLimited++;
    } else {
      results.errors++;
    }
    
    // Wait before sending the next request
    if (i < config.requestCount) {
      await new Promise(resolve => setTimeout(resolve, config.delayBetweenRequests));
    }
  }

  // Print summary
  console.log('');
  console.log('Test Summary');
  console.log('===========');
  console.log(`Successful Requests: ${results.successful}`);
  console.log(`Rate Limited Requests: ${results.rateLimited}`);
  console.log(`Errors: ${results.errors}`);
  
  // Validate test results
  console.log('');
  if (results.rateLimited > 0) {
    console.log('✅ Rate limiter is working correctly!');
  } else {
    console.log('❌ Rate limiter test failed - no requests were rate limited.');
  }
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 