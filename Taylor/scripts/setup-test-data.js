#!/usr/bin/env node

/**
 * EPAI Test Data Setup Script
 * 
 * This script sets up test data for security testing, including:
 * - Creating a test partner
 * - Creating API keys
 * - Adding sample ingestion events
 * - Adding sample insights
 * 
 * Usage: node scripts/setup-test-data.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Setup paths and environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from test.env
dotenv.config({ path: path.join(__dirname, 'test.env') });

// Constants
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL || 'security-test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'SecureTestPassword123!';
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
 * Create a test partner
 */
async function createTestPartner() {
  console.log('Creating test partner...');
  
  // Check if the test partner already exists
  const { data: existingPartners, error: checkError } = await supabase
    .from('partners')
    .select('id, name');
  
  if (checkError) {
    console.error('Error checking for existing partners:', checkError);
    return null;
  }
  
  // For testing purposes, just use the first partner
  if (existingPartners && existingPartners.length > 0) {
    console.log(`Using existing partner: ${existingPartners[0].name} (${existingPartners[0].id})`);
    return existingPartners[0];
  }
  
  // Create a new partner
  const { data: newPartner, error: createError } = await supabase
    .from('partners')
    .insert({
      name: 'Security Test Partner',
      status: 'active',
      metadata: { test: true }
    })
    .select();
  
  if (createError) {
    console.error('Error creating test partner:', createError);
    return null;
  }
  
  console.log(`Created test partner: ${newPartner[0].name} (${newPartner[0].id})`);
  return newPartner[0];
}

/**
 * Create a test API key for the partner
 */
async function createTestApiKey(partnerId) {
  console.log('Creating test API key...');
  
  // Check if the test API key already exists
  const { data: existingKeys, error: checkError } = await supabase
    .from('api_keys')
    .select('id')
    .eq('partner_id', partnerId);
  
  if (checkError) {
    console.error('Error checking for existing API key:', checkError);
    return null;
  }
  
  if (existingKeys && existingKeys.length > 0) {
    console.log(`Test API key already exists (ID: ${existingKeys[0].id})`);
    return existingKeys[0];
  }
  
  // Hash the API key
  const keyHash = await hashApiKey(TEST_API_KEY);
  
  // Create a new API key
  const { data: newKey, error: createError } = await supabase
    .from('api_keys')
    .insert({
      partner_id: partnerId,
      api_key_hash: keyHash,
      name: 'Test API Key',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      is_active: true
    })
    .select();
  
  if (createError) {
    console.error('Error creating test API key:', createError);
    return null;
  }
  
  console.log(`Created test API key (ID: ${newKey[0].id})`);
  return newKey[0];
}

/**
 * Create sample models for the partner
 */
async function createSampleModels(partnerId) {
  console.log('Creating sample models...');
  
  // Check if models already exist for this partner
  const { data: existingModels, error: checkError } = await supabase
    .from('models')
    .select('id, name')
    .eq('partner_id', partnerId);
  
  if (checkError) {
    console.error('Error checking for existing models:', checkError);
    return;
  }
  
  if (existingModels && existingModels.length > 0) {
    console.log(`Partner already has ${existingModels.length} models`);
    return existingModels;
  }
  
  // Sample models to create
  const sampleModels = [
    {
      partner_id: partnerId,
      name: 'Attendance Prediction Model',
      description: 'Predicts event attendance based on historical data',
      type: 'regression',
      status: 'active',
      metadata: {
        accuracy: 0.92,
        features: ['past_attendance', 'event_category', 'day_of_week', 'time_of_day']
      }
    },
    {
      partner_id: partnerId,
      name: 'Lead Scoring Model',
      description: 'Scores leads based on engagement and demographic data',
      type: 'classification',
      status: 'active',
      metadata: {
        accuracy: 0.87,
        features: ['engagement_score', 'company_size', 'industry', 'source']
      }
    }
  ];
  
  // Create the models
  const { data: newModels, error: createError } = await supabase
    .from('models')
    .insert(sampleModels)
    .select();
  
  if (createError) {
    console.error('Error creating sample models:', createError);
    return;
  }
  
  console.log(`Created ${newModels.length} sample models`);
  return newModels;
}

/**
 * Create sample ingestion events for the partner
 */
async function createSampleEvents(partnerId) {
  console.log('Creating sample ingestion events...');
  
  // Check if events already exist for this partner
  const { data: existingEvents, error: checkError } = await supabase
    .from('ingestion_events')
    .select('id, event_type')
    .eq('partner_id', partnerId);
  
  if (checkError) {
    console.error('Error checking for existing events:', checkError);
    return;
  }
  
  if (existingEvents && existingEvents.length > 0) {
    console.log(`Partner already has ${existingEvents.length} ingestion events`);
    return existingEvents;
  }
  
  // Sample events to create
  const sampleEvents = [
    {
      partner_id: partnerId,
      event_type: 'event_registration',
      data: {
        event_id: 'evt-001',
        user_id: 'usr-001',
        event_name: 'Annual Conference',
        registration_time: new Date().toISOString(),
        ticket_type: 'VIP'
      }
    },
    {
      partner_id: partnerId,
      event_type: 'user_engagement',
      data: {
        user_id: 'usr-002',
        action: 'page_view',
        content_id: 'page-001',
        duration: 120,
        timestamp: new Date().toISOString()
      }
    },
    {
      partner_id: partnerId,
      event_type: 'lead_capture',
      data: {
        lead_id: 'lead-001',
        source: 'website_form',
        campaign: 'summer_promo',
        fields_completed: ['name', 'email', 'company'],
        timestamp: new Date().toISOString()
      }
    }
  ];
  
  // Create the events
  const { data: newEvents, error: createError } = await supabase
    .from('ingestion_events')
    .insert(sampleEvents)
    .select();
  
  if (createError) {
    console.error('Error creating sample events:', createError);
    return;
  }
  
  console.log(`Created ${newEvents.length} sample ingestion events`);
  return newEvents;
}

/**
 * Create sample insights for the partner
 */
async function createSampleInsights(partnerId, eventIds) {
  console.log('Creating sample insights...');
  
  if (!eventIds || eventIds.length === 0) {
    console.log('No event IDs provided, skipping insight creation');
    return;
  }
  
  // Check if insights already exist for this partner
  const { data: existingInsights, error: checkError } = await supabase
    .from('insights')
    .select('id, insight_type')
    .eq('partner_id', partnerId);
  
  if (checkError) {
    console.error('Error checking for existing insights:', checkError);
    return;
  }
  
  if (existingInsights && existingInsights.length > 0) {
    console.log(`Partner already has ${existingInsights.length} insights`);
    return existingInsights;
  }
  
  // Sample insights to create
  const sampleInsights = [
    {
      partner_id: partnerId,
      ingestion_event_id: eventIds[0].id,
      insight_type: 'attendance_prediction',
      title: 'Attendance Prediction',
      content: 'Based on historical data, we predict 85% attendance for this event.',
      confidence: 0.92,
      metadata: {
        factors: ['past_attendance', 'event_category', 'day_of_week'],
        model_version: '1.2.0'
      }
    },
    {
      partner_id: partnerId,
      ingestion_event_id: eventIds[2].id,
      insight_type: 'lead_scoring',
      title: 'Lead Score',
      content: 'This lead has a 78% likelihood of conversion.',
      confidence: 0.87,
      metadata: {
        factors: ['engagement_level', 'company_size', 'industry'],
        model_version: '2.1.0'
      }
    }
  ];
  
  // Create the insights
  const { data: newInsights, error: createError } = await supabase
    .from('insights')
    .insert(sampleInsights)
    .select();
  
  if (createError) {
    console.error('Error creating sample insights:', createError);
    return;
  }
  
  console.log(`Created ${newInsights.length} sample insights`);
  return newInsights;
}

/**
 * Create security events for testing
 */
async function createSecurityEvents(partnerId) {
  console.log('Creating sample security events...');
  
  // Check if security events already exist
  const { data: existingEvents, error: checkError } = await supabase
    .from('security_events')
    .select('id, event_type')
    .eq('partner_id', partnerId);
  
  if (checkError) {
    console.error('Error checking for existing security events:', checkError);
    return;
  }
  
  if (existingEvents && existingEvents.length > 0) {
    console.log(`Already have ${existingEvents.length} security events`);
    return existingEvents;
  }
  
  // Sample security events to create
  const sampleEvents = [
    {
      partner_id: partnerId,
      event_type: 'authentication_success',
      details: {
        user_email: TEST_EMAIL,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      severity: 'info',
      source: 'auth_system'
    },
    {
      partner_id: partnerId,
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
      partner_id: partnerId,
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
  ];
  
  // Create the security events
  const { data: newEvents, error: createError } = await supabase
    .from('security_events')
    .insert(sampleEvents)
    .select();
  
  if (createError) {
    console.error('Error creating sample security events:', createError);
    return;
  }
  
  console.log(`Created ${newEvents.length} sample security events`);
  return newEvents;
}

/**
 * Main function
 */
async function main() {
  console.log('EPAI Test Data Setup Script');
  console.log('==========================');
  
  try {
    // Create test partner
    const partner = await createTestPartner();
    if (!partner) {
      console.error('Failed to create test partner, exiting');
      process.exit(1);
    }
    
    // Create test API key
    const apiKey = await createTestApiKey(partner.id);
    if (!apiKey) {
      console.error('Failed to create test API key, exiting');
      process.exit(1);
    }
    
    // Create sample models
    await createSampleModels(partner.id);
    
    // Create sample ingestion events
    const events = await createSampleEvents(partner.id);
    
    // Create sample insights
    await createSampleInsights(partner.id, events);
    
    // Create sample security events
    await createSecurityEvents(partner.id);
    
    console.log('\nTest data setup complete!');
    console.log(`Partner ID: ${partner.id}`);
    console.log(`API Key: ${TEST_API_KEY}`);
    
    // Save the partner ID to a file for reference
    const testConfigPath = path.join(__dirname, 'test-config.json');
    fs.writeFileSync(testConfigPath, JSON.stringify({
      partnerId: partner.id,
      apiKey: TEST_API_KEY,
      email: TEST_EMAIL
    }, null, 2));
    
    console.log(`Test configuration saved to ${testConfigPath}`);
  } catch (error) {
    console.error('Error setting up test data:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 