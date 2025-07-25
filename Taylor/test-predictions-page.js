import { createClient } from '@supabase/supabase-js';

// Use production Supabase URL
const supabaseUrl = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPredictionsPage() {
  try {
    console.log('=== TESTING PREDICTIONS PAGE ===');
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
    
    // Step 3: Check if there are any prediction requests and results
    console.log('\n3. 📊 Checking prediction data...');
    
    const { data: requests, error: requestsError } = await supabase
      .from('prediction_requests')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (requestsError) {
      console.error('❌ Error fetching prediction requests:', requestsError);
    } else {
      console.log('📊 Prediction requests found:', requests?.length || 0);
      if (requests && requests.length > 0) {
        console.log('📊 Recent requests:');
        requests.forEach((req, index) => {
          console.log(`   ${index + 1}. ${req.model_type} - ${req.status} - ${req.created_at}`);
        });
      }
    }
    
    const { data: results, error: resultsError } = await supabase
      .from('prediction_results')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (resultsError) {
      console.error('❌ Error fetching prediction results:', resultsError);
    } else {
      console.log('📊 Prediction results found:', results?.length || 0);
      if (results && results.length > 0) {
        console.log('📊 Recent results:');
        results.forEach((result, index) => {
          console.log(`   ${index + 1}. Prediction: ${result.prediction_value} - Confidence: ${result.confidence_score} - ${result.created_at}`);
        });
      }
    }
    
    // Step 4: Test a new prediction to create some data
    console.log('\n4. 🚀 Creating a new prediction...');
    
    const testData = {
      modelType: 'attendance_forecast',
      venue: 'Test Arena',
      eventDate: '2025-03-15',
      genre: 'pop',
      ticketPrice: 50,
      marketingBudget: 30000,
      venueCapacity: 15000
    };
    
    const response = await fetch(`${supabaseUrl}/functions/v1/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`,
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📥 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ New prediction created successfully!');
      console.log('📊 Response:', JSON.stringify(result, null, 2));
      
      // Step 5: Check if the new prediction appears in the database
      console.log('\n5. 📊 Checking for new prediction data...');
      
      const { data: newRequests, error: newRequestsError } = await supabase
        .from('prediction_requests')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (newRequestsError) {
        console.error('❌ Error fetching new prediction requests:', newRequestsError);
      } else {
        console.log('📊 Updated prediction requests:', newRequests?.length || 0);
        if (newRequests && newRequests.length > 0) {
          console.log('📊 Latest requests:');
          newRequests.forEach((req, index) => {
            console.log(`   ${index + 1}. ${req.model_type} - ${req.status} - ${req.created_at}`);
          });
        }
      }
      
      const { data: newResults, error: newResultsError } = await supabase
        .from('prediction_results')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (newResultsError) {
        console.error('❌ Error fetching new prediction results:', newResultsError);
      } else {
        console.log('📊 Updated prediction results:', newResults?.length || 0);
        if (newResults && newResults.length > 0) {
          console.log('📊 Latest results:');
          newResults.forEach((result, index) => {
            console.log(`   ${index + 1}. Prediction: ${result.prediction_value} - Confidence: ${result.confidence_score} - ${result.created_at}`);
          });
        }
      }
      
    } else {
      const errorText = await response.text();
      console.error('❌ New prediction failed:', errorText);
    }
    
    console.log('\n✅ Predictions page test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPredictionsPage(); 