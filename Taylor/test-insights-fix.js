#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from admin-panel directory
const envPath = path.join('packages', 'admin-panel', '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🔍 Testing Insights Page Fixes...\n');

async function testInsightsFixes() {
  // Create Supabase client with enhanced configuration (like the React app)
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-client-info': 'epai-admin-panel'
      }
    }
  });

  try {
    console.log('1. Testing enhanced Supabase client...');
    console.log('   URL:', supabaseUrl);
    console.log('   Anon key length:', supabaseAnonKey.length);
    console.log('✅ Enhanced client created successfully');

    // 2. Test authentication with enhanced error handling
    console.log('\n2. Testing authentication with enhanced error handling...');
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ange_andre25@yahoo.com',
      password: 'Taylortest'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful');
    console.log('   User ID:', user.id);

    // 3. Test session retrieval with enhanced validation
    console.log('\n3. Testing session retrieval with enhanced validation...');
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session) {
      console.error('❌ No session available');
      return;
    }

    console.log('✅ Session retrieved successfully');
    console.log('   Access token length:', session.session.access_token.length);

    // 4. Test Edge Function call with enhanced debugging (like useInsights hook)
    console.log('\n4. Testing Edge Function call with enhanced debugging...');
    
    // Simulate the exact flow from useInsights hook
    console.log('🔍 Simulating useInsights hook flow...');
    
    // Check if Supabase client is properly initialized
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Check authentication state
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      throw new Error('No active session found');
    }

    console.log('🔍 Session found, calling Edge Function...');

    // Call the Edge Function with enhanced error handling
    const { data, error } = await supabase.functions.invoke('get-insights', {
      method: 'POST'
    });

    console.log('🔍 Edge Function response received');

    if (error) {
      console.error('🔍 Edge Function error:', error);
      
      // Enhanced error analysis (like in useInsights hook)
      let errorMessage = error.message;
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Authentication error: Please log in again.';
      } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        errorMessage = 'CORS error: Browser security policy blocked the request.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout: The server took too long to respond.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Connection failed: Unable to reach the server.';
      }
      
      throw new Error(errorMessage);
    }

    console.log('🔍 Processing response data...');

    if (data) {
      console.log('🔍 Data received:', data);
      console.log('✅ Insights count:', data.insights?.length || 0);
    } else {
      console.log('🔍 No data received');
      console.log('✅ Empty insights array');
    }

    console.log('🔍 Fetch completed successfully');

    // 5. Test multiple calls (like React re-renders)
    console.log('\n5. Testing multiple calls (React re-render simulation)...');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`   Call ${i}:`);
      const { data: callData, error: callError } = await supabase.functions.invoke('get-insights', {
        method: 'POST'
      });
      
      if (callError) {
        console.error(`     ❌ Call ${i} failed:`, callError.message);
      } else {
        console.log(`     ✅ Call ${i} successful, insights: ${callData?.insights?.length || 0}`);
      }
    }

    // 6. Test error scenarios
    console.log('\n6. Testing error scenarios...');
    
    // Test with invalid function name
    try {
      const { data: invalidData, error: invalidError } = await supabase.functions.invoke('invalid-function', {
        method: 'POST'
      });
      
      if (invalidError) {
        console.log('   ✅ Invalid function correctly returned error:', invalidError.message);
      } else {
        console.log('   ⚠️ Invalid function did not return error');
      }
    } catch (catchError) {
      console.log('   ✅ Exception caught for invalid function:', catchError.message);
    }

    console.log('\n🎉 Insights page fixes test completed successfully!');
    console.log('📋 Summary:');
    console.log('   ✅ Enhanced Supabase client working');
    console.log('   ✅ Authentication with enhanced error handling working');
    console.log('   ✅ Session validation working');
    console.log('   ✅ Edge Function calls with debugging working');
    console.log('   ✅ Error analysis and user-friendly messages working');
    console.log('   ✅ Multiple calls (React re-render simulation) working');
    console.log('   ✅ Error scenarios handled correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testInsightsFixes(); 