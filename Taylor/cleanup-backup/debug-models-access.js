#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const PRODUCTION_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PRODUCTION_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PRODUCTION_URL, PRODUCTION_ANON_KEY);

async function debugModelsAccess() {
    try {
        console.log('🔍 Debugging Models Access');
        console.log('==========================\n');
        
        // 1. Check without authentication
        console.log('1. 🔍 Checking models without authentication...');
        const { data: modelsNoAuth, error: errorNoAuth } = await supabase
            .from('models')
            .select('*');
            
        console.log(`   Models without auth: ${modelsNoAuth?.length || 0}`);
        if (errorNoAuth) console.log(`   Error: ${errorNoAuth.message}`);
        
        // 2. Authenticate
        console.log('\n2. 🔐 Authenticating...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'ange_andre25@yahoo.com',
            password: 'Taylortest'
        });
        
        if (authError) {
            console.error('❌ Authentication failed:', authError);
            return;
        }
        
        console.log('✅ Authentication successful');
        console.log(`   User ID: ${authData.user.id}`);
        
        // 3. Check with authentication
        console.log('\n3. 🔍 Checking models with authentication...');
        const { data: modelsWithAuth, error: errorWithAuth } = await supabase
            .from('models')
            .select('*');
            
        console.log(`   Models with auth: ${modelsWithAuth?.length || 0}`);
        if (errorWithAuth) console.log(`   Error: ${errorWithAuth.message}`);
        
        if (modelsWithAuth && modelsWithAuth.length > 0) {
            console.log('   Models found:');
            modelsWithAuth.forEach((model, index) => {
                console.log(`     ${index + 1}. ${model.model_name}`);
                console.log(`        - ID: ${model.id}`);
                console.log(`        - Category: ${model.metadata?.category || 'N/A'}`);
                console.log(`        - Status: ${model.status}`);
            });
        }
        
        // 4. Check partner relationship
        console.log('\n4. 🔍 Checking partner relationship...');
        const { data: partner, error: partnerError } = await supabase
            .from('partners')
            .select('*')
            .eq('user_id', authData.user.id)
            .single();
            
        if (partnerError) {
            console.log(`   Partner error: ${partnerError.message}`);
        } else {
            console.log(`   Partner found: ${partner.name} (ID: ${partner.id})`);
        }
        
        // 5. Try to get models through the get-models Edge Function
        console.log('\n5. 🔍 Checking get-models Edge Function...');
        const { data: modelsFromFunction, error: functionError } = await supabase.functions.invoke('get-models', {
            method: 'GET'
        });
        
        if (functionError) {
            console.log(`   Function error: ${functionError.message}`);
        } else {
            console.log(`   Models from function: ${modelsFromFunction?.length || 0}`);
            if (modelsFromFunction && modelsFromFunction.length > 0) {
                modelsFromFunction.forEach((model, index) => {
                    console.log(`     ${index + 1}. ${model.model_name}`);
                });
            }
        }
        
        console.log('\n🎯 Analysis:');
        console.log('============');
        console.log(`   Models without auth: ${modelsNoAuth?.length || 0}`);
        console.log(`   Models with auth: ${modelsWithAuth?.length || 0}`);
        console.log(`   Models from function: ${modelsFromFunction?.length || 0}`);
        
        if (modelsWithAuth && modelsWithAuth.length > 0) {
            console.log('   ✅ Models exist and are accessible');
        } else {
            console.log('   ❌ Models are not accessible or don\'t exist');
            console.log('   💡 This might be due to RLS policies');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugModelsAccess();
