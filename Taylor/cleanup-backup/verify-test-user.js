import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Test user credentials
const TEST_USER_EMAIL = 'ange_andre25@yahoo.com';
const TEST_USER_PASSWORD = 'Taylortest';
const PARTNER_NAME = 'Test Partner';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Checking for test user...');
  
  try {
    // Check if user exists
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', TEST_USER_EMAIL)
      .maybeSingle();
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log('Table auth.users not accessible. Trying alternative approach...');
      } else {
        throw userError;
      }
    }
    
    if (users) {
      console.log(`User found: ${users.email} (${users.id})`);
      
      // Check if partner record exists
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id, name, user_id')
        .eq('user_id', users.id)
        .maybeSingle();
      
      if (partnerError) throw partnerError;
      
      if (partner) {
        console.log(`Partner record found: ${partner.name} (${partner.id})`);
      } else {
        console.log('Partner record not found, creating...');
        const { data: newPartner, error: createPartnerError } = await supabase
          .from('partners')
          .insert({ name: PARTNER_NAME, user_id: users.id })
          .select()
          .single();
        
        if (createPartnerError) throw createPartnerError;
        console.log(`Partner record created: ${newPartner.name} (${newPartner.id})`);
      }
      
      // Check if API key exists
      const { data: apiKey, error: apiKeyError } = await supabase
        .from('api_keys')
        .select('id, key, partner_id')
        .eq('partner_id', partner ? partner.id : null)
        .maybeSingle();
      
      if (apiKeyError) throw apiKeyError;
      
      if (apiKey) {
        console.log(`API key found for partner: ${apiKey.id}`);
      } else {
        console.log('API key not found, creating...');
        // Generate a new API key
        const newApiKey = generateApiKey();
        
        const { data: createdKey, error: createKeyError } = await supabase
          .from('api_keys')
          .insert({ 
            key: newApiKey,
            partner_id: partner ? partner.id : null,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
          })
          .select()
          .single();
        
        if (createKeyError) throw createKeyError;
        console.log(`API key created: ${createdKey.id}`);
      }
      
    } else {
      console.log(`User not found: ${TEST_USER_EMAIL}, creating...`);
      
      // Create user using Supabase auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        email_confirm: true,
        user_metadata: { partner_name: PARTNER_NAME }
      });
      
      if (authError) throw authError;
      
      console.log(`User created: ${authUser.user.email} (${authUser.user.id})`);
      
      // Check if the partner record was automatically created by the database trigger
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id, name, user_id')
        .eq('user_id', authUser.user.id)
        .maybeSingle();
      
      if (partnerError) throw partnerError;
      
      if (partner) {
        console.log(`Partner record automatically created: ${partner.name} (${partner.id})`);
      } else {
        console.log('Partner record not automatically created, creating manually...');
        const { data: newPartner, error: createPartnerError } = await supabase
          .from('partners')
          .insert({ name: PARTNER_NAME, user_id: authUser.user.id })
          .select()
          .single();
        
        if (createPartnerError) throw createPartnerError;
        console.log(`Partner record created: ${newPartner.name} (${newPartner.id})`);
      }
      
      // Create API key for the new partner
      const newApiKey = generateApiKey();
      
      const { data: createdKey, error: createKeyError } = await supabase
        .from('api_keys')
        .insert({ 
          key: newApiKey,
          partner_id: partner ? partner.id : null,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        })
        .select()
        .single();
      
      if (createKeyError) throw createKeyError;
      console.log(`API key created: ${createdKey.id}`);
    }
    
    console.log('Test user setup complete!');
    console.log(`Email: ${TEST_USER_EMAIL}`);
    console.log(`Password: ${TEST_USER_PASSWORD}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Helper function to generate an API key
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

main(); 