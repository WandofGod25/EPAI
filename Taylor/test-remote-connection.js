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

console.log('🔍 Testing Remote Supabase Connection');
console.log('=====================================');
console.log('Environment variables loaded:');
console.log('VITE_SUPABASE_URL:', envVars.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', envVars.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('VITE_API_BASE_URL:', envVars.VITE_API_BASE_URL);

// Test Supabase connection
const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    try {
        console.log('\n🔗 Testing Supabase connection...');
        
        // Test basic connection by getting auth session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Connection error:', error.message);
            return false;
        } else {
            console.log('✅ Supabase connection successful');
            console.log('Session:', data.session ? 'Active' : 'None');
        }
        
        // Test API endpoint
        const apiUrl = envVars.VITE_API_BASE_URL;
        if (apiUrl) {
            console.log('\n🌐 Testing API endpoint...');
            try {
                const response = await fetch(`${apiUrl}/get-models`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseAnonKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    console.log('✅ API endpoint accessible');
                } else {
                    console.log('⚠️ API endpoint returned status:', response.status);
                }
            } catch (apiError) {
                console.log('⚠️ API endpoint test failed (this is normal for Node.js):', apiError.message);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

async function testUserAuthentication() {
    console.log('\n👤 Testing user authentication...');
    
    try {
        // Test login with the known credentials
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'ange_andre25@yahoo.com',
            password: 'Taylortest'
        });
        
        if (error) {
            console.error('❌ Login failed:', error.message);
            console.log('Error details:', error);
            return false;
        } else {
            console.log('✅ Login successful!');
            console.log('User ID:', data.user?.id);
            console.log('User email:', data.user?.email);
            
            // Sign out to clean up
            await supabase.auth.signOut();
            console.log('✅ Signed out successfully');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Authentication test failed:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting comprehensive connection test...\n');
    
    // Test basic connection
    const connectionOk = await testConnection();
    if (!connectionOk) {
        console.log('\n❌ Basic connection failed. Cannot proceed with authentication test.');
        process.exit(1);
    }
    
    // Test user authentication
    const authOk = await testUserAuthentication();
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log('Connection:', connectionOk ? '✅ PASS' : '❌ FAIL');
    console.log('Authentication:', authOk ? '✅ PASS' : '❌ FAIL');
    
    if (connectionOk && authOk) {
        console.log('\n🎉 All tests passed! The issue may be in the frontend code.');
    } else if (connectionOk && !authOk) {
        console.log('\n⚠️ Connection works but authentication fails. Check:');
        console.log('1. User exists in the remote Supabase project');
        console.log('2. Email/password are correct');
        console.log('3. Email provider is enabled in Supabase Auth settings');
    } else {
        console.log('\n❌ Connection failed. Check:');
        console.log('1. Supabase URL is correct');
        console.log('2. Anon key is correct');
        console.log('3. Supabase project is active');
    }
}

main(); 