import { createClient } from '@supabase/supabase-js';

// Use production Supabase URL and anon key (we'll authenticate as a user)
const supabaseUrl = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createProductionTablesViaAPI() {
  try {
    console.log('=== CREATING PRODUCTION TABLES VIA API ===');
    console.log('Supabase URL:', supabaseUrl);
    
    // Step 1: Authenticate with existing user
    console.log('\n1. 🔐 Authenticating with existing user...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ange_andre25@yahoo.com',
      password: 'Taylortest'
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError);
      return;
    }
    
    console.log('✅ Authentication successful');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    
    // Step 2: Create prediction_requests table
    console.log('\n2. 📋 Creating prediction_requests table...');
    
    const createRequestsSQL = `
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
    `;
    
    const { data: requestsResult, error: requestsError } = await supabase.rpc('exec_sql', { 
      sql: createRequestsSQL
    });
    
    if (requestsError) {
      console.error('❌ Error creating prediction_requests table:', requestsError);
      return;
    }
    
    console.log('✅ prediction_requests table created');
    
    // Step 3: Create prediction_results table
    console.log('\n3. 📊 Creating prediction_results table...');
    
    const createResultsSQL = `
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
    `;
    
    const { data: resultsResult, error: resultsError } = await supabase.rpc('exec_sql', { 
      sql: createResultsSQL
    });
    
    if (resultsError) {
      console.error('❌ Error creating prediction_results table:', resultsError);
      return;
    }
    
    console.log('✅ prediction_results table created');
    
    // Step 4: Create indexes
    console.log('\n4. 🔍 Creating indexes...');
    
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
    
    // Step 5: Enable RLS and create policies
    console.log('\n5. 🔒 Setting up RLS policies...');
    
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
    
    // Step 6: Test the prediction API again
    console.log('\n6. 🧪 Testing prediction API...');
    
    const testData = {
      modelType: 'attendance_forecast',
      venue: 'Madison Square Garden',
      eventDate: '2025-02-15',
      genre: 'rock',
      ticketPrice: 75,
      marketingBudget: 50000,
      venueCapacity: 20000
    };
    
    const response = await fetch(`${supabaseUrl}/functions/v1/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`,
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📥 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Prediction API is now working!');
      console.log('📊 Response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ Prediction API still failing:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createProductionTablesViaAPI(); 