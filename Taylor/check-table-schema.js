#!/usr/bin/env node

/**
 * Check Table Schema Script
 * 
 * This script checks the actual column structure of production tables
 * to understand what columns are available.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Production configuration
const PRODUCTION_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PRODUCTION_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQyMTY4OSwiZXhwIjoyMDY0OTk3Njg5fQ.0D4A99QwPrmU_ecC5KkAQl4isJ3vspSWkYjPYvnEYaU';

// Use service role key for admin operations
const supabase = createClient(PRODUCTION_URL, PRODUCTION_SERVICE_ROLE_KEY);

async function checkTableSchema() {
    try {
        console.log('🔍 Checking table schema in production...');
        
        // Check models table columns by trying different field combinations
        console.log('\n1. Checking models table columns...');
        try {
            // Try to get any data from models table
            const { data: models, error: modelsError } = await supabase
                .from('models')
                .select('*')
                .limit(1);
            
            if (modelsError) {
                console.error('❌ Models table error:', modelsError);
            } else {
                console.log('✅ Models table accessible');
                if (models && models.length > 0) {
                    console.log('   Model columns:', Object.keys(models[0]));
                    console.log('   Sample model:', models[0]);
                } else {
                    console.log('   Models table is empty');
                }
            }
        } catch (err) {
            console.error('❌ Error checking models:', err.message);
        }
        
        // Check insights table columns
        console.log('\n2. Checking insights table columns...');
        try {
            const { data: insights, error: insightsError } = await supabase
                .from('insights')
                .select('*')
                .limit(1);
            
            if (insightsError) {
                console.error('❌ Insights table error:', insightsError);
            } else {
                console.log('✅ Insights table accessible');
                if (insights && insights.length > 0) {
                    console.log('   Insight columns:', Object.keys(insights[0]));
                    console.log('   Sample insight:', insights[0]);
                } else {
                    console.log('   Insights table is empty');
                }
            }
        } catch (err) {
            console.error('❌ Error checking insights:', err.message);
        }
        
        // Check logs table columns
        console.log('\n3. Checking logs table columns...');
        try {
            const { data: logs, error: logsError } = await supabase
                .from('logs')
                .select('*')
                .limit(1);
            
            if (logsError) {
                console.error('❌ Logs table error:', logsError);
            } else {
                console.log('✅ Logs table accessible');
                if (logs && logs.length > 0) {
                    console.log('   Log columns:', Object.keys(logs[0]));
                    console.log('   Sample log:', logs[0]);
                } else {
                    console.log('   Logs table is empty');
                }
            }
        } catch (err) {
            console.error('❌ Error checking logs:', err.message);
        }
        
        console.log('\n🎉 Schema check completed!');
        
    } catch (error) {
        console.error('❌ Schema check failed:', error);
    }
}

checkTableSchema(); 