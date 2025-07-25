#!/usr/bin/env node

/**
 * EPAI End-to-End API Tests
 * 
 * This script runs end-to-end tests for the EPAI API endpoints to ensure
 * they are functioning correctly in an integrated environment.
 * 
 * Usage:
 * node scripts/run-e2e-tests.js
 * 
 * Environment variables:
 * SUPABASE_URL - Supabase project URL
 * SUPABASE_SERVICE_ROLE_KEY - Supabase service role key for setup
 * TEST_PARTNER_EMAIL - Email for test partner account
 * TEST_PARTNER_PASSWORD - Password for test partner account
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const chalk = require('chalk');

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  testPartnerEmail: process.env.TEST_PARTNER_EMAIL || 'test-partner@example.com',
  testPartnerPassword: process.env.TEST_PARTNER_PASSWORD || 'Test123!@#',
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
};

// Check required environment variables
if (!CONFIG.supabaseServiceKey) {
  console.error(chalk.red('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required'));
  process.exit(1);
}

// Create Supabase clients
const adminClient = createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceKey);
let partnerClient = null;
let testApiKey = null;

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
};

// Helper function for logging
function log(message, type = 'info') {
  const prefix = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    error: chalk.red('✗'),
    warning: chalk.yellow('⚠'),
    debug: chalk.gray('➤'),
  };
  
  if (type === 'debug' && !CONFIG.verbose) {
    return;
  }
  
  console.log(`${prefix[type]} ${message}`);
}

// Helper function to run a test
async function runTest(name, testFn) {
  testResults.total++;
  
  try {
    log(`Running test: ${name}`, 'debug');
    await testFn();
    log(`Test passed: ${name}`, 'success');
    testResults.passed++;
    return true;
  } catch (error) {
    log(`Test failed: ${name}`, 'error');
    log(`Error: ${error.message}`, 'error');
    if (CONFIG.verbose && error.stack) {
      log(`Stack: ${error.stack}`, 'debug');
    }
    testResults.failed++;
    return false;
  }
}

// Helper function to create a test partner
async function createTestPartner() {
  log('Creating test partner account...', 'debug');
  
  // Check if the user already exists
  const { data: existingUser, error: userError } = await adminClient.auth.admin.listUsers();
  
  if (userError) {
    throw new Error(`Failed to list users: ${userError.message}`);
  }
  
  const existingTestUser = existingUser.users.find(user => user.email === CONFIG.testPartnerEmail);
  
  if (existingTestUser) {
    log('Test partner account already exists, using existing account', 'debug');
    return existingTestUser;
  }
  
  // Create a new user
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: CONFIG.testPartnerEmail,
    password: CONFIG.testPartnerPassword,
    email_confirm: true,
  });
  
  if (createError) {
    throw new Error(`Failed to create test partner: ${createError.message}`);
  }
  
  log('Test partner account created successfully', 'debug');
  return newUser.user;
}

// Helper function to authenticate as the test partner
async function authenticateTestPartner() {
  log('Authenticating as test partner...', 'debug');
  
  // Create a new Supabase client for the partner
  partnerClient = createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceKey);
  
  // Sign in as the partner
  const { data: signInData, error: signInError } = await partnerClient.auth.signInWithPassword({
    email: CONFIG.testPartnerEmail,
    password: CONFIG.testPartnerPassword,
  });
  
  if (signInError) {
    throw new Error(`Failed to authenticate test partner: ${signInError.message}`);
  }
  
  log('Test partner authenticated successfully', 'debug');
  return signInData;
}

// Helper function to get the partner's API key
async function getPartnerApiKey() {
  log('Getting partner API key...', 'debug');
  
  // Call the api-key-manager Edge Function
  const { data: apiKeyData, error: apiKeyError } = await partnerClient.functions.invoke('api-key-manager', {
    method: 'GET',
  });
  
  if (apiKeyError) {
    throw new Error(`Failed to get API key: ${apiKeyError.message}`);
  }
  
  if (!apiKeyData || !apiKeyData.api_key) {
    throw new Error('API key not found in response');
  }
  
  testApiKey = apiKeyData.api_key;
  log('Retrieved partner API key successfully', 'debug');
  return testApiKey;
}

// Helper function to generate test data
function generateTestData(eventType) {
  const baseData = {
    timestamp: new Date().toISOString(),
    source: 'e2e-test',
    version: '1.0.0',
  };
  
  switch (eventType) {
    case 'page_view':
      return {
        ...baseData,
        event_type: 'page_view',
        data: {
          url: 'https://example.com/test-page',
          referrer: 'https://example.com',
          title: 'Test Page',
          user_agent: 'E2E Test Agent',
          session_id: uuidv4(),
        },
      };
    
    case 'user_engagement':
      return {
        ...baseData,
        event_type: 'user_engagement',
        data: {
          user_id: `test-user-${Math.floor(Math.random() * 1000)}`,
          action_type: 'click',
          element_id: 'test-button',
          engagement_time: 120,
          session_id: uuidv4(),
        },
      };
    
    case 'event_attendance':
      return {
        ...baseData,
        event_type: 'event_attendance',
        data: {
          event_id: `event-${Math.floor(Math.random() * 1000)}`,
          venue_id: `venue-${Math.floor(Math.random() * 100)}`,
          attendee_count: Math.floor(Math.random() * 500) + 50,
          capacity: 1000,
          event_date: new Date().toISOString().split('T')[0],
        },
      };
    
    default:
      return {
        ...baseData,
        event_type: 'custom',
        data: {
          custom_field: 'custom_value',
          test_id: uuidv4(),
        },
      };
  }
}

// Test: Authentication Flow
async function testAuthenticationFlow() {
  await runTest('Partner signup and authentication', async () => {
    const partner = await createTestPartner();
    const authResult = await authenticateTestPartner();
    
    if (!authResult.session || !authResult.session.access_token) {
      throw new Error('Authentication failed: No access token received');
    }
  });
}

// Test: API Key Management
async function testApiKeyManagement() {
  await runTest('Get partner API key', async () => {
    const apiKey = await getPartnerApiKey();
    
    if (!apiKey || !apiKey.startsWith('epai_')) {
      throw new Error('Invalid API key format');
    }
  });
  
  await runTest('Regenerate partner API key', async () => {
    const oldApiKey = testApiKey;
    
    // Call the api-key-manager Edge Function to regenerate the key
    const { data: regenerateData, error: regenerateError } = await partnerClient.functions.invoke('api-key-manager', {
      method: 'POST',
      body: { regenerate: true },
    });
    
    if (regenerateError) {
      throw new Error(`Failed to regenerate API key: ${regenerateError.message}`);
    }
    
    if (!regenerateData || !regenerateData.api_key) {
      throw new Error('API key not found in regenerate response');
    }
    
    testApiKey = regenerateData.api_key;
    
    if (oldApiKey === testApiKey) {
      throw new Error('API key was not regenerated (same key returned)');
    }
    
    if (!testApiKey.startsWith('epai_')) {
      throw new Error('Invalid regenerated API key format');
    }
  });
}

// Test: Data Ingestion
async function testDataIngestion() {
  const eventTypes = ['page_view', 'user_engagement', 'event_attendance', 'custom'];
  
  for (const eventType of eventTypes) {
    await runTest(`Ingest ${eventType} event`, async () => {
      const testData = generateTestData(eventType);
      
      // Call the ingest Edge Function
      const response = await fetch(`${CONFIG.supabaseUrl}/functions/v1/ingest-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testApiKey}`,
        },
        body: JSON.stringify(testData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ingestion failed with status ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`Ingestion reported failure: ${result.message || 'No error message'}`);
      }
      
      if (!result.event_id) {
        throw new Error('No event_id returned from ingestion');
      }
    });
  }
  
  // Wait for insights to be generated
  log('Waiting for insights to be generated...', 'info');
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Test: Insights API
async function testInsightsApi() {
  await runTest('Get insights', async () => {
    // Call the get-insights Edge Function
    const { data: insightsData, error: insightsError } = await partnerClient.functions.invoke('get-insights', {
      method: 'GET',
    });
    
    if (insightsError) {
      throw new Error(`Failed to get insights: ${insightsError.message}`);
    }
    
    if (!Array.isArray(insightsData)) {
      throw new Error('Insights data is not an array');
    }
    
    // We should have at least one insight from our test data
    if (insightsData.length === 0) {
      throw new Error('No insights found');
    }
    
    // Verify insight structure
    const insight = insightsData[0];
    if (!insight.id || !insight.model_id || !insight.content) {
      throw new Error('Insight is missing required fields');
    }
  });
}

// Test: Models API
async function testModelsApi() {
  await runTest('Get models', async () => {
    // Call the get-models Edge Function
    const { data: modelsData, error: modelsError } = await partnerClient.functions.invoke('get-models', {
      method: 'GET',
    });
    
    if (modelsError) {
      throw new Error(`Failed to get models: ${modelsError.message}`);
    }
    
    if (!Array.isArray(modelsData)) {
      throw new Error('Models data is not an array');
    }
    
    // We should have at least one model
    if (modelsData.length === 0) {
      throw new Error('No models found');
    }
    
    // Verify model structure
    const model = modelsData[0];
    if (!model.id || !model.name || !model.description) {
      throw new Error('Model is missing required fields');
    }
  });
}

// Test: Logs API
async function testLogsApi() {
  await runTest('Get logs', async () => {
    // Call the logs RPC function
    const { data: logsData, error: logsError } = await partnerClient
      .rpc('get_logs_for_partner')
      .limit(10);
    
    if (logsError) {
      throw new Error(`Failed to get logs: ${logsError.message}`);
    }
    
    if (!Array.isArray(logsData)) {
      throw new Error('Logs data is not an array');
    }
    
    // We should have logs from our test activities
    if (logsData.length === 0) {
      throw new Error('No logs found');
    }
  });
}

// Test: Usage Stats API
async function testUsageStatsApi() {
  await runTest('Get usage stats', async () => {
    // Call the get-usage-stats Edge Function
    const { data: statsData, error: statsError } = await partnerClient.functions.invoke('get-usage-stats', {
      method: 'GET',
    });
    
    if (statsError) {
      throw new Error(`Failed to get usage stats: ${statsError.message}`);
    }
    
    // Verify stats structure
    if (!statsData.hasOwnProperty('events_count')) {
      throw new Error('Usage stats missing events_count');
    }
    
    if (!statsData.hasOwnProperty('insights_count')) {
      throw new Error('Usage stats missing insights_count');
    }
  });
}

// Test: Public Insight API
async function testPublicInsightApi() {
  await runTest('Get public insight', async () => {
    // Get an insight ID first
    const { data: insightsData, error: insightsError } = await partnerClient.functions.invoke('get-insights', {
      method: 'GET',
    });
    
    if (insightsError) {
      throw new Error(`Failed to get insights: ${insightsError.message}`);
    }
    
    if (!Array.isArray(insightsData) || insightsData.length === 0) {
      throw new Error('No insights found for public API test');
    }
    
    const insightId = insightsData[0].id;
    
    // Call the get-public-insight Edge Function
    const response = await fetch(`${CONFIG.supabaseUrl}/functions/v1/get-public-insight?id=${insightId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testApiKey}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Public insight API failed with status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.id || !result.content) {
      throw new Error('Public insight is missing required fields');
    }
    
    if (result.id !== insightId) {
      throw new Error('Public insight ID does not match requested ID');
    }
  });
}

// Test: Rate Limiting
async function testRateLimiting() {
  await runTest('API rate limiting', async () => {
    // Make multiple rapid requests to trigger rate limiting
    const requests = [];
    const requestCount = 15; // Should be enough to trigger rate limiting
    
    for (let i = 0; i < requestCount; i++) {
      requests.push(fetch(`${CONFIG.supabaseUrl}/functions/v1/get-models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
        },
      }));
    }
    
    // Wait for all requests to complete
    const responses = await Promise.all(requests);
    
    // At least one should be rate limited (429)
    const rateLimited = responses.some(response => response.status === 429);
    
    if (!rateLimited) {
      throw new Error('Rate limiting did not trigger as expected');
    }
  });
}

// Test: Security Headers
async function testSecurityHeaders() {
  await runTest('Security headers', async () => {
    // Make a request to check security headers
    const response = await fetch(`${CONFIG.supabaseUrl}/functions/v1/get-models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
      },
    });
    
    // Check for required security headers
    const requiredHeaders = [
      'x-content-type-options',
      'x-xss-protection',
      'x-frame-options',
      'referrer-policy',
    ];
    
    const missingHeaders = [];
    
    for (const header of requiredHeaders) {
      if (!response.headers.has(header)) {
        missingHeaders.push(header);
      }
    }
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
    }
  });
}

// Run all tests
async function runAllTests() {
  log('Starting EPAI end-to-end API tests', 'info');
  
  try {
    // Authentication and setup
    await testAuthenticationFlow();
    await testApiKeyManagement();
    
    // Core API tests
    await testDataIngestion();
    await testInsightsApi();
    await testModelsApi();
    await testLogsApi();
    await testUsageStatsApi();
    await testPublicInsightApi();
    
    // Security tests
    await testRateLimiting();
    await testSecurityHeaders();
    
    // Print test results
    log('\nTest Results:', 'info');
    log(`Total tests: ${testResults.total}`, 'info');
    log(`Passed: ${testResults.passed}`, 'success');
    log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
    log(`Skipped: ${testResults.skipped}`, testResults.skipped > 0 ? 'warning' : 'info');
    
    if (testResults.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the tests
runAllTests(); 