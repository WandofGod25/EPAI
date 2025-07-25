#!/usr/bin/env node

/**
 * EPAI Test Data Inserter
 * 
 * This script inserts test data directly using the Supabase client.
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

/**
 * Generate a bcrypt hash for an API key
 */
async function hashApiKey(apiKey) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(apiKey, salt);
}

/**
 * Insert test data
 */
async function insertTestData() {
  console.log('Inserting test data...');
  
  try {
    // Insert test partner
    console.log('Inserting test partner...');
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .insert({
        id: 'test-partner-id',
        name: 'Security Test Partner',
        status: 'active'
      })
      .select();
    
    if (partnerError) {
      console.error('Error inserting test partner:', partnerError);
      return;
    }
    
    console.log('Test partner inserted successfully');
    
    // Hash the API key
    const keyHash = await hashApiKey(TEST_API_KEY);
    
    // Insert test API key
    console.log('Inserting test API key...');
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('api_keys')
      .insert({
        id: 'test-key-id',
        partner_id: 'test-partner-id',
        api_key_hash: keyHash,
        name: 'Test API Key',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      })
      .select();
    
    if (apiKeyError) {
      console.error('Error inserting test API key:', apiKeyError);
      return;
    }
    
    console.log('Test API key inserted successfully');
    
    // Insert test models
    console.log('Inserting test models...');
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .insert([
        {
          id: 'test-model-1',
          partner_id: 'test-partner-id',
          name: 'Attendance Prediction Model',
          description: 'Predicts event attendance',
          type: 'regression',
          status: 'active'
        },
        {
          id: 'test-model-2',
          partner_id: 'test-partner-id',
          name: 'Lead Scoring Model',
          description: 'Scores leads based on engagement',
          type: 'classification',
          status: 'active'
        }
      ])
      .select();
    
    if (modelsError) {
      console.error('Error inserting test models:', modelsError);
      return;
    }
    
    console.log('Test models inserted successfully');
    
    // Insert test ingestion events
    console.log('Inserting test ingestion events...');
    const { data: events, error: eventsError } = await supabase
      .from('ingestion_events')
      .insert([
        {
          id: 'test-event-1',
          partner_id: 'test-partner-id',
          event_type: 'event_registration',
          data: {
            event_id: 'evt-001',
            user_id: 'usr-001',
            event_name: 'Annual Conference',
            ticket_type: 'VIP'
          }
        },
        {
          id: 'test-event-2',
          partner_id: 'test-partner-id',
          event_type: 'user_engagement',
          data: {
            user_id: 'usr-002',
            action: 'page_view',
            content_id: 'page-001',
            duration: 120
          }
        },
        {
          id: 'test-event-3',
          partner_id: 'test-partner-id',
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
      console.error('Error inserting test ingestion events:', eventsError);
      return;
    }
    
    console.log('Test ingestion events inserted successfully');
    
    // Insert test insights
    console.log('Inserting test insights...');
    const { data: insights, error: insightsError } = await supabase
      .from('insights')
      .insert([
        {
          id: 'test-insight-1',
          partner_id: 'test-partner-id',
          ingestion_event_id: 'test-event-1',
          insight_type: 'attendance_prediction',
          title: 'Attendance Prediction',
          content: 'Based on historical data, we predict 85% attendance for this event.',
          confidence: 0.92
        },
        {
          id: 'test-insight-2',
          partner_id: 'test-partner-id',
          ingestion_event_id: 'test-event-3',
          insight_type: 'lead_scoring',
          title: 'Lead Score',
          content: 'This lead has a 78% likelihood of conversion.',
          confidence: 0.87
        }
      ])
      .select();
    
    if (insightsError) {
      console.error('Error inserting test insights:', insightsError);
      return;
    }
    
    console.log('Test insights inserted successfully');
    
    // Insert test security events
    console.log('Inserting test security events...');
    const { data: secEvents, error: secEventsError } = await supabase
      .from('security_events')
      .insert([
        {
          id: 'test-sec-event-1',
          partner_id: 'test-partner-id',
          event_type: 'authentication_success',
          details: {
            user_email: 'security-test@example.com',
            ip_address: '192.168.1.1'
          },
          severity: 'info',
          source: 'auth_system'
        },
        {
          id: 'test-sec-event-2',
          partner_id: 'test-partner-id',
          event_type: 'api_key_validation',
          details: {
            key_id: 'test-key-id',
            ip_address: '192.168.1.2',
            endpoint: '/api/data'
          },
          severity: 'info',
          source: 'api_gateway'
        },
        {
          id: 'test-sec-event-3',
          partner_id: 'test-partner-id',
          event_type: 'rate_limit_warning',
          details: {
            key_id: 'test-key-id',
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
      console.error('Error inserting test security events:', secEventsError);
      return;
    }
    
    console.log('Test security events inserted successfully');
    
    // Save the test configuration
    console.log('\nTest data insertion complete!');
    console.log(`Partner ID: test-partner-id`);
    console.log(`API Key: ${TEST_API_KEY}`);
  } catch (error) {
    console.error('Error inserting test data:', error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('EPAI Test Data Inserter');
  console.log('======================');
  
  try {
    // Insert test data
    await insertTestData();
  } catch (error) {
    console.error('Error inserting test data:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 