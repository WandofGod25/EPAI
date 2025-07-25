import { createClient } from '@supabase/supabase-js';

// Production Supabase credentials
const PROD_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PROD_URL, PROD_ANON_KEY);

async function testEdgeFunctionDirect() {
  console.log('🔍 Testing Edge Function directly...\n');

  try {
    // Authenticate
    console.log('1. 🔐 Authenticating...');
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
    console.log('   Session token length:', authData.session.access_token.length);

    // Test the Edge Function directly
    console.log('\n2. 📊 Testing get-insights Edge Function...');
    const { data, error } = await supabase.functions.invoke('get-insights', {
      method: 'POST'
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
      console.log('   Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Edge Function response:');
    console.log('   Raw response:', JSON.stringify(data, null, 2));

    if (data.insights && data.insights.length > 0) {
      console.log('\n   Insights found:');
      data.insights.forEach((insight, index) => {
        console.log(`   ${index + 1}. Model: ${insight.model_name}`);
        console.log(`      Prediction: ${JSON.stringify(insight.prediction_output)}`);
        console.log(`      ID: ${insight.id}`);
        console.log(`      Created: ${insight.created_at}`);
      });
    } else {
      console.log('   No insights returned from Edge Function');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testEdgeFunctionDirect(); 