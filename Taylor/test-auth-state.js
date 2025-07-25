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

console.log('🔍 Testing Authentication State');
console.log('================================');

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function testAuthState() {
    try {
        // 1. Check current session
        console.log('\n1. Checking current session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('❌ Session error:', sessionError);
            return;
        }
        
        if (session) {
            console.log('✅ Session found:', {
                user_id: session.user.id,
                email: session.user.email,
                created_at: session.user.created_at
            });
        } else {
            console.log('❌ No active session found');
        }

        // 2. Test login with the test user
        console.log('\n2. Testing login with test user...');
        const testEmail = 'ange_andre25@yahoo.com';
        const testPassword = 'Taylortest';
        
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        
        if (authError) {
            console.error('❌ Login failed:', authError.message);
            return;
        }
        
        if (authData.user) {
            console.log('✅ Login successful:', {
                user_id: authData.user.id,
                email: authData.user.email,
                created_at: authData.user.created_at
            });
            
            // 3. Check if user exists in partners table
            console.log('\n3. Checking if user exists in partners table...');
            const { data: partnerData, error: partnerError } = await supabase
                .from('partners')
                .select('*')
                .eq('id', authData.user.id)
                .single();
            
            if (partnerError) {
                console.error('❌ Partner lookup failed:', partnerError.message);
            } else if (partnerData) {
                console.log('✅ Partner record found:', {
                    id: partnerData.id,
                    name: partnerData.name,
                    created_at: partnerData.created_at
                });
            } else {
                console.log('❌ No partner record found for user');
            }
            
            // 4. Check if API key exists
            console.log('\n4. Checking if API key exists...');
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
                    created_at: apiKeyData.created_at,
                    expires_at: apiKeyData.expires_at
                });
            } else {
                console.log('❌ No API key found for user');
            }
            
            // 5. Test the API key manager function
            console.log('\n5. Testing API key manager function...');
            const { data: functionData, error: functionError } = await supabase.functions.invoke('api-key-manager', {
                method: 'GET'
            });
            
            if (functionError) {
                console.error('❌ API key manager function failed:', functionError.message);
            } else {
                console.log('✅ API key manager function successful:', functionData);
            }
            
        } else {
            console.log('❌ Login returned no user data');
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testAuthState(); 