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

console.log('🔍 Testing Edge Function');
console.log('=======================');

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function testEdgeFunction() {
    try {
        // 1. First authenticate to get a valid session
        console.log('\n1. Authenticating...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'ange_andre25@yahoo.com',
            password: 'Taylortest'
        });
        
        if (authError) {
            console.error('❌ Authentication failed:', authError);
            return;
        }
        
        console.log('✅ Authentication successful');
        console.log('User ID:', authData.user.id);
        
        // 2. Test the Edge Function with proper authentication
        console.log('\n2. Testing api-key-manager Edge Function...');
        const { data: functionData, error: functionError } = await supabase.functions.invoke('api-key-manager', {
            method: 'GET'
        });
        
        if (functionError) {
            console.error('❌ Edge Function failed:');
            console.error('  Error:', functionError.message);
            console.error('  Status:', functionError.status);
            
            // Try to get more details about the error
            if (functionError.context) {
                try {
                    const errorBody = await functionError.context.text();
                    console.error('  Response body:', errorBody);
                } catch (e) {
                    console.error('  Could not read response body');
                }
            }
        } else {
            console.log('✅ Edge Function successful:', functionData);
        }
        
        // 3. Test other Edge Functions to see if they work
        console.log('\n3. Testing other Edge Functions...');
        
        // Test get-models
        const { data: modelsData, error: modelsError } = await supabase.functions.invoke('get-models', {
            method: 'GET'
        });
        
        if (modelsError) {
            console.error('❌ get-models failed:', modelsError.message);
        } else {
            console.log('✅ get-models successful:', modelsData);
        }
        
        // Test get-insights
        const { data: insightsData, error: insightsError } = await supabase.functions.invoke('get-insights', {
            method: 'GET'
        });
        
        if (insightsError) {
            console.error('❌ get-insights failed:', insightsError.message);
        } else {
            console.log('✅ get-insights successful:', insightsData);
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testEdgeFunction(); 