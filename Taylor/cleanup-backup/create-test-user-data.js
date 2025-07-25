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

console.log('🔧 Creating Test User Data');
console.log('==========================');

// Use service role key for admin operations
const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function createTestUserData() {
    try {
        // Use the new user ID from the successful login
        const testUserId = '799daeee-1410-4981-8274-38a221279b2d';
        const testUserEmail = 'ange_andre25@yahoo.com';
        
        console.log(`\nSetting up test user: ${testUserId} (${testUserEmail})`);
        
        // 1. Check if partner record exists
        const { data: existingPartner, error: checkError } = await supabase
            .from('partners')
            .select('*')
            .eq('id', testUserId)
            .maybeSingle();
        if (!existingPartner) {
            const { data: newPartner, error: createPartnerError } = await supabase
                .from('partners')
                .insert({ id: testUserId })
                .select()
                .single();
            if (createPartnerError) {
                console.error('❌ Failed to create partner record:', createPartnerError);
                return;
            } else {
                console.log('✅ Partner record created:', newPartner);
            }
        } else {
            console.log('✅ Partner record already exists:', existingPartner);
        }
        // 2. Check if API key exists
        const { data: existingApiKey, error: apiKeyCheckError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('partner_id', testUserId)
            .maybeSingle();
        if (existingApiKey) {
            console.log('✅ API key already exists:', {
                id: existingApiKey.id,
                partner_id: existingApiKey.partner_id,
                created_at: existingApiKey.created_at
            });
        } else {
            console.log('❌ No API key found, creating one...');
            const now = new Date().toISOString();
            const { data: newApiKey, error: createApiKeyError } = await supabase
                .from('api_keys')
                .insert({
                    partner_id: testUserId,
                    api_key_hash: 'placeholder_for_test',
                    created_at: now,
                    updated_at: now
                })
                .select()
                .single();
            if (createApiKeyError) {
                console.error('❌ Failed to create API key:', createApiKeyError);
                return;
            } else {
                console.log('✅ API key created:', {
                    id: newApiKey.id,
                    partner_id: newApiKey.partner_id,
                    created_at: newApiKey.created_at
                });
            }
        }
        // 3. Final verification
        const { data: finalPartner } = await supabase
            .from('partners')
            .select('*')
            .eq('id', testUserId)
            .single();
        const { data: finalApiKey } = await supabase
            .from('api_keys')
            .select('*')
            .eq('partner_id', testUserId)
            .single();
        console.log('✅ Final verification successful:');
        console.log('  - Partner:', finalPartner);
        console.log('  - API Key:', {
            id: finalApiKey.id,
            partner_id: finalApiKey.partner_id,
            created_at: finalApiKey.created_at
        });
        console.log('\n🎉 Test user setup completed successfully!');
        console.log('You can now log in with:');
        console.log('  Email: ange_andre25@yahoo.com');
        console.log('  Password: Taylortest');
        console.log('\nThe user now has:');
        console.log('  ✅ Partner record in the database');
        console.log('  ✅ API key for testing');
        console.log('  ✅ Access to all dashboard features');
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

createTestUserData(); 