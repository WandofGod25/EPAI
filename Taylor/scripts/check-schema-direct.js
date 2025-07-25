#!/usr/bin/env node

/**
 * EPAI Database Schema Checker (Direct SQL)
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
 * Execute a SQL query
 */
async function executeQuery(query) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_string: `
        WITH query_result AS (${query})
        SELECT jsonb_agg(query_result) FROM query_result;
      `
    });
    
    if (error) {
      console.error('Error executing query:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error executing query:', error);
    return null;
  }
}

/**
 * List all tables in the database
 */
async function listAllTables() {
  console.log('\nListing all tables in the database:');
  
  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  
  const result = await executeQuery(query);
  
  if (!result || result.length === 0) {
    console.log('No tables found');
    return [];
  }
  
  const tables = result.map(row => row.table_name);
  
  console.log(`Found ${tables.length} tables:`);
  tables.forEach(tableName => {
    console.log(`- ${tableName}`);
  });
  
  return tables;
}

/**
 * Check table structure
 */
async function checkTableStructure(tableName) {
  console.log(`\nChecking structure of table: ${tableName}`);
  
  const query = `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = '${tableName}'
  `;
  
  const result = await executeQuery(query);
  
  if (!result || result.length === 0) {
    console.log(`Table ${tableName} not found or has no columns`);
    return;
  }
  
  console.log(`Table ${tableName} has the following columns:`);
  result.forEach(column => {
    console.log(`- ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
  });
}

/**
 * Main function
 */
async function main() {
  console.log('EPAI Database Schema Checker (Direct SQL)');
  console.log('=======================================');
  
  try {
    // List all tables
    const tables = await listAllTables();
    
    // Check key tables if they exist
    const keyTables = ['partners', 'api_keys', 'models', 'ingestion_events', 'insights', 'security_events'];
    for (const table of keyTables) {
      if (tables.includes(table)) {
        await checkTableStructure(table);
      } else {
        console.log(`\nTable ${table} does not exist`);
      }
    }
    
    console.log('\nSchema check complete!');
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 