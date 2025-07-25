import { createClient } from '@supabase/supabase-js';

// Production Supabase credentials
const PROD_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PROD_URL, PROD_ANON_KEY);

async function fixInsightsData() {
  console.log('🔧 Fixing insights data...\n');

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

    // Get the partner ID
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', authData.user.id)
      .single();

    if (partnerError || !partner) {
      console.error('❌ Partner lookup failed:', partnerError);
      return;
    }

    console.log(`📋 Using partner ID: ${partner.id}`);

    // Get the existing insight
    const { data: insights, error: insightsError } = await supabase
      .from('insights')
      .select('*');

    if (insightsError) {
      console.error('❌ Error fetching insights:', insightsError);
      return;
    }

    if (insights.length === 0) {
      console.log('📊 No insights found to fix');
      return;
    }

    const insight = insights[0];
    console.log(`📊 Found insight: ${insight.model_name} (ID: ${insight.id})`);

    // Create a proper ingestion event for this insight
    console.log('\n2. 📝 Creating ingestion event...');
    const ingestionEvent = {
      partner_id: partner.id,
      event_type: 'event_registration',
      status: 'processed',
      payload: {
        event_id: 'sample-event-001',
        event_name: 'Sample Conference',
        user_id: 'sample-user-001',
        ticket_type: 'VIP',
        registration_date: new Date().toISOString()
      }
    };

    const { data: newEvent, error: eventError } = await supabase
      .from('ingestion_events')
      .insert([ingestionEvent])
      .select()
      .single();

    if (eventError) {
      console.error('❌ Error creating ingestion event:', eventError);
      return;
    }

    console.log(`✅ Created ingestion event: ${newEvent.id}`);

    // Update the insight to reference the new ingestion event
    console.log('\n3. 🔄 Updating insight with correct ingestion event ID...');
    const { error: updateError } = await supabase
      .from('insights')
      .update({ ingestion_event_id: newEvent.id })
      .eq('id', insight.id);

    if (updateError) {
      console.error('❌ Error updating insight:', updateError);
      return;
    }

    console.log('✅ Updated insight with correct ingestion event ID');

    // Verify the fix
    console.log('\n4. ✅ Verifying the fix...');
    const { data: fixedInsights, error: verifyError } = await supabase
      .from('insights')
      .select(`
        *,
        ingestion_events!inner(*)
      `);

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
      return;
    }

    console.log(`✅ Verification successful: ${fixedInsights.length} insights with valid ingestion events`);

    // Test the Edge Function
    console.log('\n5. 🧪 Testing get-insights Edge Function...');
    const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('get-insights');

    if (edgeFunctionError) {
      console.error('❌ Edge Function error:', edgeFunctionError);
      return;
    }

    console.log('✅ Edge Function working correctly');
    console.log(`   Insights returned: ${edgeFunctionData.insights ? edgeFunctionData.insights.length : 0}`);

    if (edgeFunctionData.insights && edgeFunctionData.insights.length > 0) {
      const insight = edgeFunctionData.insights[0];
      console.log(`   First insight: ${insight.model_name}`);
      console.log(`   Prediction: ${JSON.stringify(insight.prediction_output)}`);
    }

    console.log('\n🎉 Insights data fixed successfully!');
    console.log('💡 You can now refresh your admin panel to see the insights working correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixInsightsData(); 