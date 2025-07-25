import { createClient } from '@supabase/supabase-js';

// Production Supabase credentials
const PROD_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PROD_URL, PROD_ANON_KEY);

async function testInsightsWithAuth() {
  console.log('🔍 Testing insights API with authentication...\n');

  try {
    // First, authenticate
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
    console.log('   User ID:', authData.user.id);

    // Test the get-insights Edge Function
    console.log('\n2. 📊 Testing get-insights Edge Function...');
    const { data, error } = await supabase.functions.invoke('get-insights', {
      body: { page: 0 }
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
      console.log('   Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Edge Function response:');
    console.log('   Insights count:', data.count);
    console.log('   Insights array length:', data.insights ? data.insights.length : 0);

    if (data.insights && data.insights.length > 0) {
      console.log('\n   Insights found:');
      data.insights.forEach((insight, index) => {
        console.log(`   ${index + 1}. ${insight.title || insight.insight_type}`);
        console.log(`      Type: ${insight.insight_type}`);
        console.log(`      Content: ${insight.content}`);
        console.log(`      Confidence: ${insight.confidence}`);
        console.log(`      ID: ${insight.id}`);
      });
    } else {
      console.log('   No insights returned from Edge Function');
    }

    // Test direct database access
    console.log('\n3. 🗄️ Testing direct database access to insights...');
    const { data: dbInsights, error: dbError } = await supabase
      .from('insights')
      .select('*');

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return;
    }

    console.log(`   Direct DB access: ${dbInsights.length} insights found`);
    if (dbInsights.length > 0) {
      dbInsights.forEach((insight, index) => {
        console.log(`   ${index + 1}. ${insight.title || insight.insight_type} (${insight.insight_type})`);
        console.log(`      Content: ${insight.content}`);
        console.log(`      Partner ID: ${insight.partner_id}`);
      });
    }

    // Check if there are any ingestion events
    console.log('\n4. 📝 Checking ingestion events...');
    const { data: events, error: eventsError } = await supabase
      .from('ingestion_events')
      .select('*');

    if (eventsError) {
      console.error('❌ Events error:', eventsError);
      return;
    }

    console.log(`   Found ${events.length} ingestion events`);
    if (events.length > 0) {
      events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.event_type} (${event.status})`);
        console.log(`      Partner ID: ${event.partner_id}`);
        console.log(`      Created: ${event.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testInsightsWithAuth(); 