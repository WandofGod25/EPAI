import { createClient } from '@supabase/supabase-js';

// Production Supabase credentials
const PROD_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PROD_URL, PROD_ANON_KEY);

async function testGetModelsWithAuth() {
  console.log('🔍 Testing get-models Edge Function with authentication...\n');

  try {
    // First, try to authenticate
    console.log('1. 🔐 Attempting authentication...');
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

    // Now test the get-models Edge Function
    console.log('\n2. 📊 Testing get-models Edge Function...');
    const { data, error } = await supabase.functions.invoke('get-models', {
      body: { page: 0 }
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
      return;
    }

    console.log('✅ Edge Function response:');
    console.log('   Models count:', data.count);
    console.log('   Models array length:', data.models ? data.models.length : 0);

    if (data.models && data.models.length > 0) {
      console.log('\n   Models found:');
      data.models.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.model_name} (v${model.model_version})`);
        console.log(`      Description: ${model.description}`);
        console.log(`      ID: ${model.id}`);
      });
    } else {
      console.log('   No models returned from Edge Function');
    }

    // Also test direct database access
    console.log('\n3. 🗄️ Testing direct database access...');
    const { data: dbModels, error: dbError } = await supabase
      .from('models')
      .select('*');

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return;
    }

    console.log(`   Direct DB access: ${dbModels.length} models found`);
    if (dbModels.length > 0) {
      dbModels.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.model_name || model.name} (${model.model_version || 'v1.0'})`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testGetModelsWithAuth(); 