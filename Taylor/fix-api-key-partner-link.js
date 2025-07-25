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

console.log('🔧 Fixing API Key Partner Link');
console.log('==============================');

// Use service role key for admin operations
const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function fixApiKeyPartnerLink() {
    try {
        const testUserId = '799daeee-1410-4981-8274-38a221279b2d';
        const correctPartnerId = '8c6d25f0-d181-4394-b623-01777743cc1a';
        
        console.log(`\nFixing API key for user: ${testUserId}`);
        console.log(`Correct partner ID: ${correctPartnerId}`);
        
        // 1. Check current API key
        console.log('\n1. Checking current API key...');
        const { data: currentApiKey, error: currentApiKeyError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('partner_id', testUserId)
            .single();
        
        if (currentApiKeyError) {
            console.error('❌ Failed to get current API key:', currentApiKeyError);
            return;
        }
        
        console.log('✅ Current API key:', currentApiKey);
        
        // 2. Update the API key to point to the correct partner
        console.log('\n2. Updating API key partner_id...');
        const { data: updatedApiKey, error: updateError } = await supabase
            .from('api_keys')
            .update({ partner_id: correctPartnerId })
            .eq('id', currentApiKey.id)
            .select()
            .single();
        
        if (updateError) {
            console.error('❌ Failed to update API key:', updateError);
            return;
        }
        
        console.log('✅ Updated API key:', updatedApiKey);
        
        // 3. Verify the update
        console.log('\n3. Verifying the update...');
        const { data: verifiedApiKey, error: verifyError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('partner_id', correctPartnerId)
            .single();
        
        if (verifyError) {
            console.error('❌ Failed to verify API key:', verifyError);
        } else {
            console.log('✅ Verified API key:', verifiedApiKey);
        }
        
        // 4. Clean up the duplicate partner record
        console.log('\n4. Cleaning up duplicate partner record...');
        const { error: deleteError } = await supabase
            .from('partners')
            .delete()
            .eq('id', testUserId);
        
        if (deleteError) {
            console.error('❌ Failed to delete duplicate partner:', deleteError);
        } else {
            console.log('✅ Deleted duplicate partner record');
        }
        
        // 5. Final verification
        console.log('\n5. Final verification...');
        const { data: finalPartners, error: finalPartnersError } = await supabase
            .from('partners')
            .select('*')
            .eq('user_id', testUserId);
        
        if (finalPartnersError) {
            console.error('❌ Failed to verify partners:', finalPartnersError);
        } else {
            console.log(`✅ Found ${finalPartners.length} partner(s) for user:`);
            finalPartners.forEach((partner, index) => {
                console.log(`  ${index + 1}. ID: ${partner.id}, user_id: ${partner.user_id}`);
            });
        }
        
        const { data: finalApiKeys, error: finalApiKeysError } = await supabase
            .from('api_keys')
            .select('*')
            .eq('partner_id', correctPartnerId);
        
        if (finalApiKeysError) {
            console.error('❌ Failed to verify API keys:', finalApiKeysError);
        } else {
            console.log(`✅ Found ${finalApiKeys.length} API key(s) for partner:`);
            finalApiKeys.forEach((apiKey, index) => {
                console.log(`  ${index + 1}. ID: ${apiKey.id}, partner_id: ${apiKey.partner_id}`);
            });
        }
        
        console.log('\n🎉 API key partner link fixed successfully!');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

fixApiKeyPartnerLink(); 