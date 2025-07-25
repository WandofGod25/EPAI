#!/usr/bin/env node

/**
 * Test Edge Functions Directly Script
 * 
 * This script tests Edge Functions directly to get detailed error information.
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

async function testEdgeFunctionsDirectly() {
    try {
        console.log('🔍 Testing Edge Functions directly...');
        
        // 1. Authenticate first
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
        
        // 2. Test get-models with detailed error handling
        console.log('\n2. Testing get-models Edge Function...');
        try {
            const { data: modelsData, error: modelsError } = await supabase.functions.invoke('get-models', {
                method: 'POST',
                body: { page: 0 }
            });
            
            if (modelsError) {
                console.error('❌ get-models failed:');
                console.error('  Error:', modelsError.message);
                console.error('  Status:', modelsError.status);
                
                // Try to get the response body
                if (modelsError.context) {
                    try {
                        const errorBody = await modelsError.context.text();
                        console.error('  Response body:', errorBody);
                    } catch (e) {
                        console.error('  Could not read response body');
                    }
                }
            } else {
                console.log('✅ get-models successful:', modelsData);
            }
        } catch (err) {
            console.error('❌ get-models exception:', err.message);
        }
        
        // 3. Test get-insights with detailed error handling
        console.log('\n3. Testing get-insights Edge Function...');
        try {
            const { data: insightsData, error: insightsError } = await supabase.functions.invoke('get-insights', {
                method: 'POST'
            });
            
            if (insightsError) {
                console.error('❌ get-insights failed:');
                console.error('  Error:', insightsError.message);
                console.error('  Status:', insightsError.status);
                
                // Try to get the response body
                if (insightsError.context) {
                    try {
                        const errorBody = await insightsError.context.text();
                        console.error('  Response body:', errorBody);
                    } catch (e) {
                        console.error('  Could not read response body');
                    }
                }
            } else {
                console.log('✅ get-insights successful:', insightsData);
            }
        } catch (err) {
            console.error('❌ get-insights exception:', err.message);
        }
        
        console.log('\n🎉 Edge Function test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testEdgeFunctionsDirectly(); 