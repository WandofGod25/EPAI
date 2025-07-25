import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup paths and environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'test.env') });

// Constants
// Use the remote URL for testing deployed functions
const API_BASE_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const FUNCTIONS_URL = `${API_BASE_URL}/functions/v1`;

// Test endpoints
const ENDPOINTS = {
  ingest: `${FUNCTIONS_URL}/ingest-v2`,
  publicInsight: `${FUNCTIONS_URL}/get-public-insight`,
};

async function testIngestFunction() {
  console.log('Testing ingest-v2 function...');
  
  try {
    // Send a test request with a dummy API key
    const response = await fetch(ENDPOINTS.ingest, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'test-api-key'
      },
      body: JSON.stringify({
        eventType: "user_profile_update",
        payload: {
          userId: "test-user",
          firstName: "Test",
          lastName: "User"
        }
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const responseBody = await response.text();
    console.log('Response body:', responseBody);
    
    // Check if the response has security headers
    const securityHeaders = [
      'x-content-type-options',
      'x-xss-protection',
      'x-frame-options',
      'content-security-policy',
      'strict-transport-security',
      'referrer-policy'
    ];
    
    console.log('\nSecurity Headers Check:');
    for (const header of securityHeaders) {
      const value = response.headers.get(header);
      console.log(`${header}: ${value || 'missing'}`);
    }
    
    // Check CORS headers
    console.log('\nCORS Headers Check:');
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];
    
    for (const header of corsHeaders) {
      const value = response.headers.get(header);
      console.log(`${header}: ${value || 'missing'}`);
    }
    
  } catch (error) {
    console.error('Error testing function:', error);
  }
}

async function testOptionsRequest() {
  console.log('\nTesting OPTIONS request...');
  
  try {
    // Send an OPTIONS request to check CORS headers
    const response = await fetch(ENDPOINTS.ingest, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, apikey'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    // Check CORS headers
    console.log('\nCORS Headers Check:');
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];
    
    for (const header of corsHeaders) {
      const value = response.headers.get(header);
      console.log(`${header}: ${value || 'missing'}`);
    }
    
  } catch (error) {
    console.error('Error testing OPTIONS request:', error);
  }
}

async function testGetModelsFunction() {
  console.log('\nTesting get-models function...');
  
  try {
    // Send a test request
    const response = await fetch(`${FUNCTIONS_URL}/get-models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const responseBody = await response.text();
    console.log('Response body:', responseBody);
    
  } catch (error) {
    console.error('Error testing function:', error);
  }
}

// Run the tests
async function main() {
  await testIngestFunction();
  await testOptionsRequest();
  await testGetModelsFunction();
}

main(); 