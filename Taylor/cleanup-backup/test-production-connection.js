#!/usr/bin/env node

/**
 * Test Production Connection Script
 * 
 * This script tests the connection to the production Supabase instance
 * and verifies that the API key functionality is working correctly.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Production configuration
const PRODUCTION_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PRODUCTION_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

// Create Supabase client
const supabase = createClient(PRODUCTION_URL, PRODUCTION_ANON_KEY);

async function testProductionConnection() {
    try {
        console.log('🔍 Testing production connection...');
        
        // 1. Test basic connection
        console.log('\n1. Testing basic connection...');
        const { data: healthData, error: healthError } = await supabase.from('partners').select('count').limit(1);
        
        if (healthError) {
            console.error('❌ Basic connection failed:', healthError);
            return;
        }
        
        console.log('✅ Basic connection successful');
        
        // 2. Test authentication
        console.log('\n2. Testing authentication...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'ange_andre25@yahoo.com',
            password: 'Taylortest'
        });
        
        if (authError) {
            console.error('❌ Authentication failed:', authError);
            return;
        }
        
        console.log('✅ Authentication successful');
        console.log('   User ID:', authData.user.id);
        console.log('   Email:', authData.user.email);
        
        // 3. Test API key Edge Function
        console.log('\n3. Testing API key Edge Function...');
        const { data: apiKeyData, error: apiKeyError } = await supabase.functions.invoke('api-key-manager', {
            method: 'GET'
        });
        
        if (apiKeyError) {
            console.error('❌ API key Edge Function failed:', apiKeyError);
            console.error('   Error details:', JSON.stringify(apiKeyError, null, 2));
            return;
        }
        
        console.log('✅ API key Edge Function successful');
        console.log('   Response:', JSON.stringify(apiKeyData, null, 2));
        
        if (apiKeyData && apiKeyData.apiKey) {
            console.log('   API Key found:', apiKeyData.apiKey.substring(0, 10) + '...');
            console.log('   API Key length:', apiKeyData.apiKey.length);
        } else {
            console.log('   No API key in response');
        }
        
        // 4. Test other Edge Functions
        console.log('\n4. Testing other Edge Functions...');
        
        // Test get-models
        const { data: modelsData, error: modelsError } = await supabase.functions.invoke('get-models', {
            method: 'GET'
        });
        
        if (modelsError) {
            console.error('❌ get-models Edge Function failed:', modelsError);
        } else {
            console.log('✅ get-models Edge Function successful');
        }
        
        // Test get-insights
        const { data: insightsData, error: insightsError } = await supabase.functions.invoke('get-insights', {
            method: 'GET'
        });
        
        if (insightsError) {
            console.error('❌ get-insights Edge Function failed:', insightsError);
        } else {
            console.log('✅ get-insights Edge Function successful');
        }
        
        console.log('\n🎉 Production connection test completed successfully!');
        console.log('🌐 Production URL:', PRODUCTION_URL);
        console.log('📧 Test Email:', 'ange_andre25@yahoo.com');
        console.log('🔑 Test Password:', 'Taylortest');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testProductionConnection(); 