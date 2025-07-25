import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPredictionTables() {
  try {
    console.log('Checking prediction tables...');
    
    // Check if prediction_requests table exists
    const { data: requestsTable, error: requestsError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'prediction_requests' 
        ORDER BY ordinal_position;
      `
    });
    
    if (requestsError) {
      console.error('Error checking prediction_requests table:', requestsError);
    } else {
      console.log('prediction_requests table structure:', requestsTable);
    }
    
    // Check if prediction_results table exists
    const { data: resultsTable, error: resultsError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'prediction_results' 
        ORDER BY ordinal_position;
      `
    });
    
    if (resultsError) {
      console.error('Error checking prediction_results table:', resultsError);
    } else {
      console.log('prediction_results table structure:', resultsTable);
    }
    
    // Check if there are any existing records
    const { data: existingRequests, error: requestsCountError } = await supabase.rpc('exec_sql', { 
      sql: `SELECT COUNT(*) as count FROM prediction_requests;`
    });
    
    if (requestsCountError) {
      console.error('Error counting prediction_requests:', requestsCountError);
    } else {
      console.log('Existing prediction_requests count:', existingRequests);
    }
    
    const { data: existingResults, error: resultsCountError } = await supabase.rpc('exec_sql', { 
      sql: `SELECT COUNT(*) as count FROM prediction_results;`
    });
    
    if (resultsCountError) {
      console.error('Error counting prediction_results:', resultsCountError);
    } else {
      console.log('Existing prediction_results count:', existingResults);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPredictionTables(); 