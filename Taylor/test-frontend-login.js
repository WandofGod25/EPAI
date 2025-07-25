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

console.log('🔍 Testing Frontend Login Flow');
console.log('==============================');

console.log('\nEnvironment Configuration:');
console.log('VITE_SUPABASE_URL:', envVars.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', envVars.VITE_SUPABASE_ANON_KEY ? '***SET***' : '***MISSING***');

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function testFrontendLogin() {
    try {
        const testEmail = 'ange_andre25@yahoo.com';
        const testPassword = 'Taylortest';
        
        console.log(`\nTesting login with: ${testEmail}`);
        
        // 1. Test basic authentication
        console.log('\n1. Testing basic authentication...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        
        if (authError) {
            console.error('❌ Authentication failed:', authError);
            console.error('Error details:', {
                message: authError.message,
                status: authError.status,
                name: authError.name
            });
            return;
        }
        
        console.log('✅ Authentication successful');
        console.log('User ID:', authData.user.id);
        console.log('User email:', authData.user.email);
        console.log('Session expires:', authData.session?.expires_at);
        
        // 2. Test session retrieval
        console.log('\n2. Testing session retrieval...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('❌ Session retrieval failed:', sessionError);
        } else {
            console.log('✅ Session retrieved successfully');
            console.log('Session user ID:', sessionData.session?.user.id);
        }
        
        // 3. Test user retrieval
        console.log('\n3. Testing user retrieval...');
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            console.error('❌ User retrieval failed:', userError);
        } else {
            console.log('✅ User retrieved successfully');
            console.log('User ID:', userData.user.id);
        }
        
        // 4. Test Edge Function with session
        console.log('\n4. Testing Edge Function with session...');
        const { data: functionData, error: functionError } = await supabase.functions.invoke('api-key-manager', {
            method: 'GET'
        });
        
        if (functionError) {
            console.error('❌ Edge Function failed:', functionError);
        } else {
            console.log('✅ Edge Function successful:', functionData);
        }
        
        // 5. Test sign out
        console.log('\n5. Testing sign out...');
        const { error: signOutError } = await supabase.auth.signOut();
        
        if (signOutError) {
            console.error('❌ Sign out failed:', signOutError);
        } else {
            console.log('✅ Sign out successful');
        }
        
        console.log('\n🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
        console.error('Error stack:', error.stack);
    }
}

testFrontendLogin(); 