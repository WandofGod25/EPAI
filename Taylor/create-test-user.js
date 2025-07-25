#!/usr/bin/env node

/**
 * EPAI Test User Creation Script
 * 
 * This script creates a test user directly in the Supabase auth system.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: './scripts/test.env' });

// Supabase configuration - use hardcoded values for local development
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// New user information
const newUserEmail = 'ange_andre25@yahoo.com';
const newUserPassword = 'Taylortest';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('EPAI Test User Creation');
    console.log('======================');
    console.log(`Creating user: ${newUserEmail}`);
    
    // First check if user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError.message);
      return;
    }
    
    const existingUser = users.find(user => user.email === newUserEmail);
    
    let userId;
    
    if (existingUser) {
      console.log(`User ${newUserEmail} already exists with ID: ${existingUser.id}`);
      userId = existingUser.id;
    } else {
      // Create the user
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true
      });
      
      if (error) {
        console.error('Error creating user:', error.message);
        return;
      }
      
      console.log(`User created successfully with ID: ${data.user.id}`);
      userId = data.user.id;
    }
    
    // Check if partner record exists
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', userId);
    
    if (partnerError) {
      console.error('Error checking partner record:', partnerError.message);
    } else if (partnerData && partnerData.length > 0) {
      console.log(`Partner record exists with ID: ${partnerData[0].id}`);
    } else {
      console.log('Creating partner record...');
      
      // Create partner record
      const { data: insertData, error: insertError } = await supabase
        .from('partners')
        .insert([
          {
            user_id: userId,
            name: 'Andre Test User'
          }
        ])
        .select();
      
      if (insertError) {
        console.error('Error creating partner record:', insertError.message);
      } else {
        console.log(`Partner record created with ID: ${insertData[0].id}`);
      }
    }
    
    // Get partner ID
    const { data: currentPartnerData, error: currentPartnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', userId);
      
    if (currentPartnerError || !currentPartnerData || currentPartnerData.length === 0) {
      console.error('Error getting partner ID:', currentPartnerError?.message || 'No partner found');
      return;
    }
    
    const partnerId = currentPartnerData[0].id;
    
    // Check if API key exists
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('partner_id', partnerId);
    
    if (keyError) {
      console.error('Error checking API key:', keyError.message);
    } else if (keyData && keyData.length > 0) {
      console.log(`API key exists with ID: ${keyData[0].id}`);
    } else {
      console.log('Creating API key...');
      
      const testApiKey = 'epai_test_api_key_for_simulation';
      
      // Create API key
      const { data: insertKeyData, error: insertKeyError } = await supabase
        .from('api_keys')
        .insert([
          {
            partner_id: partnerId,
            api_key: testApiKey,
            name: 'Test API Key',
            is_active: true
          }
        ])
        .select();
      
      if (insertKeyError) {
        console.error('Error creating API key:', insertKeyError.message);
      } else {
        console.log(`API key created with ID: ${insertKeyData[0].id}`);
      }
    }
    
    console.log('\nTest user setup complete!');
    console.log('You can now log in with:');
    console.log(`Email: ${newUserEmail}`);
    console.log(`Password: ${newUserPassword}`);
    
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

createTestUser(); 