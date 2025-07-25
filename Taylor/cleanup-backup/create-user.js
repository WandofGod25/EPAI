#!/usr/bin/env node

/**
 * EPAI User Creation Script
 * 
 * This script creates a new user in the Supabase auth system.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Supabase configuration - use values from supabase status
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// New user information
const newUserEmail = 'ange_andre25@yahoo.com';
const newUserPassword = 'Taylortest';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUser() {
  try {
    console.log(`Creating user: ${newUserEmail}`);
    console.log(`Using Supabase URL: ${supabaseUrl}`);
    
    // Check if user already exists in the auth system
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error checking auth users:', authError.message);
      return;
    }
    
    const existingUser = authUser?.users?.find(user => user.email === newUserEmail);
    if (existingUser) {
      console.log(`User ${newUserEmail} already exists in auth system`);
      console.log('User ID:', existingUser.id);
      return;
    }
    
    // Create the user in auth system
    const { data, error } = await supabase.auth.admin.createUser({
      email: newUserEmail,
      password: newUserPassword,
      email_confirm: true
    });
    
    if (error) {
      console.error('Error creating user:', error.message);
      return;
    }
    
    console.log('User created successfully in auth system:', data.user.id);
    
    // The partner record should be created automatically through a trigger
    // Wait a moment for the trigger to execute
    console.log('Waiting for partner record creation...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify partner record was created
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('email', newUserEmail);
    
    if (partnerError) {
      console.error('Error checking partner record:', partnerError.message);
      return;
    }
    
    if (partnerData && partnerData.length > 0) {
      console.log('Partner record created successfully:', partnerData[0].id);
    } else {
      console.warn('Partner record not created automatically. Creating manually...');
      
      // Create partner record manually
      const { data: newPartner, error: createError } = await supabase
        .from('partners')
        .insert([
          { 
            email: newUserEmail,
            name: 'Andre Test User',
            user_id: data.user.id,
            active: true
          }
        ]);
      
      if (createError) {
        console.error('Error creating partner record:', createError.message);
      } else {
        console.log('Partner record created manually');
      }
    }
    
    console.log('\nUser setup complete. You can now log in with:');
    console.log(`Email: ${newUserEmail}`);
    console.log(`Password: ${newUserPassword}`);
    
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

createUser(); 