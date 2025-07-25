#!/usr/bin/env node

/**
 * EPAI Database Schema Checker
 * 
 * This script checks the structure of key tables in the database.
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
const API_BASE_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQyMTY4OSwiZXhwIjoyMDY0OTk3Njg5fQ.0D4A99QwPrmU_ecC5KkAQl4isJ3vspSWkYjPYvnEYaU';

async function checkSchema() {
  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(API_BASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check api_keys table
    console.log('Checking schema of api_keys table...');
    await checkTableSchema(supabase, 'api_keys');
    
    // Check partners table
    console.log('\nChecking schema of partners table...');
    await checkTableSchema(supabase, 'partners');
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

async function checkTableSchema(supabase, tableName) {
  // Get the first row from the table to check the schema
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  
  if (error) {
    console.error(`Error fetching data from ${tableName}:`, error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log(`No data found in ${tableName} table.`);
    
    // Try to get the table definition
    try {
      // Use PostgreSQL introspection to get column information
      const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
        table_name: tableName
      });
      
      if (columnsError) {
        console.error('Error fetching table columns:', columnsError.message);
      } else {
        console.log('Table columns:');
        console.table(columns);
      }
    } catch (e) {
      console.error('Error fetching table definition:', e.message);
      
      // Try a direct SQL query as fallback
      const { data: definition, error: definitionError } = await supabase.rpc('execute_sql', {
        sql_query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}'`
      });
      
      if (definitionError) {
        console.error('Error with direct SQL query:', definitionError.message);
      } else {
        console.log('Table definition from SQL:');
        console.table(definition);
      }
    }
    
    return;
  }
  
  console.log(`Column names in ${tableName} table:`);
  console.log(Object.keys(data[0]));
  
  console.log(`\nSample data from ${tableName} (with sensitive info redacted):`);
  const redactedData = {...data[0]};
  if (redactedData.api_key) redactedData.api_key = '[REDACTED]';
  if (redactedData.api_key_hash) redactedData.api_key_hash = '[REDACTED]';
  if (redactedData.key) redactedData.key = '[REDACTED]';
  if (redactedData.key_hash) redactedData.key_hash = '[REDACTED]';
  if (redactedData.password) redactedData.password = '[REDACTED]';
  console.log(JSON.stringify(redactedData, null, 2));
}

checkSchema(); 