#!/usr/bin/env node

/**
 * EPAI Table Describer
 * 
 * This script describes the structure of a specific table.
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

// Get the table name from command line arguments
const tableName = process.argv[2];

if (!tableName) {
  console.error('Please provide a table name as an argument');
  process.exit(1);
}

/**
 * Describe table
 */
async function describeTable() {
  console.log(`Describing table: ${tableName}`);
  
  try {
    // Create a table if it doesn't exist (for testing)
    const { data: createData, error: createError } = await supabase.rpc('exec_sql', {
      sql_string: `
        CREATE TABLE IF NOT EXISTS ${tableName}_temp (id TEXT PRIMARY KEY);
        INSERT INTO ${tableName}_temp (id) VALUES ('test') ON CONFLICT DO NOTHING;
      `
    });
    
    if (createError) {
      console.error('Error creating test table:', createError);
    }
    
    // Get table structure directly
    const { data: tableData, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position');
    
    if (tableError) {
      console.error('Error getting table structure:', tableError);
      return;
    }
    
    console.log('Table structure:');
    if (tableData && tableData.length > 0) {
      tableData.forEach(column => {
        console.log(`- ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
    } else {
      console.log('No columns found');
    }
    
    // Get primary key
    const { data: pkData, error: pkError } = await supabase.rpc('exec_sql', {
      sql_string: `
        SELECT 
          tc.constraint_name, 
          kcu.column_name
        FROM 
          information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE 
          tc.constraint_type = 'PRIMARY KEY' 
          AND tc.table_schema = 'public' 
          AND tc.table_name = '${tableName}';
      `
    });
    
    if (pkError) {
      console.error('Error getting primary key:', pkError);
    } else {
      console.log('Primary key:', pkData);
    }
    
    // Get foreign keys
    const { data: fkData, error: fkError } = await supabase.rpc('exec_sql', {
      sql_string: `
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE
          tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = '${tableName}';
      `
    });
    
    if (fkError) {
      console.error('Error getting foreign keys:', fkError);
    } else {
      console.log('Foreign keys:', fkData);
    }
    
    // Get sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error getting sample data:', sampleError);
    } else if (sampleData && sampleData.length > 0) {
      console.log('Sample data:', sampleData[0]);
    } else {
      console.log('No data in table');
    }
  } catch (error) {
    console.error('Error describing table:', error);
  }
}

// Run the function
describeTable(); 