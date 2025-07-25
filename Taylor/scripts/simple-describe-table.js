#!/usr/bin/env node

/**
 * EPAI Simple Table Describer
 * 
 * This script creates a temporary row in a table and then reads its structure.
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
 * Describe table by creating a temporary row
 */
async function describeTable() {
  console.log(`Describing table: ${tableName}`);
  
  try {
    // Try to insert a temporary row with minimal data
    const { data: insertData, error: insertError } = await supabase
      .from(tableName)
      .insert({ id: '00000000-0000-4000-a000-000000000000' })
      .select();
    
    if (insertError) {
      console.log(`Error inserting temporary row: ${insertError.message}`);
      console.log('Trying to get structure from existing data...');
    } else {
      console.log('Successfully inserted temporary row');
      
      // Delete the temporary row
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', '00000000-0000-4000-a000-000000000000');
      
      if (deleteError) {
        console.log(`Error deleting temporary row: ${deleteError.message}`);
      } else {
        console.log('Successfully deleted temporary row');
      }
    }
    
    // Try to get structure from existing data
    const { data: selectData, error: selectError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error(`Error selecting from table: ${selectError.message}`);
      return;
    }
    
    if (selectData && selectData.length > 0) {
      const columns = Object.keys(selectData[0]);
      console.log(`\nTable ${tableName} has the following columns:`);
      columns.forEach(column => {
        const value = selectData[0][column];
        const type = typeof value;
        console.log(`- ${column} (${type}, ${value === null ? 'nullable' : 'value: ' + JSON.stringify(value)})`);
      });
    } else {
      console.log(`\nTable ${tableName} exists but has no rows`);
      
      // Try to get structure from metadata
      console.log('\nAttempting to get structure from metadata...');
      
      // Create a minimal insert with just the ID
      const { error: metaError } = await supabase
        .from(tableName)
        .insert({ id: '11111111-1111-4111-a111-111111111111' })
        .select();
      
      if (metaError) {
        console.log(`Metadata error: ${metaError.message}`);
        console.log('Required columns might include:');
        
        // Try to extract column names from the error message
        const matches = metaError.message.match(/column "(.*?)" of relation/g);
        if (matches) {
          matches.forEach(match => {
            const column = match.replace('column "', '').replace('" of relation', '');
            console.log(`- ${column} (required)`);
          });
        }
      }
    }
  } catch (error) {
    console.error('Error describing table:', error);
  }
}

// Run the function
describeTable(); 