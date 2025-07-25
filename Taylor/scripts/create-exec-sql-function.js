#!/usr/bin/env node

/**
 * EPAI Create exec_sql Function
 * 
 * This script creates a Supabase Edge Function that allows executing SQL commands.
 * This is used by the alert system to create tables and insert data.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Console styling
const info = (text) => console.log(`ℹ ${text}`);
const success = (text) => console.log(`✓ ${text}`);
const error = (text) => console.error(`✗ ${text}`);
const step = (text) => console.log(`➤ ${text}`);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, 'test.env') });

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

// Promisify exec
const execAsync = promisify(exec);

// Create exec-sql Edge Function
async function createExecSqlFunction() {
  step('Creating exec-sql Edge Function...');
  
  try {
    // Create the supabase/functions directory if it doesn't exist
    const functionsDir = path.resolve(__dirname, '..', 'supabase', 'functions');
    const execSqlDir = path.join(functionsDir, 'exec-sql');
    
    if (!fs.existsSync(functionsDir)) {
      fs.mkdirSync(functionsDir, { recursive: true });
    }
    
    if (!fs.existsSync(execSqlDir)) {
      fs.mkdirSync(execSqlDir, { recursive: true });
    }
    
    // Create the exec-sql Edge Function
    const execSqlContent = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { sql } = await req.json()
    
    if (!sql) {
      return new Response(
        JSON.stringify({ error: 'SQL query is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // Execute the SQL query
    const { data, error } = await supabaseClient.rpc('exec_sql_internal', { sql })
    
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }
    
    // Return the result
    return new Response(
      JSON.stringify({ data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
`;
    
    // Create the _shared/cors.ts file if it doesn't exist
    const sharedDir = path.join(functionsDir, '_shared');
    if (!fs.existsSync(sharedDir)) {
      fs.mkdirSync(sharedDir, { recursive: true });
    }
    
    const corsFilePath = path.join(sharedDir, 'cors.ts');
    if (!fs.existsSync(corsFilePath)) {
      const corsContent = `
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}
`;
      fs.writeFileSync(corsFilePath, corsContent);
      success('Created _shared/cors.ts file');
    }
    
    // Write the exec-sql function
    fs.writeFileSync(path.join(execSqlDir, 'index.ts'), execSqlContent);
    success('Created exec-sql Edge Function');
    
    // Create the SQL function for internal use
    const createSqlFunction = `
-- Create the exec_sql_internal function (only callable by service role)
CREATE OR REPLACE FUNCTION exec_sql_internal(sql text)
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
  RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission only to service_role
REVOKE ALL ON FUNCTION exec_sql_internal(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql_internal(text) TO service_role;
`;
    
    // Write the SQL file
    const sqlFilePath = path.join(__dirname, 'create_exec_sql.sql');
    fs.writeFileSync(sqlFilePath, createSqlFunction);
    success(`SQL file written to ${sqlFilePath}`);
    
    // Execute the SQL file using psql
    try {
      // Try using supabase CLI
      const { stdout, stderr } = await execAsync(`cd .. && supabase db query -f scripts/create_exec_sql.sql`);
      if (stderr && !stderr.includes('NOTICE')) {
        throw new Error(stderr);
      }
      success('SQL function created successfully via Supabase CLI');
    } catch (cliErr) {
      error(`Failed to run Supabase CLI: ${cliErr.message}`);
      error('Trying alternative method...');
      
      try {
        // Try using direct HTTP request
        const { data, error: apiError } = await supabase.functions.invoke('exec-sql', {
          body: { sql: createSqlFunction }
        });
        
        if (apiError) {
          throw new Error(`API Error: ${apiError.message}`);
        }
        
        success('SQL function created successfully via API');
      } catch (apiErr) {
        error(`Failed to create SQL function via API: ${apiErr.message}`);
        throw apiErr;
      }
    }
    
    success('exec_sql function created successfully');
  } catch (err) {
    error(`Failed to create exec_sql function: ${err.message}`);
    throw err;
  }
}

// Main function
async function main() {
  info('EPAI Create exec_sql Function');
  info('=========================');
  
  try {
    await createExecSqlFunction();
    success('Setup completed successfully!');
  } catch (err) {
    error(`Setup failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 