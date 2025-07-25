#!/usr/bin/env node

/**
 * EPAI Security Events Creator
 * 
 * This script creates minimal security events for testing.
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
 * Create security events
 */
async function createSecurityEvents() {
  console.log('Creating security events...');
  
  try {
    // Create test security event with minimal fields
    console.log('Creating test security event...');
    const { data: secEvent, error: secEventError } = await supabase
      .from('security_events')
      .upsert({
        id: SEC_EVENT_ID_1,
        partner_id: PARTNER_ID,
        event_type: 'authentication_success'
      })
      .select();
    
    if (secEventError) {
      console.error('Error creating security event:', secEventError);
      return;
    }
    
    console.log('Security event created successfully');
    
    // Save the test configuration
    console.log('\nSecurity events creation complete!');
  } catch (error) {
    console.error('Error creating security events:', error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('EPAI Security Events Creator');
  console.log('==========================');
  
  try {
    // Create security events
    await createSecurityEvents();
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 