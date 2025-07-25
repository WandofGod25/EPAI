#!/usr/bin/env node

/**
 * Fix Production Data with Correct Schema Script
 * 
 * This script adds sample data to production tables using the correct schema
 * based on the actual column structure.
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

// Generate a UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function fixProductionDataCorrect() {
    try {
        console.log('🔧 Adding sample data with correct schema...');
        
        // 1. Add sample models with correct column names
        console.log('\n1. Adding sample models...');
        try {
            const { data: newModels, error: modelsError } = await supabase
                .from('models')
                .insert([
                    {
                        model_name: 'Attendance Forecast',
                        description: 'Predicts event attendance based on historical data',
                        model_version: '1.0.0',
                        status: 'active',
                        metadata: { type: 'forecasting', category: 'events' }
                    },
                    {
                        model_name: 'Lead Scoring',
                        description: 'Scores leads based on engagement and behavior',
                        model_version: '1.0.0',
                        status: 'active',
                        metadata: { type: 'scoring', category: 'sales' }
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
        
        // 2. Create a sample ingestion event first (required for insights)
        console.log('\n2. Creating sample ingestion event...');
        try {
            const { data: partners } = await supabase
                .from('partners')
                .select('id')
                .limit(1);
            
            if (partners && partners.length > 0) {
                const { data: ingestionEvent, error: ingestionError } = await supabase
                    .from('ingestion_events')
                    .insert([
                        {
                            partner_id: partners[0].id,
                            event_type: 'test_event',
                            event_data: { test: true },
                            processed: true
                        }
                    ])
                    .select();
                
                if (ingestionError) {
                    console.error('❌ Failed to create ingestion event:', ingestionError);
                } else {
                    console.log('✅ Created ingestion event:', ingestionEvent);
                    
                    // 3. Add sample insights using the ingestion event
                    console.log('\n3. Adding sample insights...');
                    const { data: newInsights, error: insightsError } = await supabase
                        .from('insights')
                        .insert([
                            {
                                partner_id: partners[0].id,
                                ingestion_event_id: ingestionEvent[0].id,
                                model_id: generateUUID(), // Use a random UUID for now
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
                }
            } else {
                console.log('⚠️  No partners found, skipping insights');
            }
        } catch (err) {
            console.error('❌ Error creating insights:', err.message);
        }
        
        console.log('\n🎉 Production data fix completed!');
        
    } catch (error) {
        console.error('❌ Data fix failed:', error);
    }
}

fixProductionDataCorrect(); 