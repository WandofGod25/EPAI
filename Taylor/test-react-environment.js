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

console.log('🔍 Testing React Environment Simulation...\n');

async function testReactEnvironment() {
  // Create Supabase client exactly like the React app does
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('1. Testing Supabase client creation...');
    console.log('   URL:', supabaseUrl);
    console.log('   Anon Key length:', supabaseAnonKey.length);
    console.log('✅ Supabase client created successfully');

    // 2. Test authentication (like React app does)
    console.log('\n2. Testing authentication...');
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

    // 3. Test session retrieval (like React app does)
    console.log('\n3. Testing session retrieval...');
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session) {
      console.error('❌ No session available');
      return;
    }

    console.log('✅ Session retrieved successfully');
    console.log('   Access token length:', session.session.access_token.length);

    // 4. Test Edge Function call (exactly like useInsights hook)
    console.log('\n4. Testing Edge Function call (useInsights style)...');
    
    const { data, error } = await supabase.functions.invoke('get-insights', {
      method: 'POST'
    });

    if (error) {
      console.error('❌ Edge Function call failed:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      
      // Check if it's a network error
      if (error.message.includes('fetch')) {
        console.error('   This looks like a network/fetch error');
      }
      
      // Check if it's an authentication error
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.error('   This looks like an authentication error');
      }
      
      // Check if it's a CORS error
      if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        console.error('   This looks like a CORS error');
      }
      
      return;
    }

    console.log('✅ Edge Function call successful');
    console.log('   Insights count:', data?.insights?.length || 0);

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
        console.log(`     ✅ Call ${i} successful`);
      }
    }

    // 6. Test with different methods
    console.log('\n6. Testing different HTTP methods...');
    
    const methods = ['GET', 'POST'];
    for (const method of methods) {
      console.log(`   Testing ${method} method:`);
      const { data: methodData, error: methodError } = await supabase.functions.invoke('get-insights', {
        method: method
      });
      
      if (methodError) {
        console.error(`     ❌ ${method} failed:`, methodError.message);
      } else {
        console.log(`     ✅ ${method} successful`);
      }
    }

    // 7. Test error handling
    console.log('\n7. Testing error handling...');
    
    try {
      // Test with invalid function name
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

    console.log('\n🎉 React environment test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testReactEnvironment(); 