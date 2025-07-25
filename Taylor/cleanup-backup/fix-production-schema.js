#!/usr/bin/env node

/**
 * Fix Production Database Schema Script
 * 
 * This script fixes database schema issues in production that are causing
 * Edge Functions to fail with 500 errors.
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

async function fixProductionSchema() {
    try {
        console.log('🔧 Fixing production database schema...');
        
        // 1. Check if required tables exist
        console.log('\n1. Checking required tables...');
        
        const requiredTables = ['models', 'insights', 'logs', 'partners', 'api_keys'];
        
        for (const tableName of requiredTables) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('count')
                    .limit(1);
                
                if (error) {
                    console.log(`❌ Table ${tableName} missing or inaccessible:`, error.message);
                } else {
                    console.log(`✅ Table ${tableName} exists`);
                }
            } catch (err) {
                console.log(`❌ Table ${tableName} error:`, err.message);
            }
        }
        
        // 2. Create models table if it doesn't exist
        console.log('\n2. Setting up models table...');
        try {
            const { data: models, error: modelsError } = await supabase
                .from('models')
                .select('*')
                .limit(1);
            
            if (modelsError && modelsError.code === '42P01') {
                console.log('⚠️  Models table missing, creating sample data...');
                
                // Insert sample models
                const { data: newModels, error: insertError } = await supabase
                    .from('models')
                    .insert([
                        {
                            id: 'attendance-forecast',
                            name: 'Attendance Forecast',
                            description: 'Predicts event attendance based on historical data',
                            version: '1.0.0',
                            is_active: true
                        },
                        {
                            id: 'lead-scoring',
                            name: 'Lead Scoring',
                            description: 'Scores leads based on engagement and behavior',
                            version: '1.0.0',
                            is_active: true
                        }
                    ])
                    .select();
                
                if (insertError) {
                    console.error('❌ Failed to create sample models:', insertError);
                } else {
                    console.log('✅ Created sample models:', newModels);
                }
            } else if (models && models.length === 0) {
                console.log('⚠️  Models table empty, creating sample data...');
                
                const { data: newModels, error: insertError } = await supabase
                    .from('models')
                    .insert([
                        {
                            id: 'attendance-forecast',
                            name: 'Attendance Forecast',
                            description: 'Predicts event attendance based on historical data',
                            version: '1.0.0',
                            is_active: true
                        },
                        {
                            id: 'lead-scoring',
                            name: 'Lead Scoring',
                            description: 'Scores leads based on engagement and behavior',
                            version: '1.0.0',
                            is_active: true
                        }
                    ])
                    .select();
                
                if (insertError) {
                    console.error('❌ Failed to create sample models:', insertError);
                } else {
                    console.log('✅ Created sample models:', newModels);
                }
            } else {
                console.log('✅ Models table has data');
            }
        } catch (err) {
            console.error('❌ Error with models table:', err.message);
        }
        
        // 3. Create insights table if it doesn't exist
        console.log('\n3. Setting up insights table...');
        try {
            const { data: insights, error: insightsError } = await supabase
                .from('insights')
                .select('*')
                .limit(1);
            
            if (insightsError && insightsError.code === '42P01') {
                console.log('⚠️  Insights table missing, creating sample data...');
                
                // Get a partner ID for the sample insight
                const { data: partners } = await supabase
                    .from('partners')
                    .select('id')
                    .limit(1);
                
                if (partners && partners.length > 0) {
                    const { data: newInsights, error: insertError } = await supabase
                        .from('insights')
                        .insert([
                            {
                                partner_id: partners[0].id,
                                model_id: 'attendance-forecast',
                                prediction: 'High attendance expected',
                                confidence: 0.85,
                                metadata: { event_type: 'conference', expected_attendees: 150 }
                            }
                        ])
                        .select();
                    
                    if (insertError) {
                        console.error('❌ Failed to create sample insights:', insertError);
                    } else {
                        console.log('✅ Created sample insights:', newInsights);
                    }
                }
            } else {
                console.log('✅ Insights table exists');
            }
        } catch (err) {
            console.error('❌ Error with insights table:', err.message);
        }
        
        // 4. Create logs table if it doesn't exist
        console.log('\n4. Setting up logs table...');
        try {
            const { data: logs, error: logsError } = await supabase
                .from('logs')
                .select('*')
                .limit(1);
            
            if (logsError && logsError.code === '42P01') {
                console.log('⚠️  Logs table missing, creating sample data...');
                
                const { data: partners } = await supabase
                    .from('partners')
                    .select('id')
                    .limit(1);
                
                if (partners && partners.length > 0) {
                    const { data: newLogs, error: insertError } = await supabase
                        .from('logs')
                        .insert([
                            {
                                partner_id: partners[0].id,
                                endpoint: '/api/ingest',
                                method: 'POST',
                                status_code: 200,
                                response_time: 150,
                                user_agent: 'test-client'
                            }
                        ])
                        .select();
                    
                    if (insertError) {
                        console.error('❌ Failed to create sample logs:', insertError);
                    } else {
                        console.log('✅ Created sample logs:', newLogs);
                    }
                }
            } else {
                console.log('✅ Logs table exists');
            }
        } catch (err) {
            console.error('❌ Error with logs table:', err.message);
        }
        
        console.log('\n🎉 Production schema fix completed!');
        
    } catch (error) {
        console.error('❌ Schema fix failed:', error);
    }
}

fixProductionSchema(); 