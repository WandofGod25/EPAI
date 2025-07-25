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

console.log('🔍 Testing Frontend Insights API Call...\n');

async function testFrontendInsights() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. Authenticate like the frontend does
    console.log('1. Authenticating like frontend...');
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ange_andre25@yahoo.com',
      password: 'Taylortest'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful');

    // 2. Simulate exactly what useInsights hook does
    console.log('\n2. Simulating useInsights hook...');
    
    // This is exactly what the useInsights hook does:
    const { data, error } = await supabase.functions.invoke('get-insights', {
      method: 'POST'
    });

    if (error) {
      console.error('❌ supabase.functions.invoke failed:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ supabase.functions.invoke successful');
    console.log('   Data:', JSON.stringify(data, null, 2));

    // 3. Test the exact same call but with more debugging
    console.log('\n3. Testing with detailed debugging...');
    
    const { data: session } = await supabase.auth.getSession();
    console.log('   Session available:', !!session.session);
    console.log('   Access token length:', session.session?.access_token?.length || 0);

    // 4. Test what happens if we call it multiple times (like React might)
    console.log('\n4. Testing multiple calls (like React re-renders)...');
    
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

    // 5. Test error handling like the frontend does
    console.log('\n5. Testing error handling...');
    
    try {
      const { data: errorData, error: testError } = await supabase.functions.invoke('get-insights', {
        method: 'POST',
        body: { invalid: 'data' } // This might cause an error
      });

      if (testError) {
        console.log('   Expected error caught:', testError.message);
      } else {
        console.log('   No error with invalid data');
      }
    } catch (catchError) {
      console.log('   Caught exception:', catchError.message);
    }

    console.log('\n🎉 Frontend insights test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testFrontendInsights(); 