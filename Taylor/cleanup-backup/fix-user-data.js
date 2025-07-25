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

console.log('🔧 Fixing User Data');
console.log('==================');

// Use service role key for admin operations
const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function fixUserData() {
    try {
        const testUserId = '25526a5f-7450-4baf-bb6d-51a259a552a3';
        const testUserEmail = 'ange_andre25@yahoo.com';
        
        console.log(`\nFixing data for user: ${testUserId} (${testUserEmail})`);
        
        // 1. Create partner record if it doesn't exist
        console.log('\n1. Creating partner record...');
        const { data: partnerData, error: partnerError } = await supabase
            .from('partners')
            .insert({
                id: testUserId,
                name: 'Test Partner',
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (partnerError) {
            if (partnerError.code === '23505') { // Unique violation
                console.log('✅ Partner record already exists');
            } else {
                console.error('❌ Failed to create partner record:', partnerError);
                return;
            }
        } else {
            console.log('✅ Partner record created:', partnerData);
        }
        
        // 2. Create API key if it doesn't exist
        console.log('\n2. Creating API key...');
        const { data: apiKeyData, error: apiKeyError } = await supabase
            .from('api_keys')
            .insert({
                partner_id: testUserId,
                key_hash: 'temp_hash_placeholder', // This will be updated by the function
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
            })
            .select()
            .single();
        
        if (apiKeyError) {
            if (apiKeyError.code === '23505') { // Unique violation
                console.log('✅ API key already exists');
            } else {
                console.error('❌ Failed to create API key:', apiKeyError);
                return;
            }
        } else {
            console.log('✅ API key created:', apiKeyData);
        }
        
        // 3. Verify the data was created
        console.log('\n3. Verifying data...');
        const { data: verifyPartner, error: verifyPartnerError } = await supabase
            .from('partners')
            .select('*')
            .eq('id', testUserId)
            .single();
        
        if (verifyPartnerError) {
            console.error('❌ Partner verification failed:', verifyPartnerError);
        } else {
            console.log('✅ Partner verified:', verifyPartner);
        }
        
        const { data: verifyApiKey, error: verifyApiKeyError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('partner_id', testUserId)
            .single();
        
        if (verifyApiKeyError) {
            console.error('❌ API key verification failed:', verifyApiKeyError);
        } else {
            console.log('✅ API key verified:', verifyApiKey);
        }
        
        console.log('\n✅ User data fix completed!');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

fixUserData(); 