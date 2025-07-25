import { createClient } from '@supabase/supabase-js';

// Use production Supabase URL and anon key
const supabaseUrl = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPredictionData() {
  try {
    console.log('=== CHECKING PREDICTION DATA ===');
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
    
    // Step 2: Check prediction_requests table
    console.log('\n2. 📋 Checking prediction_requests table...');
    
    const { data: requests, error: requestsError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT 
          id, 
          partner_id, 
          model_type, 
          venue, 
          event_date, 
          status, 
          created_at 
        FROM prediction_requests 
        ORDER BY created_at DESC 
        LIMIT 5;
      `
    });
    
    if (requestsError) {
      console.error('❌ Error checking prediction_requests:', requestsError);
    } else {
      console.log('📊 Recent prediction requests:', requests?.length || 0);
      if (requests && requests.length > 0) {
        console.log('📊 Latest requests:');
        requests.forEach((req, index) => {
          console.log(`   ${index + 1}. ${req.model_type} - ${req.venue || 'N/A'} - ${req.status} - ${req.created_at}`);
        });
      }
    }
    
    // Step 3: Check prediction_results table
    console.log('\n3. 📊 Checking prediction_results table...');
    
    const { data: results, error: resultsError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT 
          id, 
          request_id, 
          partner_id, 
          prediction_value, 
          confidence_score, 
          created_at 
        FROM prediction_results 
        ORDER BY created_at DESC 
        LIMIT 5;
      `
    });
    
    if (resultsError) {
      console.error('❌ Error checking prediction_results:', resultsError);
    } else {
      console.log('📊 Recent prediction results:', results?.length || 0);
      if (results && results.length > 0) {
        console.log('📊 Latest results:');
        results.forEach((result, index) => {
          console.log(`   ${index + 1}. Prediction: ${result.prediction_value} - Confidence: ${result.confidence_score} - ${result.created_at}`);
        });
      }
    }
    
    // Step 4: Check partner data
    console.log('\n4. 👥 Checking partner data...');
    
    const { data: partner, error: partnerError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT 
          id, 
          user_id, 
          name, 
          created_at 
        FROM partners 
        WHERE user_id = '${authData.user.id}';
      `
    });
    
    if (partnerError) {
      console.error('❌ Error checking partner data:', partnerError);
    } else {
      console.log('📊 Partner data:', partner?.length || 0);
      if (partner && partner.length > 0) {
        console.log('📊 Partner:', JSON.stringify(partner[0], null, 2));
      }
    }
    
    console.log('\n✅ Prediction data check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPredictionData(); 