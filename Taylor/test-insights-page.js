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

console.log('🔍 Testing Insights Page Issues...\n');

async function testInsightsPage() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. Test authentication
    console.log('1. Testing authentication...');
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

    // 2. Test Edge Function directly with session
    console.log('\n2. Testing get-insights Edge Function with session...');
    
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.error('❌ No session available');
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/get-insights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      }
    });

    console.log('   Response status:', response.status);
    console.log('   Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge Function failed:', errorText);
      return;
    }

    const insightsData = await response.json();
    console.log('✅ Edge Function successful');
    console.log('   Insights count:', insightsData.insights?.length || 0);

    // 3. Test frontend-style request (simulating what the React app does)
    console.log('\n3. Testing frontend-style request...');
    
    const frontendResponse = await fetch(`${supabaseUrl}/functions/v1/get-insights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'x-client-info': 'supabase-js/2.0.0'
      }
    });

    console.log('   Frontend response status:', frontendResponse.status);
    
    if (!frontendResponse.ok) {
      const errorText = await frontendResponse.text();
      console.error('❌ Frontend-style request failed:', errorText);
      return;
    }

    const frontendData = await frontendResponse.json();
    console.log('✅ Frontend-style request successful');
    console.log('   Insights count:', frontendData.insights?.length || 0);

    // 4. Test CORS headers
    console.log('\n4. Testing CORS headers...');
    const corsResponse = await fetch(`${supabaseUrl}/functions/v1/get-insights`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization, apikey, x-client-info'
      }
    });

    console.log('   CORS preflight status:', corsResponse.status);
    console.log('   CORS headers:', {
      'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
    });

    // 5. Test with different origins
    console.log('\n5. Testing with different origins...');
    const origins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://localhost:5173'
    ];

    for (const origin of origins) {
      const originResponse = await fetch(`${supabaseUrl}/functions/v1/get-insights`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Origin': origin
        }
      });

      console.log(`   Origin ${origin}: ${originResponse.status}`);
    }

    // 6. Check browser console simulation
    console.log('\n6. Simulating browser console errors...');
    
    // Test what happens when the request fails in a browser-like environment
    const browserResponse = await fetch(`${supabaseUrl}/functions/v1/get-insights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!browserResponse.ok) {
      console.log('   Browser simulation failed - this might be the issue!');
      const errorText = await browserResponse.text();
      console.log('   Error details:', errorText);
    } else {
      console.log('   Browser simulation successful');
    }

    console.log('\n🎉 Insights page test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testInsightsPage(); 