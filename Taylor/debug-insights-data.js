import { createClient } from '@supabase/supabase-js';

// Production Supabase credentials
const PROD_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PROD_URL, PROD_ANON_KEY);

async function debugInsightsData() {
  console.log('🔍 Debugging insights table data...\n');

  try {
    // Authenticate
    console.log('1. 🔐 Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ange_andre25@yahoo.com',
      password: 'Taylortest'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError);
      return;
    }

    console.log('✅ Authentication successful');

    // Get all insights with detailed field inspection
    console.log('\n2. 📊 Fetching all insights with detailed inspection...');
    const { data: insights, error: insightsError } = await supabase
      .from('insights')
      .select('*');

    if (insightsError) {
      console.error('❌ Error fetching insights:', insightsError);
      return;
    }

    console.log(`📊 Found ${insights.length} insights in database:`);
    
    insights.forEach((insight, index) => {
      console.log(`\n   Insight ${index + 1}:`);
      console.log(`     ID: ${insight.id}`);
      console.log(`     Created: ${insight.created_at}`);
      console.log(`     Partner ID: ${insight.partner_id}`);
      console.log(`     Model ID: ${insight.model_id || 'NULL'}`);
      console.log(`     Model Name: ${insight.model_name || 'NULL'}`);
      console.log(`     Prediction Output: ${JSON.stringify(insight.prediction_output, null, 2) || 'NULL'}`);
      console.log(`     Is Delivered: ${insight.is_delivered}`);
      console.log(`     Metadata: ${JSON.stringify(insight.metadata, null, 2) || 'NULL'}`);
      
      // Check for any additional fields that might exist
      const allFields = Object.keys(insight);
      console.log(`     All fields: ${allFields.join(', ')}`);
    });

    // Check if there are any ingestion events that could be related
    console.log('\n3. 📝 Checking related ingestion events...');
    const { data: events, error: eventsError } = await supabase
      .from('ingestion_events')
      .select('*');

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError);
      return;
    }

    console.log(`📝 Found ${events.length} ingestion events:`);
    
    if (events.length > 0) {
      events.forEach((event, index) => {
        console.log(`\n   Event ${index + 1}:`);
        console.log(`     ID: ${event.id}`);
        console.log(`     Partner ID: ${event.partner_id}`);
        console.log(`     Event Type: ${event.event_type || 'NULL'}`);
        console.log(`     Status: ${event.status || 'NULL'}`);
        console.log(`     Data: ${JSON.stringify(event.data, null, 2) || 'NULL'}`);
        console.log(`     Created: ${event.created_at}`);
      });
    } else {
      console.log('   No ingestion events found');
    }

    // Check if there are any models that could be related
    console.log('\n4. 🤖 Checking related models...');
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('*');

    if (modelsError) {
      console.error('❌ Error fetching models:', modelsError);
      return;
    }

    console.log(`🤖 Found ${models.length} models:`);
    
    if (models.length > 0) {
      models.forEach((model, index) => {
        console.log(`\n   Model ${index + 1}:`);
        console.log(`     ID: ${model.id}`);
        console.log(`     Name: ${model.model_name || 'NULL'}`);
        console.log(`     Partner ID: ${model.partner_id || 'NULL'}`);
        console.log(`     Status: ${model.status || 'NULL'}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugInsightsData(); 