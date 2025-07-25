import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, 'packages/admin-panel/.env');
if (!fs.existsSync(envPath)) {
  console.error(`Environment file not found: ${envPath}`);
  process.exit(1);
}

// Read the environment variables manually
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

// Get Supabase credentials from environment variables
const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or service key not found in environment variables');
  process.exit(1);
}

console.log(`Supabase URL: ${supabaseUrl}`);
console.log('Supabase Service Key: [HIDDEN]');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user information
const testUserEmail = 'ange_andre25@yahoo.com';
const testUserPassword = 'Taylortest';

async function checkAndCreateTestUser() {
  try {
    console.log(`Checking if test user ${testUserEmail} exists...`);
    
    // Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError.message);
      return;
    }
    
    const existingUser = users.find(user => user.email === testUserEmail);
    
    let userId;
    
    if (existingUser) {
      console.log(`User ${testUserEmail} already exists with ID: ${existingUser.id}`);
      userId = existingUser.id;
    } else {
      console.log(`Creating user ${testUserEmail}...`);
      // Create the user
      const { data, error } = await supabase.auth.admin.createUser({
        email: testUserEmail,
        password: testUserPassword,
        email_confirm: true
      });
      
      if (error) {
        console.error('Error creating user:', error.message);
        return;
      }
      
      console.log(`User created successfully with ID: ${data.user.id}`);
      userId = data.user.id;
    }
    
    // Check if partner record exists
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', userId);
    
    if (partnerError) {
      console.error('Error checking partner record:', partnerError.message);
      return;
    }
    
    if (partnerData && partnerData.length > 0) {
      console.log('Partner record exists:', partnerData[0]);
    } else {
      console.log('Creating partner record...');
      const { data: newPartner, error: createError } = await supabase
        .from('partners')
        .insert([
          { user_id: userId, name: 'Test Partner', email: testUserEmail }
        ]);
      
      if (createError) {
        console.error('Error creating partner record:', createError.message);
      } else {
        console.log('Partner record created successfully');
      }
    }
    
    // Check if API key exists
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('partner_id', userId);
    
    if (apiKeyError) {
      console.error('Error checking API key:', apiKeyError.message);
      return;
    }
    
    if (apiKeyData && apiKeyData.length > 0) {
      console.log('API key exists:', apiKeyData[0]);
    } else {
      console.log('Creating API key...');
      const apiKey = `epai_${Math.random().toString(36).substring(2, 15)}`;
      const { data: newApiKey, error: createKeyError } = await supabase
        .from('api_keys')
        .insert([
          { partner_id: userId, api_key: apiKey, created_at: new Date().toISOString() }
        ]);
      
      if (createKeyError) {
        console.error('Error creating API key:', createKeyError.message);
      } else {
        console.log('API key created successfully');
      }
    }
    
    console.log('\nTest user setup complete. You can now log in with:');
    console.log(`Email: ${testUserEmail}`);
    console.log(`Password: ${testUserPassword}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAndCreateTestUser(); 