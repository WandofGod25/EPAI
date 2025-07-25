import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables from the admin panel .env file
const envPath = path.join(__dirname, 'packages/admin-panel/.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

console.log('🔍 Checking Database State');
console.log('==========================');

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function checkDatabaseState() {
    try {
        const testUserId = '25526a5f-7450-4baf-bb6d-51a259a552a3';
        
        // 1. Check all partners
        console.log('\n1. All partners in database:');
        const { data: allPartners, error: partnersError } = await supabase
            .from('partners')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (partnersError) {
            console.error('❌ Partners query failed:', partnersError);
        } else {
            console.log(`Found ${allPartners.length} partners:`);
            allPartners.forEach((partner, index) => {
                console.log(`  ${index + 1}. ID: ${partner.id}, Name: ${partner.name}, Created: ${partner.created_at}`);
            });
        }
        
        // 2. Check partners for specific user
        console.log('\n2. Partners for test user:');
        const { data: userPartners, error: userPartnersError } = await supabase
            .from('partners')
            .select('*')
            .eq('id', testUserId);
        
        if (userPartnersError) {
            console.error('❌ User partners query failed:', userPartnersError);
        } else {
            console.log(`Found ${userPartners.length} partner records for user:`);
            userPartners.forEach((partner, index) => {
                console.log(`  ${index + 1}. ID: ${partner.id}, Name: ${partner.name}, Created: ${partner.created_at}`);
            });
        }
        
        // 3. Check all API keys
        console.log('\n3. All API keys in database:');
        const { data: allApiKeys, error: apiKeysError } = await supabase
            .from('api_keys')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (apiKeysError) {
            console.error('❌ API keys query failed:', apiKeysError);
        } else {
            console.log(`Found ${allApiKeys.length} API keys:`);
            allApiKeys.forEach((apiKey, index) => {
                console.log(`  ${index + 1}. ID: ${apiKey.id}, Partner ID: ${apiKey.partner_id}, Created: ${apiKey.created_at}, Expires: ${apiKey.expires_at}`);
            });
        }
        
        // 4. Check API keys for specific user
        console.log('\n4. API keys for test user:');
        const { data: userApiKeys, error: userApiKeysError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('partner_id', testUserId);
        
        if (userApiKeysError) {
            console.error('❌ User API keys query failed:', userApiKeysError);
        } else {
            console.log(`Found ${userApiKeys.length} API keys for user:`);
            userApiKeys.forEach((apiKey, index) => {
                console.log(`  ${index + 1}. ID: ${apiKey.id}, Partner ID: ${apiKey.partner_id}, Created: ${apiKey.created_at}, Expires: ${apiKey.expires_at}`);
            });
        }
        
        // 5. Check auth users
        console.log('\n5. Auth users:');
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
            console.error('❌ Auth users query failed:', usersError);
        } else {
            console.log(`Found ${users.length} auth users:`);
            users.forEach((user, index) => {
                console.log(`  ${index + 1}. ID: ${user.id}, Email: ${user.email}, Created: ${user.created_at}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkDatabaseState(); 