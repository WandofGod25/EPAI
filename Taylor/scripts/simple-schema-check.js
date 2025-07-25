#!/usr/bin/env node

/**
 * EPAI Simple Database Schema Checker
 * 
 * This script checks the structure of key tables in the database using direct SQL queries.
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

/**
 * Check table structure
 */
async function checkTable(tableName) {
  console.log(`\nChecking table: ${tableName}`);
  
  try {
    // Try to select one row from the table
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Error querying table ${tableName}:`, error);
      return;
    }
    
    // Get the column names from the first row
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`Table ${tableName} has the following columns:`);
      columns.forEach(column => {
        console.log(`- ${column}`);
      });
    } else {
      console.log(`Table ${tableName} exists but has no rows`);
    }
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('EPAI Simple Database Schema Checker');
  console.log('=================================');
  
  try {
    // Check key tables
    await checkTable('partners');
    await checkTable('api_keys');
    await checkTable('models');
    await checkTable('ingestion_events');
    await checkTable('insights');
    await checkTable('security_events');
    
    console.log('\nSchema check complete!');
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 