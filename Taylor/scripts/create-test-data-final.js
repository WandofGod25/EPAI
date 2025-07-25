#!/usr/bin/env node

/**
 * EPAI Test Data Creator (Final Version)
 * 
 * This script creates test data with the correct schema.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Setup paths and environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from test.env
dotenv.config({ path: path.join(__dirname, 'test.env') });

// Constants
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_API_KEY = process.env.TEST_API_KEY || 'epai_test_key_12345';

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test data IDs
const PARTNER_ID = '00000000-0000-4000-a000-000000000001';
const API_KEY_ID = '00000000-0000-4000-a000-000000000002';
const MODEL_ID_1 = '00000000-0000-4000-a000-000000000003';
const MODEL_ID_2 = '00000000-0000-4000-a000-000000000004';
const EVENT_ID_1 = '00000000-0000-4000-a000-000000000005';
const EVENT_ID_2 = '00000000-0000-4000-a000-000000000006';
const EVENT_ID_3 = '00000000-0000-4000-a000-000000000007';
const INSIGHT_ID_1 = '00000000-0000-4000-a000-000000000008';
const INSIGHT_ID_2 = '00000000-0000-4000-a000-000000000009';
const SEC_EVENT_ID_1 = '00000000-0000-4000-a000-000000000010';
const SEC_EVENT_ID_2 = '00000000-0000-4000-a000-000000000011';
const SEC_EVENT_ID_3 = '00000000-0000-4000-a000-000000000012';

/**
 * Generate a bcrypt hash for an API key
 */
async function hashApiKey(apiKey) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(apiKey, salt);
}

/**
 * Create test data
 */
async function createTestData() {
  console.log('Creating test data...');
  
  try {
    // Create test partner
    console.log('Creating test partner...');
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .upsert({
        id: PARTNER_ID,
        name: 'Security Test Partner'
      })
      .select();
    
    if (partnerError) {
      console.error('Error creating test partner:', partnerError);
      return;
    }
    
    console.log('Test partner created successfully');
    
    // Create test API key
    console.log('Creating test API key...');
    const keyHash = await hashApiKey(TEST_API_KEY);
    
    // First, try to get the structure of the api_keys table
    const { data: apiKeyColumns, error: columnsError } = await supabase
      .from('api_keys')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.log('Error getting api_keys structure, trying minimal insert...');
      
      // Try a minimal insert with just the required fields
      const { data: apiKey, error: apiKeyError } = await supabase
        .from('api_keys')
        .upsert({
          id: API_KEY_ID,
          partner_id: PARTNER_ID,
          api_key: TEST_API_KEY,
          api_key_hash: keyHash
        })
        .select();
        
      if (apiKeyError) {
        console.error('Error creating test API key with minimal fields:', apiKeyError);
        return;
      }
    } else {
      // Use the full structure if available
      const { data: apiKey, error: apiKeyError } = await supabase
        .from('api_keys')
        .upsert({
          id: API_KEY_ID,
          partner_id: PARTNER_ID,
          api_key: TEST_API_KEY,
          api_key_hash: keyHash,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true
        })
        .select();
        
      if (apiKeyError) {
        console.error('Error creating test API key with full fields:', apiKeyError);
        return;
      }
    }
    
    console.log('Test API key created successfully');
    
    // Create test models
    console.log('Creating test models...');
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .upsert([
        {
          id: MODEL_ID_1,
          partner_id: PARTNER_ID,
          name: 'Attendance Prediction Model',
          description: 'Predicts event attendance',
          type: 'regression'
        },
        {
          id: MODEL_ID_2,
          partner_id: PARTNER_ID,
          name: 'Lead Scoring Model',
          description: 'Scores leads based on engagement',
          type: 'classification'
        }
      ])
      .select();
    
    if (modelsError) {
      console.error('Error creating test models:', modelsError);
      return;
    }
    
    console.log('Test models created successfully');
    
    // Create test ingestion events
    console.log('Creating test ingestion events...');
    const { data: events, error: eventsError } = await supabase
      .from('ingestion_events')
      .upsert([
        {
          id: EVENT_ID_1,
          partner_id: PARTNER_ID,
          event_type: 'event_registration',
          data: {
            event_id: 'evt-001',
            user_id: 'usr-001',
            event_name: 'Annual Conference',
            ticket_type: 'VIP'
          }
        },
        {
          id: EVENT_ID_2,
          partner_id: PARTNER_ID,
          event_type: 'user_engagement',
          data: {
            user_id: 'usr-002',
            action: 'page_view',
            content_id: 'page-001',
            duration: 120
          }
        },
        {
          id: EVENT_ID_3,
          partner_id: PARTNER_ID,
          event_type: 'lead_capture',
          data: {
            lead_id: 'lead-001',
            source: 'website_form',
            campaign: 'summer_promo',
            fields_completed: ['name', 'email', 'company']
          }
        }
      ])
      .select();
    
    if (eventsError) {
      console.error('Error creating test ingestion events:', eventsError);
      return;
    }
    
    console.log('Test ingestion events created successfully');
    
    // Create test insights
    console.log('Creating test insights...');
    const { data: insights, error: insightsError } = await supabase
      .from('insights')
      .upsert([
        {
          id: INSIGHT_ID_1,
          partner_id: PARTNER_ID,
          ingestion_event_id: EVENT_ID_1,
          insight_type: 'attendance_prediction',
          title: 'Attendance Prediction',
          content: 'Based on historical data, we predict 85% attendance for this event.',
          confidence: 0.92
        },
        {
          id: INSIGHT_ID_2,
          partner_id: PARTNER_ID,
          ingestion_event_id: EVENT_ID_3,
          insight_type: 'lead_scoring',
          title: 'Lead Score',
          content: 'This lead has a 78% likelihood of conversion.',
          confidence: 0.87
        }
      ])
      .select();
    
    if (insightsError) {
      console.error('Error creating test insights:', insightsError);
      return;
    }
    
    console.log('Test insights created successfully');
    
    // Create test security events
    console.log('Creating test security events...');
    const { data: secEvents, error: secEventsError } = await supabase
      .from('security_events')
      .upsert([
        {
          id: SEC_EVENT_ID_1,
          partner_id: PARTNER_ID,
          event_type: 'authentication_success',
          details: {
            user_email: 'security-test@example.com',
            ip_address: '192.168.1.1'
          },
          severity: 'info',
          source: 'auth_system'
        },
        {
          id: SEC_EVENT_ID_2,
          partner_id: PARTNER_ID,
          event_type: 'api_key_validation',
          details: {
            key_id: API_KEY_ID,
            ip_address: '192.168.1.2',
            endpoint: '/api/data'
          },
          severity: 'info',
          source: 'api_gateway'
        },
        {
          id: SEC_EVENT_ID_3,
          partner_id: PARTNER_ID,
          event_type: 'rate_limit_warning',
          details: {
            key_id: API_KEY_ID,
            ip_address: '192.168.1.3',
            endpoint: '/api/ingest',
            request_count: 95,
            limit: 100
          },
          severity: 'warning',
          source: 'rate_limiter'
        }
      ])
      .select();
    
    if (secEventsError) {
      console.error('Error creating test security events:', secEventsError);
      return;
    }
    
    console.log('Test security events created successfully');
    
    // Save the test configuration
    console.log('\nTest data creation complete!');
    console.log(`Partner ID: ${PARTNER_ID}`);
    console.log(`API Key: ${TEST_API_KEY}`);
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('EPAI Test Data Creator (Final Version)');
  console.log('====================================');
  
  try {
    // Create test data
    await createTestData();
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 