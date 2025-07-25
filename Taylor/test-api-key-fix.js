import { createClient } from '@supabase/supabase-js';

// Production Supabase credentials with service role
const PROD_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PROD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQyMTY4OSwiZXhwIjoyMDY0OTk3Njg5fQ.0D4A99QwPrmU_ecC5KkAQl4isJ3vspSWkYjPYvnEYaU';

const supabase = createClient(PROD_URL, PROD_SERVICE_KEY);

async function testApiKeyFix() {
  console.log('🔧 Testing and fixing API key management...\n');

  try {
    // Get the partner ID
    console.log('1. 📋 Getting partner ID...');
    const { data: insights, error: insightsError } = await supabase
      .from('insights')
      .select('partner_id')
      .limit(1);

    if (insightsError || insights.length === 0) {
      console.error('❌ Error getting partner ID:', insightsError);
      return;
    }

    const partnerId = insights[0].partner_id;
    console.log(`📋 Using partner ID: ${partnerId}`);

    // Check if API key exists
    console.log('\n2. 🔍 Checking existing API keys...');
    const { data: existingKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('partner_id', partnerId);

    if (keysError) {
      console.error('❌ Error checking API keys:', keysError);
      return;
    }

    console.log(`📋 Found ${existingKeys.length} API keys for partner`);

    if (existingKeys.length === 0) {
      console.log('\n3. 🔑 Creating API key...');
      
      // Generate a new API key
      const { data: newKey, error: createError } = await supabase.rpc('regenerate_api_key_for_partner');
      
      if (createError) {
        console.error('❌ Error creating API key:', createError);
        return;
      }

      console.log('✅ API key created successfully');
      console.log(`   API Key: ${newKey[0].api_key}`);
    } else {
      console.log('✅ API key already exists');
      console.log(`   API Key: ${existingKeys[0].api_key}`);
    }

    // Now test the Edge Function with authentication
    console.log('\n4. 🧪 Testing Edge Function with authentication...');
    
    // First authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ange_andre25@yahoo.com',
      password: 'Taylortest'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError);
      return;
    }

    console.log('✅ Authentication successful');

    // Test the API key manager
    const { data: apiKeyData, error: apiKeyError } = await supabase.functions.invoke('api-key-manager', {
      method: 'GET'
    });

    if (apiKeyError) {
      console.error('❌ API Key Management failed:', apiKeyError);
      console.log('   Error details:', JSON.stringify(apiKeyError, null, 2));
      return;
    }

    console.log('✅ API Key Management successful');
    console.log(`   API Key: ${apiKeyData.apiKey ? 'Present' : 'Missing'}`);

    console.log('\n🎉 API Key management is now working correctly!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testApiKeyFix(); 