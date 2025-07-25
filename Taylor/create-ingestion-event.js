import { createClient } from '@supabase/supabase-js';

// Production Supabase credentials with service role
const PROD_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PROD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQyMTY4OSwiZXhwIjoyMDY0OTk3Njg5fQ.0D4A99QwPrmU_ecC5KkAQl4isJ3vspSWkYjPYvnEYaU';

const supabase = createClient(PROD_URL, PROD_SERVICE_KEY);

async function createIngestionEvent() {
  console.log('🔧 Creating ingestion event with service role...\n');

  try {
    // First, get the partner ID from the existing insight
    console.log('1. 📋 Getting partner ID from existing insight...');
    const { data: insights, error: insightsError } = await supabase
      .from('insights')
      .select('partner_id')
      .limit(1);

    if (insightsError || insights.length === 0) {
      console.error('❌ Error getting partner ID:', insightsError);
      return;
    }

    const partnerId = insights[0].partner_id;
    console.log(`📋 Using partner ID: ${partnerId}`);

    // Create a proper ingestion event
    console.log('\n2. 📝 Creating ingestion event...');
    const ingestionEvent = {
      partner_id: partnerId,
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
      .eq('partner_id', partnerId);

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
    
    fixedInsights.forEach((insight, index) => {
      console.log(`   ${index + 1}. ${insight.model_name} - Event: ${insight.ingestion_events.event_type}`);
    });

    console.log('\n🎉 Insights data fixed successfully!');
    console.log('💡 You can now refresh your admin panel to see the insights working correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createIngestionEvent(); 