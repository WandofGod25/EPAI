#!/usr/bin/env node

/**
 * EPAI Helper Functions Setup Script
 * 
 * This script creates helper functions in the database that are used by other scripts.
 * 
 * Usage:
 * node scripts/create-helper-functions.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'test.env') });

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Check required environment variables
if (!CONFIG.supabaseKey) {
  console.error(chalk.red('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required'));
  console.error(chalk.yellow('Please run:'));
  console.error(chalk.yellow('  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key'));
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// Helper function for logging
function log(message, type = 'info') {
  const prefix = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    error: chalk.red('✗'),
    warning: chalk.yellow('⚠'),
    step: chalk.cyan('➤'),
  };
  
  console.log(`${prefix[type]} ${message}`);
}

// Function to create helper functions
async function createHelperFunctions() {
  log('Creating helper functions...', 'step');
  
  try {
    // Create exec_sql function
    const { error: execSqlError } = await supabase
      .from('_exec_sql')
      .select('*')
      .limit(1)
      .then(async () => {
        // If the query succeeds, the function already exists
        log('exec_sql function already exists', 'info');
        return { error: null };
      })
      .catch(async () => {
        // If the query fails, create the function
        log('Creating exec_sql function...', 'info');
        
        const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
          .catch(async () => {
            // If the rpc call fails, create the function using raw SQL
            const { error } = await supabase.functions.invoke('exec-sql', {
              body: {
                sql: `
                  CREATE OR REPLACE FUNCTION exec_sql(sql text)
                  RETURNS json
                  LANGUAGE plpgsql
                  SECURITY DEFINER
                  AS $$
                  DECLARE
                    result json;
                  BEGIN
                    EXECUTE sql;
                    result := json_build_object('success', true);
                    RETURN result;
                  EXCEPTION WHEN OTHERS THEN
                    result := json_build_object('success', false, 'error', SQLERRM);
                    RETURN result;
                  END;
                  $$;
                  
                  -- Grant execute permission to authenticated users
                  GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
                  GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
                `
              }
            });
            
            return { error };
          });
        
        return { error };
      });
    
    if (execSqlError) {
      throw new Error(`Failed to create exec_sql function: ${execSqlError.message}`);
    }
    
    log('Helper functions created successfully', 'success');
  } catch (error) {
    log(`Failed to create helper functions: ${error.message}`, 'error');
    throw error;
  }
}

// Main function
async function main() {
  log('EPAI Helper Functions Setup', 'info');
  log('=========================', 'info');
  
  try {
    await createHelperFunctions();
    log('Setup completed successfully!', 'success');
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the main function
main(); 