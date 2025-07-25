#!/usr/bin/env node

/**
 * Check Production Database Schema Script
 * 
 * This script checks the actual schema of tables in production
 * to understand the correct column structure.
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

async function checkProductionSchema() {
    try {
        console.log('🔍 Checking production database schema...');
        
        // Check models table structure
        console.log('\n1. Checking models table structure...');
        try {
            const { data: models, error: modelsError } = await supabase
                .from('models')
                .select('*')
                .limit(1);
            
            if (modelsError) {
                console.error('❌ Models table error:', modelsError);
            } else {
                console.log('✅ Models table accessible');
                if (models && models.length > 0) {
                    console.log('   Sample model:', models[0]);
                } else {
                    console.log('   Models table is empty');
                }
            }
        } catch (err) {
            console.error('❌ Error checking models:', err.message);
        }
        
        // Check insights table structure
        console.log('\n2. Checking insights table structure...');
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
                    console.log('   Sample insight:', insights[0]);
                } else {
                    console.log('   Insights table is empty');
                }
            }
        } catch (err) {
            console.error('❌ Error checking insights:', err.message);
        }
        
        // Check logs table structure
        console.log('\n3. Checking logs table structure...');
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
                    console.log('   Sample log:', logs[0]);
                } else {
                    console.log('   Logs table is empty');
                }
            }
        } catch (err) {
            console.error('❌ Error checking logs:', err.message);
        }
        
        // Check partners table structure
        console.log('\n4. Checking partners table structure...');
        try {
            const { data: partners, error: partnersError } = await supabase
                .from('partners')
                .select('*')
                .limit(1);
            
            if (partnersError) {
                console.error('❌ Partners table error:', partnersError);
            } else {
                console.log('✅ Partners table accessible');
                if (partners && partners.length > 0) {
                    console.log('   Sample partner:', partners[0]);
                } else {
                    console.log('   Partners table is empty');
                }
            }
        } catch (err) {
            console.error('❌ Error checking partners:', err.message);
        }
        
        console.log('\n🎉 Schema check completed!');
        
    } catch (error) {
        console.error('❌ Schema check failed:', error);
    }
}

checkProductionSchema(); 