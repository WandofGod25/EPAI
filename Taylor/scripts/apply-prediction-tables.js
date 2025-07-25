import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPredictionTables() {
  try {
    console.log('Applying prediction tables migration...');
    
    const migrationSQL = `
-- Create prediction_requests table
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

-- Create prediction_results table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prediction_requests_partner_id ON prediction_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_prediction_requests_model_type ON prediction_requests(model_type);
CREATE INDEX IF NOT EXISTS idx_prediction_requests_status ON prediction_requests(status);
CREATE INDEX IF NOT EXISTS idx_prediction_requests_created_at ON prediction_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_prediction_results_request_id ON prediction_results(request_id);
CREATE INDEX IF NOT EXISTS idx_prediction_results_partner_id ON prediction_results(partner_id);
CREATE INDEX IF NOT EXISTS idx_prediction_results_created_at ON prediction_results(created_at);

-- Add RLS policies
ALTER TABLE prediction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for prediction_requests
DROP POLICY IF EXISTS "Partners can view their own prediction requests" ON prediction_requests;
CREATE POLICY "Partners can view their own prediction requests" ON prediction_requests
    FOR SELECT USING (partner_id = auth.uid()::text::uuid);

DROP POLICY IF EXISTS "Partners can insert their own prediction requests" ON prediction_requests;
CREATE POLICY "Partners can insert their own prediction requests" ON prediction_requests
    FOR INSERT WITH CHECK (partner_id = auth.uid()::text::uuid);

DROP POLICY IF EXISTS "Partners can update their own prediction requests" ON prediction_requests;
CREATE POLICY "Partners can update their own prediction requests" ON prediction_requests
    FOR UPDATE USING (partner_id = auth.uid()::text::uuid);

-- RLS policies for prediction_results
DROP POLICY IF EXISTS "Partners can view their own prediction results" ON prediction_results;
CREATE POLICY "Partners can view their own prediction results" ON prediction_results
    FOR SELECT USING (partner_id = auth.uid()::text::uuid);

DROP POLICY IF EXISTS "Partners can insert their own prediction results" ON prediction_results;
CREATE POLICY "Partners can insert their own prediction results" ON prediction_results
    FOR INSERT WITH CHECK (partner_id = auth.uid()::text::uuid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prediction_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_prediction_requests_updated_at ON prediction_requests;
CREATE TRIGGER trigger_update_prediction_requests_updated_at
    BEFORE UPDATE ON prediction_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_prediction_requests_updated_at();

-- Create function to get prediction requests with results
CREATE OR REPLACE FUNCTION get_prediction_requests_with_results(partner_uuid UUID)
RETURNS TABLE (
    request_id UUID,
    model_type TEXT,
    status TEXT,
    prediction_value DECIMAL(15,4),
    confidence_score DECIMAL(5,4),
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    input_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id as request_id,
        pr.model_type,
        pr.status,
        pres.prediction_value,
        pres.confidence_score,
        pres.explanation,
        pr.created_at,
        CASE 
            WHEN pr.model_type = 'attendance_forecast' THEN
                jsonb_build_object(
                    'venue', pr.venue,
                    'event_date', pr.event_date,
                    'genre', pr.genre,
                    'ticket_price', pr.ticket_price,
                    'marketing_budget', pr.marketing_budget,
                    'venue_capacity', pr.venue_capacity
                )
            WHEN pr.model_type = 'lead_scoring' THEN
                jsonb_build_object(
                    'customer_email', pr.customer_email,
                    'customer_name', pr.customer_name,
                    'age', pr.age,
                    'location', pr.location,
                    'engagement_score', pr.engagement_score,
                    'previous_purchases', pr.previous_purchases,
                    'website_visits', pr.website_visits,
                    'email_opens', pr.email_opens,
                    'social_media_engagement', pr.social_media_engagement
                )
        END as input_data
    FROM prediction_requests pr
    LEFT JOIN prediction_results pres ON pr.id = pres.request_id
    WHERE pr.partner_id = partner_uuid
    ORDER BY pr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql_string: migrationSQL });
    
    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }

    console.log('✅ Prediction tables migration applied successfully!');
    
    // Verify the tables were created
    const { data: tables, error: tablesError } = await supabase.rpc('list_tables');
    if (tablesError) {
      console.error('Error listing tables:', tablesError);
    } else {
      console.log('Available tables:', tables);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

applyPredictionTables(); 