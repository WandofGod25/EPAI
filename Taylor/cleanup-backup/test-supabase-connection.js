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

console.log('Environment variables loaded:');
console.log('VITE_SUPABASE_URL:', envVars.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', envVars.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('VITE_API_BASE_URL:', envVars.VITE_API_BASE_URL);

// Test Supabase connection
const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    try {
        console.log('\nTesting Supabase connection...');
        
        // Test basic connection by getting auth session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Connection error:', error.message);
        } else {
            console.log('✅ Supabase connection successful');
            console.log('Session:', data.session ? 'Active' : 'None');
        }
        
        // Test API endpoint
        const apiUrl = envVars.VITE_API_BASE_URL;
        if (apiUrl) {
            console.log('\nTesting API endpoint...');
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
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testConnection(); 