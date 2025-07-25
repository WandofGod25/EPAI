import { createClient } from '@supabase/supabase-js';

// Use production Supabase URL and anon key (we'll authenticate as a user)
const supabaseUrl = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createPredictionHelperFunction() {
  try {
    console.log('=== CREATING PREDICTION HELPER FUNCTION ===');
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
    
    // Step 2: Create the helper function
    console.log('\n2. 📋 Creating get_prediction_requests_with_results function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_prediction_requests_with_results(
        partner_id_param UUID,
        limit_param INTEGER DEFAULT 10,
        offset_param INTEGER DEFAULT 0
      )
      RETURNS TABLE (
        request_id UUID,
        model_type TEXT,
        venue TEXT,
        event_date DATE,
        genre TEXT,
        ticket_price DECIMAL(10,2),
        marketing_budget DECIMAL(12,2),
        venue_capacity INTEGER,
        customer_email TEXT,
        customer_name TEXT,
        age INTEGER,
        location TEXT,
        engagement_score INTEGER,
        previous_purchases INTEGER,
        website_visits INTEGER,
        email_opens INTEGER,
        social_media_engagement INTEGER,
        status TEXT,
        prediction_value DECIMAL(15,4),
        confidence_score DECIMAL(5,4),
        explanation TEXT,
        model_version TEXT,
        processing_time_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          pr.id as request_id,
          pr.model_type,
          pr.venue,
          pr.event_date,
          pr.genre,
          pr.ticket_price,
          pr.marketing_budget,
          pr.venue_capacity,
          pr.customer_email,
          pr.customer_name,
          pr.age,
          pr.location,
          pr.engagement_score,
          pr.previous_purchases,
          pr.website_visits,
          pr.email_opens,
          pr.social_media_engagement,
          pr.status,
          pres.prediction_value,
          pres.confidence_score,
          pres.explanation,
          pres.model_version,
          pres.processing_time_ms,
          pr.created_at
        FROM prediction_requests pr
        LEFT JOIN prediction_results pres ON pr.id = pres.request_id
        WHERE pr.partner_id = partner_id_param
        ORDER BY pr.created_at DESC
        LIMIT limit_param
        OFFSET offset_param;
      END;
      $$;
    `;
    
    const { data: functionResult, error: functionError } = await supabase.rpc('exec_sql', { 
      sql: createFunctionSQL
    });
    
    if (functionError) {
      console.error('❌ Error creating helper function:', functionError);
      return;
    }
    
    console.log('✅ Helper function created successfully');
    
    // Step 3: Test the function
    console.log('\n3. 🧪 Testing the helper function...');
    
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', authData.user.id)
      .single();
    
    if (partnerError || !partner) {
      console.error('❌ Partner lookup failed:', partnerError);
      return;
    }
    
    const { data: testResult, error: testError } = await supabase.rpc('get_prediction_requests_with_results', {
      partner_id_param: partner.id,
      limit_param: 5,
      offset_param: 0
    });
    
    if (testError) {
      console.error('❌ Error testing helper function:', testError);
    } else {
      console.log('✅ Helper function test successful');
      console.log('📊 Test result count:', testResult?.length || 0);
      if (testResult && testResult.length > 0) {
        console.log('📊 Sample result:', JSON.stringify(testResult[0], null, 2));
      }
    }
    
    console.log('\n✅ Prediction helper function setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createPredictionHelperFunction(); 