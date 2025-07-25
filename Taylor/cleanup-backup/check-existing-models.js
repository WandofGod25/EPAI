#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const PRODUCTION_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PRODUCTION_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PRODUCTION_URL, PRODUCTION_ANON_KEY);

async function checkExistingModels() {
    try {
        console.log('🔍 Checking Existing Models in EPAI Database');
        console.log('============================================\n');
        
        // 1. Check what models exist in the database
        console.log('1. 📊 Current Models in Database');
        console.log('================================');
        
        const { data: models, error } = await supabase
            .from('models')
            .select('*')
            .order('created_at', { ascending: true });
            
        if (error) {
            console.error('❌ Error fetching models:', error);
            return;
        }
        
        if (models.length === 0) {
            console.log('   No models found in database.');
            console.log('   This suggests we need to create the basic models that were documented.');
        } else {
            console.log(`   Found ${models.length} models in database:`);
            models.forEach((model, index) => {
                console.log(`   ${index + 1}. ${model.model_name}`);
                console.log(`      - ID: ${model.id}`);
                console.log(`      - Description: ${model.description}`);
                console.log(`      - Version: ${model.model_version}`);
                console.log(`      - Status: ${model.status}`);
                console.log(`      - Created: ${new Date(model.created_at).toLocaleDateString()}`);
                if (model.metadata) {
                    console.log(`      - Category: ${model.metadata.category || 'Not specified'}`);
                }
                console.log('');
            });
        }
        
        // 2. Check what models were documented in the codebase
        console.log('2. 📚 Models Documented in Codebase');
        console.log('===================================');
        
        const documentedModels = [
            {
                name: 'Attendance Forecast',
                description: 'Predicts event attendance based on historical data',
                category: 'Event Management',
                source: 'FIX_SUMMARY.md and various scripts'
            },
            {
                name: 'Lead Scoring',
                description: 'Scores leads based on engagement and behavior',
                category: 'CRM Systems',
                source: 'FIX_SUMMARY.md and various scripts'
            }
        ];
        
        console.log(`   Found ${documentedModels.length} documented models:`);
        documentedModels.forEach((model, index) => {
            console.log(`   ${index + 1}. ${model.name}`);
            console.log(`      - Description: ${model.description}`);
            console.log(`      - Category: ${model.category}`);
            console.log(`      - Source: ${model.source}`);
            console.log('');
        });
        
        // 3. Analysis
        console.log('3. 🔍 Analysis');
        console.log('==============');
        
        if (models.length === 0) {
            console.log('   ❌ No models exist in database');
            console.log('   ✅ Models are documented in codebase');
            console.log('   📋 Action needed: Create the documented models');
        } else {
            const existingNames = models.map(m => m.model_name);
            const documentedNames = documentedModels.map(m => m.name);
            
            const implemented = documentedNames.filter(name => existingNames.includes(name));
            const missing = documentedNames.filter(name => !existingNames.includes(name));
            
            console.log(`   ✅ Implemented: ${implemented.length}/${documentedNames.length} (${Math.round(implemented.length/documentedNames.length*100)}%)`);
            implemented.forEach(name => console.log(`      - ${name}`));
            
            if (missing.length > 0) {
                console.log(`   ❌ Missing: ${missing.length} models`);
                missing.forEach(name => console.log(`      - ${name}`));
            }
        }
        
        console.log('\n🎯 Recommendation:');
        console.log('   Focus on creating the 2 documented models (Attendance Forecast, Lead Scoring)');
        console.log('   These are the core models that were planned and referenced throughout development.');
        console.log('   Additional models can be added later as the application evolves.');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkExistingModels();
