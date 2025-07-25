#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const PRODUCTION_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PRODUCTION_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PRODUCTION_URL, PRODUCTION_ANON_KEY);

async function analyzeCurrentModels() {
    try {
        console.log('🔍 EPAI Models Analysis');
        console.log('======================\n');
        
        // 1. Get current models from database
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
        
        console.log(`   Found ${models.length} models in database:`);
        models.forEach((model, index) => {
            console.log(`   ${index + 1}. ${model.model_name}`);
            console.log(`      - ID: ${model.id}`);
            console.log(`      - Description: ${model.description}`);
            console.log(`      - Version: ${model.model_version}`);
            console.log(`      - Status: ${model.status}`);
            console.log(`      - Created: ${new Date(model.created_at).toLocaleDateString()}`);
            console.log('');
        });
        
        // 2. Analyze planned models from vision
        console.log('2. 🎯 Planned Models from Original Vision');
        console.log('==========================================');
        
        const plannedModels = {
            'Attendance Forecast': { category: 'Event Management', description: 'Predicts event attendance' },
            'Lead Scoring': { category: 'CRM Systems', description: 'Scores leads based on engagement' },
            'Churn Prediction': { category: 'CRM Systems', description: 'Predicts customer churn risk' },
            'Product Recommendation': { category: 'E-commerce', description: 'Recommends products' },
            'Campaign Performance Prediction': { category: 'Marketing', description: 'Forecasts campaign performance' },
            'Anomaly Detection': { category: 'Advanced Analytics', description: 'Detects unusual patterns' }
        };
        
        console.log(`   Planned: ${Object.keys(plannedModels).length} core models across 5 categories`);
        
        // 3. Gap Analysis
        console.log('\n3. 🔍 Gap Analysis');
        console.log('==================');
        
        const currentModelNames = models.map(m => m.model_name);
        const plannedModelNames = Object.keys(plannedModels);
        
        const implemented = plannedModelNames.filter(name => currentModelNames.includes(name));
        const missing = plannedModelNames.filter(name => !currentModelNames.includes(name));
        
        console.log(`   ✅ Implemented: ${implemented.length}/${plannedModelNames.length} (${Math.round(implemented.length/plannedModelNames.length*100)}%)`);
        implemented.forEach(name => console.log(`      - ${name}`));
        console.log('');
        
        console.log(`   ❌ Missing: ${missing.length} models`);
        missing.forEach(name => {
            const details = plannedModels[name];
            console.log(`      - ${name} (${details.category})`);
        });
        
    } catch (error) {
        console.error('❌ Analysis failed:', error);
    }
}

analyzeCurrentModels();
