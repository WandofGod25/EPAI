#!/usr/bin/env node

/**
 * Test Minimal Insert Script
 * 
 * This script tries minimal inserts to understand the actual table schema
 * in production.
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

async function testMinimalInsert() {
    try {
        console.log('🔍 Testing minimal inserts to understand schema...');
        
        // Test models table with minimal data
        console.log('\n1. Testing models table with minimal data...');
        try {
            const { data: modelData, error: modelError } = await supabase
                .from('models')
                .insert([
                    { id: generateUUID() }
                ])
                .select();
            
            if (modelError) {
                console.error('❌ Models insert error:', modelError);
            } else {
                console.log('✅ Models insert successful:', modelData);
                console.log('   Model columns:', Object.keys(modelData[0]));
            }
        } catch (err) {
            console.error('❌ Error testing models:', err.message);
        }
        
        // Test insights table with minimal data
        console.log('\n2. Testing insights table with minimal data...');
        try {
            const { data: partners } = await supabase
                .from('partners')
                .select('id')
                .limit(1);
            
            if (partners && partners.length > 0) {
                const { data: insightData, error: insightError } = await supabase
                    .from('insights')
                    .insert([
                        { 
                            partner_id: partners[0].id,
                            model_id: generateUUID()
                        }
                    ])
                    .select();
                
                if (insightError) {
                    console.error('❌ Insights insert error:', insightError);
                } else {
                    console.log('✅ Insights insert successful:', insightData);
                    console.log('   Insight columns:', Object.keys(insightData[0]));
                }
            } else {
                console.log('⚠️  No partners found, skipping insights test');
            }
        } catch (err) {
            console.error('❌ Error testing insights:', err.message);
        }
        
        console.log('\n🎉 Minimal insert test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testMinimalInsert(); 