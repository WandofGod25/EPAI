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

console.log('🔍 Checking Partners Table Schema');
console.log('==================================');

// Use service role key for admin operations
const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkPartnersSchema() {
    try {
        const testUserId = '799daeee-1410-4981-8274-38a221279b2d';
        
        console.log(`\nChecking schema for user: ${testUserId}`);
        
        // 1. Check the partner record we created
        console.log('\n1. Checking our partner record...');
        const { data: ourPartner, error: ourPartnerError } = await supabase
            .from('partners')
            .select('*')
            .eq('id', testUserId)
            .single();
        
        if (ourPartnerError) {
            console.error('❌ Failed to get our partner record:', ourPartnerError);
        } else {
            console.log('✅ Our partner record:', ourPartner);
        }
        
        // 2. Check if there are any partners with user_id field
        console.log('\n2. Checking for partners with user_id field...');
        const { data: partnersWithUserId, error: partnersWithUserIdError } = await supabase
            .from('partners')
            .select('*')
            .not('user_id', 'is', null);
        
        if (partnersWithUserIdError) {
            console.error('❌ Failed to check partners with user_id:', partnersWithUserIdError);
        } else {
            console.log(`Found ${partnersWithUserId.length} partners with user_id field:`);
            partnersWithUserId.forEach((partner, index) => {
                console.log(`  ${index + 1}. ID: ${partner.id}, user_id: ${partner.user_id}`);
            });
        }
        
        // 3. Check if there's a partner with user_id matching our user
        console.log('\n3. Checking for partner with user_id matching our user...');
        const { data: partnerWithUserId, error: partnerWithUserIdError } = await supabase
            .from('partners')
            .select('*')
            .eq('user_id', testUserId)
            .maybeSingle();
        
        if (partnerWithUserIdError) {
            console.error('❌ Failed to check partner with user_id:', partnerWithUserIdError);
        } else if (partnerWithUserId) {
            console.log('✅ Found partner with user_id:', partnerWithUserId);
        } else {
            console.log('❌ No partner found with user_id matching our user');
        }
        
        // 4. Check all partners to see the pattern
        console.log('\n4. All partners in database:');
        const { data: allPartners, error: allPartnersError } = await supabase
            .from('partners')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (allPartnersError) {
            console.error('❌ Failed to get all partners:', allPartnersError);
        } else {
            console.log(`Found ${allPartners.length} partners:`);
            allPartners.forEach((partner, index) => {
                console.log(`  ${index + 1}. ID: ${partner.id}, user_id: ${partner.user_id}, company_name: ${partner.company_name}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkPartnersSchema(); 