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

console.log('🔍 Debugging Database Issues');
console.log('============================');

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function debugDatabaseIssues() {
    try {
        const testUserId = '799daeee-1410-4981-8274-38a221279b2d';
        
        console.log(`\nDebugging issues for user: ${testUserId}`);
        
        // 1. First, let's authenticate to get the session
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
        
        // 2. Check all partners to see what's in the table
        console.log('\n2. Checking all partners in database...');
        const { data: allPartners, error: allPartnersError } = await supabase
            .from('partners')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (allPartnersError) {
            console.error('❌ Failed to get all partners:', allPartnersError);
        } else {
            console.log(`Found ${allPartners.length} partners:`);
            allPartners.forEach((partner, index) => {
                console.log(`  ${index + 1}. ID: ${partner.id}, Created: ${partner.created_at}`);
            });
        }
        
        // 3. Check specific partner with different methods
        console.log('\n3. Checking specific partner with different methods...');
        
        // Method 1: Using single()
        const { data: partnerSingle, error: partnerSingleError } = await supabase
            .from('partners')
            .select('*')
            .eq('id', testUserId)
            .single();
        
        console.log('Method 1 (single()):', partnerSingleError ? `❌ ${partnerSingleError.message}` : `✅ ${JSON.stringify(partnerSingle)}`);
        
        // Method 2: Using maybeSingle()
        const { data: partnerMaybe, error: partnerMaybeError } = await supabase
            .from('partners')
            .select('*')
            .eq('id', testUserId)
            .maybeSingle();
        
        console.log('Method 2 (maybeSingle()):', partnerMaybeError ? `❌ ${partnerMaybeError.message}` : `✅ ${JSON.stringify(partnerMaybe)}`);
        
        // Method 3: Using limit(1)
        const { data: partnerLimit, error: partnerLimitError } = await supabase
            .from('partners')
            .select('*')
            .eq('id', testUserId)
            .limit(1);
        
        console.log('Method 3 (limit(1)):', partnerLimitError ? `❌ ${partnerLimitError.message}` : `✅ Found ${partnerLimit.length} records`);
        
        // 4. Check all API keys
        console.log('\n4. Checking all API keys in database...');
        const { data: allApiKeys, error: allApiKeysError } = await supabase
            .from('api_keys')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (allApiKeysError) {
            console.error('❌ Failed to get all API keys:', allApiKeysError);
        } else {
            console.log(`Found ${allApiKeys.length} API keys:`);
            allApiKeys.forEach((apiKey, index) => {
                console.log(`  ${index + 1}. ID: ${apiKey.id}, Partner ID: ${apiKey.partner_id}, Created: ${apiKey.created_at}`);
            });
        }
        
        // 5. Check specific API key with different methods
        console.log('\n5. Checking specific API key with different methods...');
        
        // Method 1: Using single()
        const { data: apiKeySingle, error: apiKeySingleError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('partner_id', testUserId)
            .single();
        
        console.log('Method 1 (single()):', apiKeySingleError ? `❌ ${apiKeySingleError.message}` : `✅ ${JSON.stringify(apiKeySingle)}`);
        
        // Method 2: Using maybeSingle()
        const { data: apiKeyMaybe, error: apiKeyMaybeError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('partner_id', testUserId)
            .maybeSingle();
        
        console.log('Method 2 (maybeSingle()):', apiKeyMaybeError ? `❌ ${apiKeyMaybeError.message}` : `✅ ${JSON.stringify(apiKeyMaybe)}`);
        
        // Method 3: Using limit(1)
        const { data: apiKeyLimit, error: apiKeyLimitError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('partner_id', testUserId)
            .limit(1);
        
        console.log('Method 3 (limit(1)):', apiKeyLimitError ? `❌ ${apiKeyLimitError.message}` : `✅ Found ${apiKeyLimit.length} records`);
        
        // 6. Test API key manager function with detailed error
        console.log('\n6. Testing API key manager function...');
        const { data: functionData, error: functionError } = await supabase.functions.invoke('api-key-manager', {
            method: 'GET'
        });
        
        if (functionError) {
            console.error('❌ API key manager function failed:');
            console.error('  Error:', functionError.message);
            console.error('  Status:', functionError.status);
            console.error('  Details:', functionError);
        } else {
            console.log('✅ API key manager function successful:', functionData);
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

debugDatabaseIssues(); 