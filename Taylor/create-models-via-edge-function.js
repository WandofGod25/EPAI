#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const PRODUCTION_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PRODUCTION_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PRODUCTION_URL, PRODUCTION_ANON_KEY);

async function createModelsViaEdgeFunction() {
    try {
        console.log('🚀 Creating Models via Edge Function');
        console.log('====================================\n');
        
        // First authenticate
        console.log('1. 🔐 Authenticating...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'ange_andre25@yahoo.com',
            password: 'Taylortest'
        });
        
        if (authError) {
            console.error('❌ Authentication failed:', authError);
            return;
        }
        
        console.log('✅ Authentication successful');
        
        // Create a simple Edge Function to add models
        console.log('\n2. 📝 Creating models via direct SQL...');
        
        // Try to create models using a simple approach - just create 2 basic models first
        const basicModels = [
            {
                model_name: 'Attendance Forecast',
                description: 'Predicts event attendance based on historical data and engagement metrics',
                model_version: '1.0.0',
                status: 'active',
                metadata: {
                    category: 'Event Management',
                    useCase: 'Event planning, capacity management',
                    accuracy: 0.85
                }
            },
            {
                model_name: 'Lead Scoring',
                description: 'Scores leads based on engagement, demographics, and behavior patterns',
                model_version: '1.0.0',
                status: 'active',
                metadata: {
                    category: 'CRM Systems',
                    useCase: 'Sales prioritization, lead qualification',
                    accuracy: 0.88
                }
            }
        ];
        
        // Try to insert using the authenticated user context
        const { data: insertedModels, error: insertError } = await supabase
            .from('models')
            .insert(basicModels)
            .select();
            
        if (insertError) {
            console.error('❌ Error inserting models:', insertError);
            console.log('This suggests we need to use a different approach');
            return;
        }
        
        console.log(`✅ Successfully created ${insertedModels.length} basic models!`);
        console.log('Models created:');
        insertedModels.forEach(model => {
            console.log(`  - ${model.model_name} (${model.metadata.category})`);
        });
        
        console.log('\n🎯 Next Steps:');
        console.log('   - Verify models appear in the Models page');
        console.log('   - Add more models as needed');
        console.log('   - Consider creating an admin Edge Function for model management');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createModelsViaEdgeFunction();
