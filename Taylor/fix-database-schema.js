import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Checking database schema...');
  
  try {
    // Check if partners table exists
    console.log('Checking partners table...');
    const { data: partnersExists, error: partnersError } = await supabase
      .from('partners')
      .select('id')
      .limit(1);
    
    if (partnersError) {
      console.log('Partners table not found or error accessing it. Creating...');
      
      const createPartnersSQL = `
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
      `;
      
      const { error: createPartnersError } = await supabase.rpc('exec_sql', { sql: createPartnersSQL });
      
      if (createPartnersError) {
        console.error('Error creating partners table:', createPartnersError);
        
        // Try direct SQL execution if RPC fails
        console.log('Trying direct SQL execution...');
        await executeSQL(createPartnersSQL);
      } else {
        console.log('Partners table created successfully!');
      }
    } else {
      console.log('Partners table exists.');
    }
    
    // Check if api_keys table exists
    console.log('Checking api_keys table...');
    const { data: apiKeysExists, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('id')
      .limit(1);
    
    if (apiKeysError) {
      console.log('API keys table not found or error accessing it. Creating...');
      
      const createApiKeysSQL = `
        CREATE TABLE IF NOT EXISTS public.api_keys (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          key TEXT NOT NULL UNIQUE,
          partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
          expires_at TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN DEFAULT true
        );
        
        ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "API keys are viewable by partner users." 
          ON public.api_keys FOR SELECT 
          USING (EXISTS (
            SELECT 1 FROM public.partners p 
            WHERE p.id = api_keys.partner_id 
            AND p.user_id = auth.uid()
          ));
      `;
      
      const { error: createApiKeysError } = await supabase.rpc('exec_sql', { sql: createApiKeysSQL });
      
      if (createApiKeysError) {
        console.error('Error creating api_keys table:', createApiKeysError);
        
        // Try direct SQL execution if RPC fails
        console.log('Trying direct SQL execution...');
        await executeSQL(createApiKeysSQL);
      } else {
        console.log('API keys table created successfully!');
      }
    } else {
      console.log('API keys table exists.');
    }
    
    // Check if new_user trigger exists
    console.log('Checking user creation trigger...');
    
    const createTriggerSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.partners (name, user_id)
        VALUES (
          COALESCE(
            NEW.raw_user_meta_data->>'partner_name',
            'Partner ' || substr(NEW.email, 1, position('@' in NEW.email) - 1)
          ),
          NEW.id
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    
    const { error: createTriggerError } = await supabase.rpc('exec_sql', { sql: createTriggerSQL });
    
    if (createTriggerError) {
      console.error('Error creating/updating user trigger:', createTriggerError);
      
      // Try direct SQL execution if RPC fails
      console.log('Trying direct SQL execution...');
      await executeSQL(createTriggerSQL);
    } else {
      console.log('User creation trigger created/updated successfully!');
    }
    
    console.log('Database schema check and fix completed!');
    
  } catch (error) {
    console.error('Error checking/fixing database schema:', error);
  }
}

// Helper function to execute SQL directly
async function executeSQL(sql) {
  try {
    // This is a workaround since we can't execute raw SQL directly
    // We'll create a temporary function to execute the SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION temp_exec_sql()
      RETURNS void AS $$
      BEGIN
        ${sql}
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: createFunctionError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (createFunctionError) {
      console.error('Error creating temporary function:', createFunctionError);
      return;
    }
    
    // Execute the temporary function
    const { error: executeFunctionError } = await supabase.rpc('temp_exec_sql');
    
    if (executeFunctionError) {
      console.error('Error executing temporary function:', executeFunctionError);
      return;
    }
    
    // Drop the temporary function
    const { error: dropFunctionError } = await supabase.rpc('exec_sql', { 
      sql: 'DROP FUNCTION IF EXISTS temp_exec_sql();' 
    });
    
    if (dropFunctionError) {
      console.error('Error dropping temporary function:', dropFunctionError);
    }
    
    console.log('SQL executed successfully!');
  } catch (error) {
    console.error('Error in executeSQL:', error);
  }
}

main(); 