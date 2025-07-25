#!/usr/bin/env node

/**
 * EPAI Run SQL File
 * 
 * This script runs a SQL file against the database.
 * 
 * Usage:
 * node scripts/run-sql-file.js <sql-file>
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

// Function to run a SQL file
async function runSqlFile(filePath) {
  log(`Running SQL file: ${filePath}`, 'step');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the SQL statements using the REST API
    const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.supabaseKey}`,
        'apikey': CONFIG.supabaseKey,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to execute SQL: ${errorText}`);
    }
    
    const result = await response.json();
    log('SQL executed successfully', 'success');
    return result;
  } catch (error) {
    log(`Failed to execute SQL: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
}

// Main function
async function main() {
  log('EPAI Run SQL File', 'info');
  log('=================', 'info');
  
  try {
    // Get the SQL file path from the command line arguments
    const sqlFilePath = process.argv[2];
    
    if (!sqlFilePath) {
      throw new Error('SQL file path is required');
    }
    
    // Resolve the SQL file path
    const resolvedPath = path.resolve(process.cwd(), sqlFilePath);
    
    // Check if the file exists
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`SQL file not found: ${resolvedPath}`);
    }
    
    // Run the SQL file
    await runSqlFile(resolvedPath);
    log('SQL file executed successfully!', 'success');
  } catch (error) {
    log(`Failed to run SQL file: ${error instanceof Error ? error.message : String(error)}`, 'error');
    process.exit(1);
  }
}

// Run the main function
main(); 