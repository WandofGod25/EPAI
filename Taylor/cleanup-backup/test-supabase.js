import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, 'packages/admin-panel/.env');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.error(`Environment file not found: ${envPath}`);
  process.exit(1);
}

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or service key not found in environment variables');
  process.exit(1);
}

console.log(`Supabase URL: ${supabaseUrl}`);
console.log('Supabase Service Key: [HIDDEN]');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test database connection
    const { data: dbTest, error: dbError } = await supabase.from('partners').select('count').limit(1);
    
    if (dbError) {
      console.error('Database connection error:', dbError.message);
    } else {
      console.log('Database connection successful!');
      console.log('Database query result:', dbTest);
    }
    
    // Test authentication
    console.log('\nTesting authentication...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Authentication error:', authError.message);
    } else {
      console.log('Authentication successful!');
      console.log(`Found ${authData.users.length} users`);
      console.log('First few users:', authData.users.slice(0, 3).map(u => ({ id: u.id, email: u.email })));
    }
    
    // Test Edge Functions
    console.log('\nTesting Edge Functions...');
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/get-models`, {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Edge Function response:', data);
      } else {
        console.error('Edge Function error:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Edge Function fetch error:', error.message);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSupabaseConnection(); 