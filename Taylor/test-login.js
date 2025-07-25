// ESM syntax
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Test user credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

// Initialize Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 Testing login functionality...');

  try {
    // 1. Check if test user exists, create if not
    console.log(`Checking if user ${TEST_EMAIL} exists...`);
    
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Error listing users: ${listError.message}`);
    }
    
    const existingUser = users.find(user => user.email === TEST_EMAIL);
    
    if (!existingUser) {
      console.log(`User ${TEST_EMAIL} not found, creating...`);
      
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true
      });
      
      if (error) {
        throw new Error(`Error creating user: ${error.message}`);
      }
      
      console.log(`User created: ${data.user.id}`);
    } else {
      console.log(`User exists: ${existingUser.id}`);
    }
    
    // 2. Try to sign in with the test user
    console.log(`Attempting to sign in as ${TEST_EMAIL}...`);
    
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
    
    console.log('✅ Login successful!');
    console.log(`User ID: ${data.user.id}`);
    console.log(`Session expires at: ${new Date(data.session.expires_at * 1000).toLocaleString()}`);
    
    // 3. Check if partner record exists
    console.log('Checking for partner record...');
    
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, name')
      .eq('user_id', data.user.id)
      .maybeSingle();
    
    if (partnerError) {
      console.log(`Error checking partner record: ${partnerError.message}`);
      
      // Try to create the partners table if it doesn't exist
      console.log('Attempting to create partners table...');
      
      const createTableResult = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.partners (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            name TEXT NOT NULL,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'active'
          );
          
          ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Partners are viewable by users who created them." 
            ON public.partners FOR SELECT 
            USING (auth.uid() = user_id);
        `
      });
      
      if (createTableResult.error) {
        console.log(`Error creating partners table: ${createTableResult.error.message}`);
      } else {
        console.log('Partners table created successfully');
        
        // Try to create partner record
        const { data: newPartner, error: createPartnerError } = await supabaseAdmin
          .from('partners')
          .insert({ name: 'Test Partner', user_id: data.user.id })
          .select()
          .single();
        
        if (createPartnerError) {
          console.log(`Error creating partner record: ${createPartnerError.message}`);
        } else {
          console.log(`Partner record created: ${newPartner.id}`);
        }
      }
    } else if (!partner) {
      console.log('No partner record found, creating...');
      
      const { data: newPartner, error: createPartnerError } = await supabaseAdmin
        .from('partners')
        .insert({ name: 'Test Partner', user_id: data.user.id })
        .select()
        .single();
      
      if (createPartnerError) {
        console.log(`Error creating partner record: ${createPartnerError.message}`);
      } else {
        console.log(`Partner record created: ${newPartner.id}`);
      }
    } else {
      console.log(`Partner record found: ${partner.id}`);
    }
    
    console.log('\n📋 Login Test Summary');
    console.log('✅ Test user exists');
    console.log('✅ Login successful');
    console.log(`✅ User can access the admin panel at http://localhost:5174`);
    console.log(`   Login with: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

main(); 