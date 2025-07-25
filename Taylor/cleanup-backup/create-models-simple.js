#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const PRODUCTION_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PRODUCTION_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PRODUCTION_URL, PRODUCTION_ANON_KEY);

async function createModelsSimple() {
    try {
        console.log('🚀 Creating Core EPAI Models (Simple Approach)');
        console.log('==============================================\n');
        
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
        
        // Check if models already exist
        console.log('\n2. 🔍 Checking existing models...');
        const { data: existingModels, error: checkError } = await supabase
            .from('models')
            .select('model_name')
            .order('created_at', { ascending: true });
            
        if (checkError) {
            console.error('❌ Error checking models:', checkError);
            return;
        }
        
        if (existingModels.length > 0) {
            console.log(`✅ Found ${existingModels.length} existing models:`);
            existingModels.forEach(model => console.log(`   - ${model.model_name}`));
            console.log('\n🎯 Models already exist! No action needed.');
            return;
        }
        
        console.log('✅ No existing models found. Creating core models...');
        
        // Create the 2 documented core models
        console.log('\n3. 📝 Creating core models...');
        
        const coreModels = [
            {
                model_name: 'Attendance Forecast',
                description: 'Predicts event attendance based on historical data, engagement metrics, and external factors',
                model_version: '1.0.0',
                status: 'active',
                metadata: {
                    category: 'Event Management',
                    useCase: 'Event planning, capacity management, resource allocation',
                    inputFeatures: ['historical_attendance', 'event_type', 'marketing_spend', 'seasonality'],
                    outputType: 'regression',
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
                    useCase: 'Sales prioritization, lead qualification, conversion optimization',
                    inputFeatures: ['engagement_score', 'demographics', 'behavior_patterns', 'source'],
                    outputType: 'classification',
                    accuracy: 0.88
                }
            }
        ];
        
        // Try to insert models one by one to see which one works
        for (const model of coreModels) {
            console.log(`   Creating: ${model.model_name}...`);
            
            const { data: insertedModel, error: insertError } = await supabase
                .from('models')
                .insert(model)
                .select()
                .single();
                
            if (insertError) {
                console.error(`   ❌ Error creating ${model.model_name}:`, insertError.message);
            } else {
                console.log(`   ✅ Successfully created: ${insertedModel.model_name}`);
            }
        }
        
        // Verify final state
        console.log('\n4. ✅ Verifying final state...');
        const { data: finalModels, error: finalError } = await supabase
            .from('models')
            .select('model_name, metadata')
            .order('created_at', { ascending: true });
            
        if (finalError) {
            console.error('❌ Error verifying final state:', finalError);
            return;
        }
        
        console.log(`✅ Final state: ${finalModels.length} models in database`);
        finalModels.forEach((model, index) => {
            console.log(`   ${index + 1}. ${model.model_name} (${model.metadata.category})`);
        });
        
        console.log('\n🎯 Summary:');
        console.log('===========');
        if (finalModels.length === 2) {
            console.log('✅ Both core models created successfully!');
            console.log('✅ Models page should now display the 2 documented models.');
        } else if (finalModels.length === 1) {
            console.log('⚠️  Only 1 model created. Check RLS policies.');
        } else {
            console.log('❌ No models created. RLS policy is blocking insertion.');
            console.log('💡 Consider creating a database function to bypass RLS.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createModelsSimple();
