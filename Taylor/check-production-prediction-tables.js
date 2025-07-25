import { createClient } from '@supabase/supabase-js';

// Use production Supabase URL and service role key
const supabaseUrl = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MjA2NDk5NzY4OX0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductionPredictionTables() {
  try {
    console.log('=== CHECKING PRODUCTION PREDICTION TABLES ===');
    console.log('Supabase URL:', supabaseUrl);
    
    // Step 1: Check if prediction_requests table exists
    console.log('\n1. Checking prediction_requests table...');
    
    const { data: requestsTable, error: requestsError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'prediction_requests' 
        ORDER BY ordinal_position;
      `
    });
    
    if (requestsError) {
      console.error('❌ Error checking prediction_requests table:', requestsError);
      console.log('📋 Creating prediction_requests table...');
      
      // Create the table
      const { error: createRequestsError } = await supabase.rpc('exec_sql', { 
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
      
      if (createRequestsError) {
        console.error('❌ Error creating prediction_requests table:', createRequestsError);
        return;
      }
      
      console.log('✅ prediction_requests table created');
    } else {
      console.log('✅ prediction_requests table exists');
      console.log('📊 Table structure:', requestsTable);
    }
    
    // Step 2: Check if prediction_results table exists
    console.log('\n2. Checking prediction_results table...');
    
    const { data: resultsTable, error: resultsError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'prediction_results' 
        ORDER BY ordinal_position;
      `
    });
    
    if (resultsError) {
      console.error('❌ Error checking prediction_results table:', resultsError);
      console.log('📋 Creating prediction_results table...');
      
      // Create the table
      const { error: createResultsError } = await supabase.rpc('exec_sql', { 
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
      
      if (createResultsError) {
        console.error('❌ Error creating prediction_results table:', createResultsError);
        return;
      }
      
      console.log('✅ prediction_results table created');
    } else {
      console.log('✅ prediction_results table exists');
      console.log('📊 Table structure:', resultsTable);
    }
    
    // Step 3: Create indexes
    console.log('\n3. Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_prediction_requests_partner_id ON prediction_requests(partner_id);',
      'CREATE INDEX IF NOT EXISTS idx_prediction_requests_model_type ON prediction_requests(model_type);',
      'CREATE INDEX IF NOT EXISTS idx_prediction_requests_status ON prediction_requests(status);',
      'CREATE INDEX IF NOT EXISTS idx_prediction_requests_created_at ON prediction_requests(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_prediction_results_request_id ON prediction_results(request_id);',
      'CREATE INDEX IF NOT EXISTS idx_prediction_results_partner_id ON prediction_results(partner_id);',
      'CREATE INDEX IF NOT EXISTS idx_prediction_results_created_at ON prediction_results(created_at);'
    ];
    
    for (const indexSQL of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (indexError) {
        console.error('❌ Error creating index:', indexError);
      } else {
        console.log('✅ Index created');
      }
    }
    
    // Step 4: Enable RLS and create policies
    console.log('\n4. Setting up RLS policies...');
    
    const rlsPolicies = [
      'ALTER TABLE prediction_requests ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;',
      'DROP POLICY IF EXISTS "Partners can view their own prediction requests" ON prediction_requests;',
      'CREATE POLICY "Partners can view their own prediction requests" ON prediction_requests FOR SELECT USING (partner_id = auth.uid()::text::uuid);',
      'DROP POLICY IF EXISTS "Partners can insert their own prediction requests" ON prediction_requests;',
      'CREATE POLICY "Partners can insert their own prediction requests" ON prediction_requests FOR INSERT WITH CHECK (partner_id = auth.uid()::text::uuid);',
      'DROP POLICY IF EXISTS "Partners can update their own prediction requests" ON prediction_requests;',
      'CREATE POLICY "Partners can update their own prediction requests" ON prediction_requests FOR UPDATE USING (partner_id = auth.uid()::text::uuid);',
      'DROP POLICY IF EXISTS "Partners can view their own prediction results" ON prediction_results;',
      'CREATE POLICY "Partners can view their own prediction results" ON prediction_results FOR SELECT USING (partner_id = auth.uid()::text::uuid);',
      'DROP POLICY IF EXISTS "Partners can insert their own prediction results" ON prediction_results;',
      'CREATE POLICY "Partners can insert their own prediction results" ON prediction_results FOR INSERT WITH CHECK (partner_id = auth.uid()::text::uuid);'
    ];
    
    for (const policySQL of rlsPolicies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySQL });
      if (policyError) {
        console.error('❌ Error setting up RLS policy:', policyError);
      } else {
        console.log('✅ RLS policy applied');
      }
    }
    
    console.log('\n✅ Production prediction tables setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkProductionPredictionTables(); 