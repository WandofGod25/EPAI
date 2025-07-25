import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Test user credentials
const TEST_USER_EMAIL = 'ange_andre25@yahoo.com';
const TEST_USER_PASSWORD = 'Taylortest';

// Initialize Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0
};

// Helper function to log test results
function logTest(name, status, message = '') {
  const statusColors = {
    PASS: '\x1b[32m',
    FAIL: '\x1b[31m',
    SKIP: '\x1b[33m',
    INFO: '\x1b[36m'
  };
  
  const color = statusColors[status] || '\x1b[0m';
  const reset = '\x1b[0m';
  
  console.log(`${color}[${status}]${reset} ${name}${message ? ': ' + message : ''}`);
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else if (status === 'SKIP') testResults.skipped++;
  
  testResults.total++;
}

async function runTests() {
  console.log('\n🧪 Starting EPAI Application Tests\n');
  
  let session = null;
  let apiKey = null;
  let partnerId = null;
  
  try {
    // 1. Test database connection
    try {
      logTest('Database Connection', 'INFO', 'Testing connection to Supabase');
      const { data, error } = await supabaseAdmin.from('partners').select('count').limit(1);
      
      if (error) throw error;
      logTest('Database Connection', 'PASS');
    } catch (error) {
      logTest('Database Connection', 'FAIL', error.message);
      console.log('Aborting tests due to database connection failure');
      return;
    }
    
    // 2. Test authentication
    try {
      logTest('User Authentication', 'INFO', 'Testing login with test user');
      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      if (error) throw error;
      if (!data.session) throw new Error('No session returned');
      
      session = data.session;
      logTest('User Authentication', 'PASS', `User ID: ${data.user.id}`);
    } catch (error) {
      logTest('User Authentication', 'FAIL', error.message);
      console.log('Attempting to create test user...');
      
      try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
          email_confirm: true
        });
        
        if (error) throw error;
        
        logTest('Test User Creation', 'PASS', `User ID: ${data.user.id}`);
        
        // Try login again
        const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        });
        
        if (loginError) throw loginError;
        session = loginData.session;
        logTest('User Authentication (Retry)', 'PASS');
      } catch (createError) {
        logTest('Test User Creation', 'FAIL', createError.message);
        console.log('Aborting tests due to authentication failure');
        return;
      }
    }
    
    // 3. Test partner record
    try {
      logTest('Partner Record', 'INFO', 'Checking if partner record exists for test user');
      
      const { data, error } = await supabaseAdmin
        .from('partners')
        .select('id, name, user_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('No partner record found');
      
      partnerId = data.id;
      logTest('Partner Record', 'PASS', `Partner ID: ${data.id}, Name: ${data.name}`);
    } catch (error) {
      logTest('Partner Record', 'FAIL', error.message);
      
      try {
        console.log('Attempting to create partner record...');
        const { data, error } = await supabaseAdmin
          .from('partners')
          .insert({ 
            name: 'Test Partner', 
            user_id: session.user.id 
          })
          .select()
          .single();
        
        if (error) throw error;
        partnerId = data.id;
        logTest('Partner Record Creation', 'PASS', `Partner ID: ${data.id}`);
      } catch (createError) {
        logTest('Partner Record Creation', 'FAIL', createError.message);
      }
    }
    
    // 4. Test API key
    try {
      logTest('API Key', 'INFO', 'Checking if API key exists for partner');
      
      const { data, error } = await supabaseAdmin
        .from('api_keys')
        .select('id, key')
        .eq('partner_id', partnerId)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('No API key found');
      
      apiKey = data.key;
      logTest('API Key', 'PASS', `API Key ID: ${data.id}`);
    } catch (error) {
      logTest('API Key', 'FAIL', error.message);
      
      try {
        console.log('Attempting to create API key...');
        const newApiKey = generateApiKey();
        
        const { data, error } = await supabaseAdmin
          .from('api_keys')
          .insert({ 
            key: newApiKey,
            partner_id: partnerId,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        apiKey = newApiKey;
        logTest('API Key Creation', 'PASS', `API Key ID: ${data.id}`);
      } catch (createError) {
        logTest('API Key Creation', 'FAIL', createError.message);
      }
    }
    
    // 5. Test Edge Functions
    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    });
    
    // 5.1 Test get-models function
    try {
      logTest('Edge Function: get-models', 'INFO', 'Testing get-models function');
      
      const { data, error } = await supabaseWithAuth.functions.invoke('get-models');
      
      if (error) throw error;
      if (!data || !Array.isArray(data)) throw new Error('Invalid response format');
      
      logTest('Edge Function: get-models', 'PASS', `Received ${data.length} models`);
    } catch (error) {
      logTest('Edge Function: get-models', 'FAIL', error.message);
    }
    
    // 5.2 Test api-key-manager function
    try {
      logTest('Edge Function: api-key-manager', 'INFO', 'Testing api-key-manager function');
      
      const { data, error } = await supabaseWithAuth.functions.invoke('api-key-manager', {
        body: { action: 'get' }
      });
      
      if (error) throw error;
      if (!data || !data.key) throw new Error('Invalid response format');
      
      logTest('Edge Function: api-key-manager', 'PASS', 'Successfully retrieved API key');
    } catch (error) {
      logTest('Edge Function: api-key-manager', 'FAIL', error.message);
    }
    
    // 6. Test Frontend Access
    try {
      logTest('Frontend Access', 'INFO', 'Testing access to admin panel frontend');
      
      const response = await fetch('http://localhost:5174/');
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      const text = await response.text();
      if (!text.includes('<!DOCTYPE html>')) throw new Error('Invalid HTML response');
      
      logTest('Frontend Access', 'PASS', 'Admin panel frontend is accessible');
    } catch (error) {
      logTest('Frontend Access', 'FAIL', error.message);
    }
    
    // 7. Test API key validation
    if (apiKey) {
      try {
        logTest('API Key Validation', 'INFO', 'Testing API key validation');
        
        const response = await fetch(`${supabaseUrl}/functions/v1/get-public-insight`, {
          headers: {
            'apikey': apiKey
          }
        });
        
        // Note: We're checking for 200 or 404 (not found) as valid responses
        // 401 would indicate an invalid API key
        if (response.status === 401) {
          throw new Error('API key validation failed');
        }
        
        logTest('API Key Validation', 'PASS', `Response status: ${response.status}`);
      } catch (error) {
        logTest('API Key Validation', 'FAIL', error.message);
      }
    } else {
      logTest('API Key Validation', 'SKIP', 'No API key available for testing');
    }
    
  } catch (error) {
    console.error('Unexpected error during tests:', error);
  } finally {
    // Print test summary
    console.log('\n📊 Test Summary');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Skipped: ${testResults.skipped}`);
    
    // Provide recommendations based on test results
    console.log('\n📋 Recommendations');
    
    if (testResults.failed === 0) {
      console.log('✅ All tests passed! The application appears to be working correctly.');
      console.log(`You can access the admin panel at http://localhost:5174/`);
      console.log(`Login with: ${TEST_USER_EMAIL} / ${TEST_USER_PASSWORD}`);
    } else {
      console.log('❌ Some tests failed. Here are some troubleshooting steps:');
      
      if (testResults.failed > 0) {
        console.log('1. Check that Supabase is running locally');
        console.log('2. Verify the database schema is correct');
        console.log('3. Ensure the admin panel is running at http://localhost:5174');
        console.log('4. Check that the .env file in packages/admin-panel has the correct values');
      }
    }
  }
}

// Helper function to generate an API key
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

runTests(); 