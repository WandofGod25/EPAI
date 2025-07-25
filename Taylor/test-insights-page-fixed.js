import { createClient } from '@supabase/supabase-js';

// Use production Supabase URL
const supabaseUrl = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsightsPageFixed() {
  try {
    console.log('=== TESTING INSIGHTS PAGE (FIXED) ===');
    console.log('Supabase URL:', supabaseUrl);
    
    // Step 1: Authenticate with existing user
    console.log('\n1. 🔐 Authenticating with existing user...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ange_andre25@yahoo.com',
      password: 'Taylortest'
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError);
      return;
    }
    
    console.log('✅ Authentication successful');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    
    // Step 2: Test get-insights Edge Function directly
    console.log('\n2. 📊 Testing get-insights Edge Function...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/get-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`,
      },
      body: JSON.stringify({ page: 0 })
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ get-insights API is working!');
      console.log('📊 Response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ get-insights API failed:', errorText);
    }
    
    // Step 3: Test frontend-style request (simulating what the React app does)
    console.log('\n3. 🌐 Testing frontend-style request...');
    
    const frontendResponse = await fetch(`${supabaseUrl}/functions/v1/get-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Origin': 'http://localhost:5175',
        'Referer': 'http://localhost:5175/'
      },
      body: JSON.stringify({ page: 0 })
    });
    
    console.log('📥 Frontend response status:', frontendResponse.status);
    console.log('📥 Frontend response headers:', Object.fromEntries(frontendResponse.headers.entries()));
    
    if (frontendResponse.ok) {
      const frontendResult = await frontendResponse.json();
      console.log('✅ Frontend-style request is working!');
      console.log('📊 Frontend response:', JSON.stringify(frontendResult, null, 2));
    } else {
      const frontendErrorText = await frontendResponse.text();
      console.error('❌ Frontend-style request failed:', frontendErrorText);
    }
    
    console.log('\n✅ Insights page test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testInsightsPageFixed(); 