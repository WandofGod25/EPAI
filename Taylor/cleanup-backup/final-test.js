#!/usr/bin/env node

/**
 * Final Comprehensive Test Script
 * 
 * This script tests all major components to verify the application is working.
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

async function finalTest() {
    console.log('🎯 FINAL COMPREHENSIVE TEST');
    console.log('=============================\n');
    
    let allTestsPassed = true;
    
    try {
        // Test 1: Basic Connection
        console.log('1. Testing basic connection...');
        const { data: healthData, error: healthError } = await supabase.from('partners').select('count').limit(1);
        
        if (healthError) {
            console.log('❌ Basic connection failed:', healthError.message);
            allTestsPassed = false;
        } else {
            console.log('✅ Basic connection successful');
        }
        
        // Test 2: Authentication
        console.log('\n2. Testing authentication...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'ange_andre25@yahoo.com',
            password: 'Taylortest'
        });
        
        if (authError) {
            console.log('❌ Authentication failed:', authError.message);
            allTestsPassed = false;
        } else {
            console.log('✅ Authentication successful');
            console.log('   User ID:', authData.user.id);
            console.log('   Email:', authData.user.email);
        }
        
        // Test 3: API Key Management
        console.log('\n3. Testing API key management...');
        const { data: apiKeyData, error: apiKeyError } = await supabase.functions.invoke('api-key-manager', {
            method: 'GET'
        });
        
        if (apiKeyError) {
            console.log('❌ API key management failed:', apiKeyError.message);
            allTestsPassed = false;
        } else {
            console.log('✅ API key management successful');
            if (apiKeyData && apiKeyData.apiKey) {
                console.log('   API Key found:', apiKeyData.apiKey.substring(0, 10) + '...');
                console.log('   API Key length:', apiKeyData.apiKey.length);
            }
        }
        
        // Test 4: Models Function
        console.log('\n4. Testing models function...');
        const { data: modelsData, error: modelsError } = await supabase.functions.invoke('get-models', {
            method: 'POST',
            body: { page: 0 }
        });
        
        if (modelsError) {
            console.log('❌ Models function failed:', modelsError.message);
            allTestsPassed = false;
        } else {
            console.log('✅ Models function successful');
            console.log('   Models found:', modelsData.models?.length || 0);
            console.log('   Total count:', modelsData.count);
        }
        
        // Test 5: Database Schema
        console.log('\n5. Testing database schema...');
        const { data: models, error: modelsSchemaError } = await supabase
            .from('models')
            .select('*')
            .limit(1);
        
        if (modelsSchemaError) {
            console.log('❌ Models table access failed:', modelsSchemaError.message);
            allTestsPassed = false;
        } else {
            console.log('✅ Models table accessible');
            console.log('   Models in database:', models?.length || 0);
        }
        
        // Test 6: Partners Table
        console.log('\n6. Testing partners table...');
        const { data: partners, error: partnersError } = await supabase
            .from('partners')
            .select('*')
            .limit(1);
        
        if (partnersError) {
            console.log('❌ Partners table access failed:', partnersError.message);
            allTestsPassed = false;
        } else {
            console.log('✅ Partners table accessible');
            console.log('   Partners in database:', partners?.length || 0);
        }
        
        // Test 7: API Keys Table
        console.log('\n7. Testing API keys table...');
        const { data: apiKeys, error: apiKeysError } = await supabase
            .from('api_keys')
            .select('*')
            .limit(1);
        
        if (apiKeysError) {
            console.log('❌ API keys table access failed:', apiKeysError.message);
            allTestsPassed = false;
        } else {
            console.log('✅ API keys table accessible');
            console.log('   API keys in database:', apiKeys?.length || 0);
        }
        
        // Test 8: Frontend Accessibility
        console.log('\n8. Testing frontend accessibility...');
        try {
            const response = await fetch('http://localhost:5174');
            if (response.ok) {
                console.log('✅ Frontend is accessible');
                console.log('   Status:', response.status);
            } else {
                console.log('❌ Frontend not accessible');
                console.log('   Status:', response.status);
                allTestsPassed = false;
            }
        } catch (error) {
            console.log('❌ Frontend test failed:', error.message);
            allTestsPassed = false;
        }
        
        // Summary
        console.log('\n=============================');
        console.log('🎯 TEST SUMMARY');
        console.log('=============================');
        
        if (allTestsPassed) {
            console.log('✅ ALL TESTS PASSED!');
            console.log('🚀 The application is working correctly.');
            console.log('\n📋 Working Components:');
            console.log('   - Basic database connection');
            console.log('   - User authentication');
            console.log('   - API key management');
            console.log('   - Models Edge Function');
            console.log('   - Database schema');
            console.log('   - Frontend accessibility');
            console.log('\n⚠️  Known Issues:');
            console.log('   - get-insights Edge Function has authentication issues');
            console.log('   - Some Edge Functions may need further optimization');
            
        } else {
            console.log('❌ SOME TESTS FAILED');
            console.log('🔧 Please review the failed tests above.');
        }
        
        console.log('\n🌐 Production URL: https://rxeqkrfldtywkhnxcoys.supabase.co');
        console.log('📧 Test Email: ange_andre25@yahoo.com');
        console.log('🔑 Test Password: Taylortest');
        console.log('🚀 Frontend URL: http://localhost:5174');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

finalTest(); 