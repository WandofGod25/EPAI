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

console.log('🔧 Setting Up Everything');
console.log('========================');

// Use service role key for admin operations
const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function setupEverything() {
    try {
        const testEmail = 'ange_andre25@yahoo.com';
        const testPassword = 'Taylortest';
        
        // 1. Create user
        console.log('\n1. Creating user...');
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
        
        // 2. Create partner record
        console.log('\n2. Creating partner record...');
        const { data: partner, error: partnerError } = await supabase
            .from('partners')
            .insert({
                id: newUser.user.id,
                user_id: newUser.user.id
            })
            .select()
            .single();
        
        if (partnerError) {
            console.error('❌ Failed to create partner:', partnerError);
            return;
        }
        
        console.log('✅ Created partner record:', partner.id);
        
        // 3. Create API key
        console.log('\n3. Creating API key...');
        const { data: apiKey, error: apiKeyError } = await supabase
            .from('api_keys')
            .insert({
                partner_id: partner.id,
                api_key: 'test_api_key_12345',
                api_key_hash: 'placeholder_for_test'
            })
            .select()
            .single();
        
        if (apiKeyError) {
            console.error('❌ Failed to create API key:', apiKeyError);
            return;
        }
        
        console.log('✅ Created API key:', apiKey.id);
        
        // 4. Add sample insights
        console.log('\n4. Adding sample insights...');
        const { data: modelData, error: modelError } = await supabase
            .from('model_configs')
            .select('model_id')
            .limit(1)
            .single();
        
        if (modelError) {
            console.error('❌ Failed to get model:', modelError);
            return;
        }
        
        const sampleInsights = [
            {
                partner_id: partner.id,
                model_id: modelData.model_id,
                insight_type: 'attendance_prediction',
                title: 'High Attendance Expected',
                description: 'Based on current engagement patterns, we predict 85% attendance for your next event.',
                confidence_score: 0.87,
                prediction_value: { predicted_attendance: 85, confidence_interval: [80, 90] },
                metadata: { event_type: 'conference', prediction_horizon: '7_days' }
            },
            {
                partner_id: partner.id,
                model_id: modelData.model_id,
                insight_type: 'engagement_trend',
                title: 'Increasing User Engagement',
                description: 'User engagement has increased by 23% over the last 30 days.',
                confidence_score: 0.92,
                prediction_value: { engagement_increase: 23, trend_direction: 'upward' },
                metadata: { time_period: '30_days', metric: 'engagement_rate' }
            }
        ];
        
        const { error: insertError } = await supabase
            .from('insights')
            .insert(sampleInsights);
        
        if (insertError) {
            console.error('❌ Failed to insert sample insights:', insertError);
        } else {
            console.log('✅ Sample insights added');
        }
        
        // 5. Test authentication
        console.log('\n5. Testing authentication...');
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
        
        // 6. Test Edge Functions
        console.log('\n6. Testing Edge Functions...');
        
        // Test get-models
        const { data: modelsData, error: modelsError } = await authClient.functions.invoke('get-models', {
            body: { page: 0 }
        });
        
        if (modelsError) {
            console.error('❌ get-models failed:', modelsError);
        } else {
            console.log('✅ get-models successful');
        }
        
        // Test get-partner-logs
        const { data: logsData, error: logsError } = await authClient.functions.invoke('get-partner-logs', {
            method: 'GET'
        });
        
        if (logsError) {
            console.error('❌ get-partner-logs failed:', logsError);
        } else {
            console.log('✅ get-partner-logs successful');
        }
        
        // Test get-insights
        const { data: insightsData, error: insightsError } = await authClient.functions.invoke('get-insights', {
            method: 'GET'
        });
        
        if (insightsError) {
            console.error('❌ get-insights failed:', insightsError);
        } else {
            console.log('✅ get-insights successful');
        }
        
        console.log('\n🎉 Everything set up successfully!');
        console.log('\nLogin credentials:');
        console.log(`Email: ${testEmail}`);
        console.log(`Password: ${testPassword}`);
        console.log(`User ID: ${newUser.user.id}`);
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

setupEverything(); 