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

console.log('🔄 Database Reset - Clean State');
console.log('================================');

// Use service role key for admin operations
const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function resetDatabaseClean() {
    try {
        const testEmail = 'ange_andre25@yahoo.com';
        const testPassword = 'Taylortest';
        
        console.log(`\nResetting database for user: ${testEmail}`);
        
        // 1. Delete existing user from auth
        console.log('\n1. Deleting existing user from auth...');
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
            console.error('❌ Failed to list users:', listError);
        } else {
            const user = users.users.find(u => u.email === testEmail);
            if (user) {
                const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
                if (deleteError) {
                    console.error('❌ Failed to delete user:', deleteError);
                } else {
                    console.log('✅ Deleted existing user from auth');
                }
            } else {
                console.log('ℹ️ User not found in auth, proceeding...');
            }
        }
        
        // 2. Clean up database tables
        console.log('\n2. Cleaning up database tables...');
        
        // Delete API keys
        const { error: apiKeysError } = await supabase
            .from('api_keys')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep system keys
        
        if (apiKeysError) {
            console.error('❌ Failed to delete API keys:', apiKeysError);
        } else {
            console.log('✅ Deleted API keys');
        }
        
        // Delete partners
        const { error: partnersError } = await supabase
            .from('partners')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep system partner
        
        if (partnersError) {
            console.error('❌ Failed to delete partners:', partnersError);
        } else {
            console.log('✅ Deleted partners');
        }
        
        // 3. Create new user
        console.log('\n3. Creating new user...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true
        });
        
        if (createError) {
            console.error('❌ Failed to create user:', createError);
            return;
        }
        
        console.log('✅ Created new user:', newUser.user.id);
        
        // 4. Create partner record
        console.log('\n4. Creating partner record...');
        const { data: partner, error: partnerError } = await supabase
            .from('partners')
            .insert({
                id: newUser.user.id,
                company_name: testEmail,
                user_id: newUser.user.id
            })
            .select()
            .single();
        
        if (partnerError) {
            console.error('❌ Failed to create partner:', partnerError);
            return;
        }
        
        console.log('✅ Created partner record:', partner.id);
        
        // 5. Create API key
        console.log('\n5. Creating API key...');
        const { data: apiKey, error: apiKeyError } = await supabase
            .from('api_keys')
            .insert({
                partner_id: partner.id,
                api_key_hash: 'placeholder_for_test'
            })
            .select()
            .single();
        
        if (apiKeyError) {
            console.error('❌ Failed to create API key:', apiKeyError);
            return;
        }
        
        console.log('✅ Created API key:', apiKey.id);
        
        // 6. Verify everything works
        console.log('\n6. Verifying setup...');
        
        // Test authentication
        const authClient = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);
        const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        
        if (authError) {
            console.error('❌ Authentication test failed:', authError);
        } else {
            console.log('✅ Authentication test successful');
        }
        
        // Test Edge Function
        const { data: functionData, error: functionError } = await authClient.functions.invoke('api-key-manager', {
            method: 'GET'
        });
        
        if (functionError) {
            console.error('❌ Edge Function test failed:', functionError);
        } else {
            console.log('✅ Edge Function test successful:', functionData);
        }
        
        console.log('\n🎉 Database reset completed successfully!');
        console.log('\nLogin credentials:');
        console.log(`Email: ${testEmail}`);
        console.log(`Password: ${testPassword}`);
        console.log(`User ID: ${newUser.user.id}`);
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

resetDatabaseClean(); 