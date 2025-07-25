import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    // Check api_keys table
    const { data: apiKeysData, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('*')
      .limit(1);
    
    if (apiKeysError) {
      console.error('Error checking api_keys table:', apiKeysError.message);
    } else {
      console.log('api_keys table structure:', Object.keys(apiKeysData[0] || {}));
    }
    
    // Check partners table
    const { data: partnersData, error: partnersError } = await supabase
      .from('partners')
      .select('*')
      .limit(1);
    
    if (partnersError) {
      console.error('Error checking partners table:', partnersError.message);
    } else {
      console.log('partners table structure:', Object.keys(partnersData[0] || {}));
    }
    
    // Try to get the API key for the test user
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError.message);
      return;
    }
    
    const testUser = userData.users.find(user => user.email === 'ange_andre25@yahoo.com');
    if (testUser) {
      console.log('Found test user with ID:', testUser.id);
      
      // Check if partner record exists
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', testUser.id);
      
      if (partnerError) {
        console.error('Error checking partner record:', partnerError.message);
      } else if (partnerData && partnerData.length > 0) {
        console.log('Partner record exists with ID:', partnerData[0].id);
        
        // Check if API key exists (using partner_id instead of user_id)
        const { data: keyData, error: keyError } = await supabase
          .from('api_keys')
          .select('*')
          .eq('partner_id', partnerData[0].id);
        
        if (keyError) {
          console.error('Error checking API key:', keyError.message);
        } else if (keyData && keyData.length > 0) {
          console.log('API key exists with ID:', keyData[0].id);
        } else {
          console.log('No API key found for partner. Creating one...');
          
          // Create API key using partner_id
          const testApiKey = 'epai_test_api_key_for_simulation';
          
          const { data: insertKeyData, error: insertKeyError } = await supabase
            .from('api_keys')
            .insert([
              {
                partner_id: partnerData[0].id,
                key: testApiKey,
                name: 'Test API Key',
                is_active: true
              }
            ])
            .select();
          
          if (insertKeyError) {
            console.error('Error creating API key:', insertKeyError.message);
          } else {
            console.log('API key created with ID:', insertKeyData[0].id);
          }
        }
      }
    }
    
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

checkSchema(); 