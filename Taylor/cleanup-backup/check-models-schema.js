#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const PRODUCTION_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PRODUCTION_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PRODUCTION_URL, PRODUCTION_ANON_KEY);

async function checkModelsSchema() {
    try {
        console.log('🔍 Checking Models Table Schema');
        console.log('===============================\n');
        
        // Try to get the schema information
        const { data: schemaInfo, error: schemaError } = await supabase
            .rpc('get_table_schema', { table_name: 'models' });
            
        if (schemaError) {
            console.log('Schema RPC not available, trying direct query...');
            
            // Try to insert a test record to see what columns exist
            const testModel = {
                model_name: 'Test Model',
                description: 'Test Description',
                model_version: '1.0.0',
                status: 'active'
            };
            
            const { data: testInsert, error: testError } = await supabase
                .from('models')
                .insert(testModel)
                .select();
                
            if (testError) {
                console.error('❌ Test insert error:', testError);
                console.log('This shows us what columns are expected');
                return;
            }
            
            console.log('✅ Test insert successful');
            console.log('Test data:', testInsert);
            
            // Clean up test data
            await supabase
                .from('models')
                .delete()
                .eq('model_name', 'Test Model');
                
        } else {
            console.log('Schema info:', schemaInfo);
        }
        
    } catch (error) {
        console.error('❌ Error checking schema:', error);
    }
}

checkModelsSchema();
