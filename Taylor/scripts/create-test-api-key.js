#!/usr/bin/env node

/**
 * EPAI Test API Key Generator
 * 
 * This script generates a test API key and inserts it into the database.
 * It's specifically designed to support security testing.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup paths and environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'test.env') });

// Constants
const API_BASE_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQyMTY4OSwiZXhwIjoyMDY0OTk3Njg5fQ.0D4A99QwPrmU_ecC5KkAQl4isJ3vspSWkYjPYvnEYaU';
const TEST_PARTNER_ID = '00000000-0000-0000-0000-000000000001'; // Test partner ID

/**
 * Generate a hash for an API key using bcrypt
 */
async function hashApiKey(apiKey) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(apiKey, salt);
}

/**
 * Create a test API key in the database
 */
export async function createTestApiKey() {
  try {
    console.log('Creating test API key...');
    
    // Generate a new test API key
    const testApiKey = 'epai_test_key_' + Math.random().toString(36).substring(2, 10);
    
    // Create a Supabase client with the service role key
    const supabase = createClient(API_BASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if the partner exists
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('id', TEST_PARTNER_ID)
      .limit(1);
    
    // If partner doesn't exist, create it
    if (!partnerData || partnerData.length === 0) {
      console.log(`Partner with ID ${TEST_PARTNER_ID} not found, creating...`);
      
      const { error: createPartnerError } = await supabase
        .from('partners')
        .insert([
          {
            id: TEST_PARTNER_ID,
            company_name: 'Test Security Partner',
            created_at: new Date().toISOString()
          }
        ]);
      
      if (createPartnerError) {
        throw new Error(`Failed to create partner: ${createPartnerError.message}`);
      }
      
      console.log(`Created partner with ID ${TEST_PARTNER_ID}`);
    }
    
    // Hash the API key
    const apiKeyHash = await hashApiKey(testApiKey);
    
    // Check if an API key already exists for this partner
    const { data: existingKey, error: existingKeyError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('partner_id', TEST_PARTNER_ID)
      .limit(1);
    
    if (existingKey && existingKey.length > 0) {
      // Update the existing API key
      console.log(`API key already exists for partner ${TEST_PARTNER_ID}, updating...`);
      
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ 
          api_key_hash: apiKeyHash,
          updated_at: new Date().toISOString()
        })
        .eq('partner_id', TEST_PARTNER_ID);
      
      if (updateError) {
        throw new Error(`Failed to update API key: ${updateError.message}`);
      }
      
      console.log(`Updated API key for partner ${TEST_PARTNER_ID}`);
    } else {
      // Create a new API key
      const { error: insertError } = await supabase
        .from('api_keys')
        .insert([
          { 
            partner_id: TEST_PARTNER_ID,
            api_key_hash: apiKeyHash,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      
      if (insertError) {
        throw new Error(`Failed to create API key: ${insertError.message}`);
      }
      
      console.log(`Created new API key for partner ${TEST_PARTNER_ID}`);
    }
    
    // Save the API key to test.env
    const envPath = path.join(__dirname, 'test.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace existing TEST_API_KEY or add it
      if (envContent.includes('TEST_API_KEY=')) {
        envContent = envContent.replace(/TEST_API_KEY=.*(\r?\n|$)/g, `TEST_API_KEY=${testApiKey}$1`);
      } else {
        envContent += `\nTEST_API_KEY=${testApiKey}\n`;
      }
    } else {
      envContent = `TEST_API_KEY=${testApiKey}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    console.log(`Test API key created successfully: ${testApiKey}`);
    console.log(`API key saved to ${envPath}`);
    
    return testApiKey;
  } catch (error) {
    console.error('Error creating test API key:', error);
    return null;
  }
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestApiKey();
} 