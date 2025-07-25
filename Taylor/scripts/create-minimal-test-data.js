#!/usr/bin/env node

/**
 * EPAI Minimal Test Data Creator
 * 
 * This script creates minimal test data for security testing.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup paths and environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from test.env
dotenv.config({ path: path.join(__dirname, 'test.env') });

// Constants
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test data IDs
const PARTNER_ID = '00000000-0000-4000-a000-000000000001';
const SEC_EVENT_ID_1 = '00000000-0000-4000-a000-000000000010';
const SEC_EVENT_ID_2 = '00000000-0000-4000-a000-000000000011';
const SEC_EVENT_ID_3 = '00000000-0000-4000-a000-000000000012';

/**
 * Create minimal test data
 */
async function createMinimalTestData() {
  console.log('Creating minimal test data...');
  
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
            key_id: 'test-key-id',
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
      console.error('Error creating test security events:', secEventsError);
      return;
    }
    
    console.log('Test security events created successfully');
    
    // Save the test configuration
    console.log('\nMinimal test data creation complete!');
    console.log(`Partner ID: ${PARTNER_ID}`);
  } catch (error) {
    console.error('Error creating minimal test data:', error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('EPAI Minimal Test Data Creator');
  console.log('============================');
  
  try {
    // Create minimal test data
    await createMinimalTestData();
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 