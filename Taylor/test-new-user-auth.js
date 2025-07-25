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

console.log('🔍 Testing New User Authentication');
console.log('==================================');

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function testNewUserAuth() {
    try {
        const testEmail = 'ange_andre25@yahoo.com';
        const testPassword = 'Taylortest';
        
        console.log(`\nTesting authentication for: ${testEmail}`);
        
        // 1. Test login
        console.log('\n1. Attempting login...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        
        if (authError) {
            console.error('❌ Login failed:', authError.message);
            console.error('Error details:', authError);
            return;
        }
        
        if (authData.user) {
            console.log('✅ Login successful!');
            console.log('User details:', {
                id: authData.user.id,
                email: authData.user.email,
                created_at: authData.user.created_at,
                last_sign_in_at: authData.user.last_sign_in_at
            });
            
            // 2. Check if partner record exists
            console.log('\n2. Checking partner record...');
            const { data: partnerData, error: partnerError } = await supabase
                .from('partners')
                .select('*')
                .eq('id', authData.user.id)
                .single();
            
            if (partnerError) {
                console.error('❌ Partner lookup failed:', partnerError.message);
            } else if (partnerData) {
                console.log('✅ Partner record found:', partnerData);
            } else {
                console.log('❌ No partner record found for user');
            }
            
            // 3. Check if API key exists
            console.log('\n3. Checking API key...');
            const { data: apiKeyData, error: apiKeyError } = await supabase
                .from('api_keys')
                .select('*')
                .eq('partner_id', authData.user.id)
                .single();
            
            if (apiKeyError) {
                console.error('❌ API key lookup failed:', apiKeyError.message);
            } else if (apiKeyData) {
                console.log('✅ API key found:', {
                    id: apiKeyData.id,
                    partner_id: apiKeyData.partner_id,
                    created_at: apiKeyData.created_at
                });
            } else {
                console.log('❌ No API key found for user');
            }
            
            // 4. Test API key manager function
            console.log('\n4. Testing API key manager function...');
            const { data: functionData, error: functionError } = await supabase.functions.invoke('api-key-manager', {
                method: 'GET'
            });
            
            if (functionError) {
                console.error('❌ API key manager function failed:', functionError.message);
            } else {
                console.log('✅ API key manager function successful:', functionData);
            }
            
            console.log('\n🎉 Authentication test completed successfully!');
            console.log('The user should now be able to log in to the admin panel.');
            
        } else {
            console.log('❌ Login returned no user data');
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testNewUserAuth(); 