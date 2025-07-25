import { createClient } from '@supabase/supabase-js';

// Use production Supabase URL
const supabaseUrl = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPredictionHistory() {
  try {
    console.log('=== TESTING PREDICTION HISTORY ===');
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
    
    // Step 2: Test get-prediction-history Edge Function
    console.log('\n2. 📊 Testing get-prediction-history Edge Function...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/get-prediction-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`,
      },
      body: JSON.stringify({ page: 0, limit: 10 }),
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ get-prediction-history API is working!');
      console.log('📊 Response:', JSON.stringify(result, null, 2));
      
      if (result.data.predictions && result.data.predictions.length > 0) {
        console.log('📊 Found predictions:', result.data.predictions.length);
        result.data.predictions.forEach((pred, index) => {
          console.log(`   ${index + 1}. ${pred.model_type} - ${pred.prediction_value} - ${pred.created_at}`);
        });
      } else {
        console.log('📊 No predictions found in history');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ get-prediction-history API failed:', errorText);
    }
    
    console.log('\n✅ Prediction history test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPredictionHistory(); 