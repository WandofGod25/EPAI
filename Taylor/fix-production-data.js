#!/usr/bin/env node

/**
 * Fix Production Data Script
 * 
 * This script adds sample data to production tables with the correct schema
 * to fix the Edge Function errors.
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

async function fixProductionData() {
    try {
        console.log('🔧 Adding sample data to production...');
        
        // 1. Add sample models (without is_active column)
        console.log('\n1. Adding sample models...');
        try {
            const { data: newModels, error: modelsError } = await supabase
                .from('models')
                .insert([
                    {
                        id: 'attendance-forecast',
                        name: 'Attendance Forecast',
                        description: 'Predicts event attendance based on historical data',
                        version: '1.0.0'
                    },
                    {
                        id: 'lead-scoring',
                        name: 'Lead Scoring',
                        description: 'Scores leads based on engagement and behavior',
                        version: '1.0.0'
                    }
                ])
                .select();
            
            if (modelsError) {
                console.error('❌ Failed to create sample models:', modelsError);
            } else {
                console.log('✅ Created sample models:', newModels);
            }
        } catch (err) {
            console.error('❌ Error creating models:', err.message);
        }
        
        // 2. Add sample insights
        console.log('\n2. Adding sample insights...');
        try {
            const { data: partners } = await supabase
                .from('partners')
                .select('id')
                .limit(1);
            
            if (partners && partners.length > 0) {
                const { data: newInsights, error: insightsError } = await supabase
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
                
                if (insightsError) {
                    console.error('❌ Failed to create sample insights:', insightsError);
                } else {
                    console.log('✅ Created sample insights:', newInsights);
                }
            } else {
                console.log('⚠️  No partners found, skipping insights');
            }
        } catch (err) {
            console.error('❌ Error creating insights:', err.message);
        }
        
        // 3. Add sample logs
        console.log('\n3. Adding sample logs...');
        try {
            const { data: partners } = await supabase
                .from('partners')
                .select('id')
                .limit(1);
            
            if (partners && partners.length > 0) {
                const { data: newLogs, error: logsError } = await supabase
                    .from('logs')
                    .insert([
                        {
                            partner_id: partners[0].id,
                            method: 'POST',
                            path: '/api/ingest',
                            status_code: 200,
                            request_body: '{"event_type": "test"}',
                            response_body: '{"success": true}'
                        }
                    ])
                    .select();
                
                if (logsError) {
                    console.error('❌ Failed to create sample logs:', logsError);
                } else {
                    console.log('✅ Created sample logs:', newLogs);
                }
            } else {
                console.log('⚠️  No partners found, skipping logs');
            }
        } catch (err) {
            console.error('❌ Error creating logs:', err.message);
        }
        
        console.log('\n🎉 Production data fix completed!');
        
    } catch (error) {
        console.error('❌ Data fix failed:', error);
    }
}

fixProductionData(); 