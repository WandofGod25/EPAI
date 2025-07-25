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

console.log('🔍 Testing All Endpoints');
console.log('========================');

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function testAllEndpoints() {
    try {
        // First, authenticate
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
        
        // 2. Test get-models endpoint
        console.log('\n2. Testing get-models endpoint...');
        const { data: modelsData, error: modelsError } = await supabase.functions.invoke('get-models', {
            method: 'GET'
        });
        
        if (modelsError) {
            console.error('❌ get-models failed:', modelsError);
        } else {
            console.log('✅ get-models successful:', modelsData);
        }
        
        // 3. Test get-partner-logs endpoint
        console.log('\n3. Testing get-partner-logs endpoint...');
        const { data: logsData, error: logsError } = await supabase.functions.invoke('get-partner-logs', {
            method: 'GET'
        });
        
        if (logsError) {
            console.error('❌ get-partner-logs failed:', logsError);
        } else {
            console.log('✅ get-partner-logs successful:', logsData);
        }
        
        // 4. Test get-insights endpoint
        console.log('\n4. Testing get-insights endpoint...');
        const { data: insightsData, error: insightsError } = await supabase.functions.invoke('get-insights', {
            method: 'GET'
        });
        
        if (insightsError) {
            console.error('❌ get-insights failed:', insightsError);
        } else {
            console.log('✅ get-insights successful:', insightsData);
        }
        
        // 5. Test get-usage-stats endpoint
        console.log('\n5. Testing get-usage-stats endpoint...');
        const { data: statsData, error: statsError } = await supabase.functions.invoke('get-usage-stats', {
            method: 'GET'
        });
        
        if (statsError) {
            console.error('❌ get-usage-stats failed:', statsError);
        } else {
            console.log('✅ get-usage-stats successful:', statsData);
        }
        
        // 6. Test api-key-manager endpoint
        console.log('\n6. Testing api-key-manager endpoint...');
        const { data: apiKeyData, error: apiKeyError } = await supabase.functions.invoke('api-key-manager', {
            method: 'GET'
        });
        
        if (apiKeyError) {
            console.error('❌ api-key-manager failed:', apiKeyError);
        } else {
            console.log('✅ api-key-manager successful:', apiKeyData);
        }
        
        // 7. Check database tables directly
        console.log('\n7. Checking database tables...');
        
        // Check models table
        const { data: modelsTable, error: modelsTableError } = await supabase
            .from('model_configs')
            .select('*')
            .limit(5);
        
        if (modelsTableError) {
            console.error('❌ models table query failed:', modelsTableError);
        } else {
            console.log('✅ models table has', modelsTable?.length || 0, 'records');
        }
        
        // Check logs table
        const { data: logsTable, error: logsTableError } = await supabase
            .from('logs')
            .select('*')
            .limit(5);
        
        if (logsTableError) {
            console.error('❌ logs table query failed:', logsTableError);
        } else {
            console.log('✅ logs table has', logsTable?.length || 0, 'records');
        }
        
        // Check insights table
        const { data: insightsTable, error: insightsTableError } = await supabase
            .from('insights')
            .select('*')
            .limit(5);
        
        if (insightsTableError) {
            console.error('❌ insights table query failed:', insightsTableError);
        } else {
            console.log('✅ insights table has', insightsTable?.length || 0, 'records');
        }
        
        console.log('\n🎉 All tests completed!');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testAllEndpoints(); 