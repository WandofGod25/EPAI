#!/usr/bin/env node

/**
 * EPAI Test Data SQL Runner
 * 
 * This script runs the SQL script to create test data.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup paths and environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from test.env
dotenv.config({ path: path.join(__dirname, 'test.env') });

// Constants
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SQL_FILE_PATH = path.join(__dirname, 'create-test-data.sql');

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Run SQL script
 */
async function runSqlScript() {
  console.log('Running SQL script to create test data...');
  
  try {
    // Read SQL file
    const sqlContent = fs.readFileSync(SQL_FILE_PATH, 'utf8');
    
    // Split SQL into statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_string: stmt });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('SQL script execution complete!');
  } catch (error) {
    console.error('Error running SQL script:', error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('EPAI Test Data SQL Runner');
  console.log('========================');
  
  try {
    // Run SQL script
    await runSqlScript();
    
    console.log('\nTest data creation complete!');
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 