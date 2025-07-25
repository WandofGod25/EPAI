import { createClient } from '@supabase/supabase-js';

// Use production Supabase URL
const supabaseUrl = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPredictionProduction() {
  try {
    console.log('=== PREDICTION API TEST (PRODUCTION) ===');
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
    
    // Step 2: Get partner information
    console.log('\n2. 📋 Getting partner information...');
    
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();
    
    if (partnerError || !partner) {
      console.error('❌ Partner lookup failed:', partnerError);
      return;
    }
    
    console.log('✅ Partner found:', partner.id);
    
    // Step 3: Test prediction API
    console.log('\n3. 🚀 Testing prediction API...');
    
    const testData = {
      modelType: 'attendance_forecast',
      venue: 'Madison Square Garden',
      eventDate: '2025-02-15',
      genre: 'rock',
      ticketPrice: 75,
      marketingBudget: 50000,
      venueCapacity: 20000
    };
    
    console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${supabaseUrl}/functions/v1/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`,
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📥 Response text:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ API call successful!');
      console.log('📊 Parsed response:', JSON.stringify(result, null, 2));
      
      // Step 4: Check if data was stored in database
      console.log('\n4. 📊 Checking database storage...');
      
      const { data: requests, error: requestsError } = await supabase
        .from('prediction_requests')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (requestsError) {
        console.error('❌ Error fetching prediction requests:', requestsError);
      } else {
        console.log('📊 Recent prediction requests:', requests?.length || 0);
        if (requests && requests.length > 0) {
          console.log('📊 Latest request:', JSON.stringify(requests[0], null, 2));
        }
      }
      
      const { data: results, error: resultsError } = await supabase
        .from('prediction_results')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (resultsError) {
        console.error('❌ Error fetching prediction results:', resultsError);
      } else {
        console.log('📊 Recent prediction results:', results?.length || 0);
        if (results && results.length > 0) {
          console.log('📊 Latest result:', JSON.stringify(results[0], null, 2));
        }
      }
      
      console.log('\n✅ Prediction system is working correctly!');
      
    } else {
      console.error('❌ API call failed');
      
      // Try to parse error response
      try {
        const errorResult = JSON.parse(responseText);
        console.error('❌ Error details:', JSON.stringify(errorResult, null, 2));
      } catch (e) {
        console.error('❌ Could not parse error response');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testPredictionProduction(); 