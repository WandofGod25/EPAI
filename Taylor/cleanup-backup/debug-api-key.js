import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function debugApiKey() {
  console.log('🔍 Debugging API Key Retrieval...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Step 1: Sign in
    console.log('\n1. Signing in...');
    
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'ange_andre25@yahoo.com',
      password: 'Taylortest'
    });
    
    if (signInError || !user) {
      console.log('❌ Sign in failed:', signInError?.message);
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Step 2: Test the Edge Function directly
    console.log('\n2. Testing Edge Function...');
    
    const { data, error } = await supabase.functions.invoke('api-key-manager', {
      method: 'GET'
    });
    
    if (error) {
      console.log('❌ Edge Function error:', error);
      console.log('   Error details:', JSON.stringify(error, null, 2));
      return;
    }
    
    console.log('✅ Edge Function response:');
    console.log('   Data:', JSON.stringify(data, null, 2));
    console.log('   Data type:', typeof data);
    console.log('   Has apiKey property:', 'apiKey' in data);
    
    if (data && typeof data === 'object' && 'apiKey' in data) {
      console.log('   API Key value:', data.apiKey);
      console.log('   API Key type:', typeof data.apiKey);
      console.log('   API Key length:', data.apiKey ? data.apiKey.length : 'null/undefined');
      console.log('   API Key first 10 chars:', data.apiKey ? data.apiKey.substring(0, 10) + '...' : 'null/undefined');
      
      if (data.apiKey && data.apiKey.startsWith('$2b$')) {
        console.log('❌ API Key is still a hash!');
      } else if (data.apiKey) {
        console.log('✅ API Key is plaintext!');
      } else {
        console.log('❌ API Key is null/undefined/empty!');
      }
    } else {
      console.log('❌ Response does not contain apiKey property');
    }
    
    // Step 3: Test the database directly to compare
    console.log('\n3. Testing database directly...');
    
    const { data: dbData, error: dbError } = await supabase
      .from('api_keys')
      .select('api_key, api_key_hash')
      .eq('partner_id', 'de949c6d-da4a-40de-997f-30d1ce46a021')
      .single();
    
    if (dbError) {
      console.log('❌ Database error:', dbError);
    } else {
      console.log('✅ Database data:');
      console.log('   API Key:', dbData.api_key);
      console.log('   API Key Hash:', dbData.api_key_hash);
      console.log('   API Key type:', typeof dbData.api_key);
      console.log('   API Key length:', dbData.api_key ? dbData.api_key.length : 'null/undefined');
    }
    
  } catch (error) {
    console.error('❌ Debug failed with error:', error);
  }
}

// Run the debug
debugApiKey(); 