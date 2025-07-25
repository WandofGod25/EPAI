import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPredictionTables() {
  try {
    console.log('Applying prediction tables migration...');
    
    // Create prediction_requests table
    console.log('Creating prediction_requests table...');
    const { error: requestsError } = await supabase.rpc('exec_sql', { 
      sql: `
        CREATE TABLE IF NOT EXISTS prediction_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
          model_type TEXT NOT NULL CHECK (model_type IN ('attendance_forecast', 'lead_scoring')),
          
          -- Attendance Forecast fields
          venue TEXT,
          event_date DATE,
          genre TEXT,
          ticket_price DECIMAL(10,2),
          marketing_budget DECIMAL(12,2),
          venue_capacity INTEGER,
          
          -- Lead Scoring fields
          customer_email TEXT,
          customer_name TEXT,
          age INTEGER,
          location TEXT,
          engagement_score INTEGER,
          previous_purchases INTEGER,
          website_visits INTEGER,
          email_opens INTEGER,
          social_media_engagement INTEGER,
          
          -- Metadata
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (requestsError) {
      console.error('Error creating prediction_requests table:', requestsError);
    } else {
      console.log('✅ prediction_requests table created');
    }

    // Create prediction_results table
    console.log('Creating prediction_results table...');
    const { error: resultsError } = await supabase.rpc('exec_sql', { 
      sql: `
        CREATE TABLE IF NOT EXISTS prediction_results (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          request_id UUID NOT NULL REFERENCES prediction_requests(id) ON DELETE CASCADE,
          partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
          
          -- Prediction data
          prediction_value DECIMAL(15,4) NOT NULL,
          confidence_score DECIMAL(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
          explanation TEXT,
          
          -- Model metadata
          model_version TEXT,
          processing_time_ms INTEGER,
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (resultsError) {
      console.error('Error creating prediction_results table:', resultsError);
    } else {
      console.log('✅ prediction_results table created');
    }

    // Create indexes
    console.log('Creating indexes...');
    const { error: indexesError } = await supabase.rpc('exec_sql', { 
      sql: `
        CREATE INDEX IF NOT EXISTS idx_prediction_requests_partner_id ON prediction_requests(partner_id);
        CREATE INDEX IF NOT EXISTS idx_prediction_requests_model_type ON prediction_requests(model_type);
        CREATE INDEX IF NOT EXISTS idx_prediction_requests_status ON prediction_requests(status);
        CREATE INDEX IF NOT EXISTS idx_prediction_requests_created_at ON prediction_requests(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_prediction_results_request_id ON prediction_results(request_id);
        CREATE INDEX IF NOT EXISTS idx_prediction_results_partner_id ON prediction_results(partner_id);
        CREATE INDEX IF NOT EXISTS idx_prediction_results_created_at ON prediction_results(created_at);
      `
    });
    
    if (indexesError) {
      console.error('Error creating indexes:', indexesError);
    } else {
      console.log('✅ Indexes created');
    }

    // Enable RLS
    console.log('Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: `
        ALTER TABLE prediction_requests ENABLE ROW LEVEL SECURITY;
        ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    } else {
      console.log('✅ RLS enabled');
    }

    console.log('✅ Prediction tables migration completed successfully!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

applyPredictionTables(); 