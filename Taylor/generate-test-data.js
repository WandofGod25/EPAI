import { createClient } from '@supabase/supabase-js';

// Production Supabase credentials with service role
const PROD_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PROD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQyMTY4OSwiZXhwIjoyMDY0OTk3Njg5fQ.0D4A99QwPrmU_ecC5KkAQl4isJ3vspSWkYjPYvnEYaU';

const supabase = createClient(PROD_URL, PROD_SERVICE_KEY);

async function generateTestData() {
  console.log('🚀 Generating comprehensive test data...\n');

  try {
    // Get the partner ID
    console.log('1. 📋 Getting partner ID...');
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

    // Get model IDs
    console.log('\n2. 🤖 Getting model IDs...');
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('id, model_name');

    if (modelsError) {
      console.error('❌ Error getting models:', modelsError);
      return;
    }

    console.log(`🤖 Found ${models.length} models:`);
    models.forEach(model => {
      console.log(`   - ${model.model_name} (${model.id})`);
    });

    // Create additional ingestion events
    console.log('\n3. 📝 Creating ingestion events...');
    const ingestionEvents = [
      {
        partner_id: partnerId,
        event_type: 'user_engagement',
        status: 'processed',
        payload: {
          user_id: 'user-001',
          page_visited: '/products',
          time_spent: 180,
          actions_taken: ['view_product', 'add_to_cart'],
          timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
      },
      {
        partner_id: partnerId,
        event_type: 'event_registration',
        status: 'processed',
        payload: {
          event_id: 'event-002',
          event_name: 'Tech Conference 2024',
          user_id: 'user-002',
          ticket_type: 'Standard',
          registration_date: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        }
      },
      {
        partner_id: partnerId,
        event_type: 'email_click',
        status: 'processed',
        payload: {
          campaign_id: 'campaign-001',
          user_id: 'user-003',
          email_type: 'newsletter',
          link_clicked: 'https://example.com/offer',
          timestamp: new Date(Date.now() - 259200000).toISOString() // 3 days ago
        }
      }
    ];

    const { data: newEvents, error: eventsError } = await supabase
      .from('ingestion_events')
      .insert(ingestionEvents)
      .select();

    if (eventsError) {
      console.error('❌ Error creating ingestion events:', eventsError);
      return;
    }

    console.log(`✅ Created ${newEvents.length} ingestion events`);

    // Create additional insights
    console.log('\n4. 📊 Creating additional insights...');
    const additionalInsights = [
      {
        partner_id: partnerId,
        ingestion_event_id: newEvents[0].id,
        model_id: models.find(m => m.model_name === 'Lead Scoring')?.id,
        model_name: 'Lead Scoring',
        prediction_output: {
          lead_score: 85,
          confidence: 0.92,
          factors: ['high_engagement', 'product_interest', 'recent_activity'],
          recommendation: 'High priority lead - follow up within 24 hours'
        },
        is_delivered: false,
        metadata: {
          source: 'user_engagement',
          processing_time_ms: 245
        }
      },
      {
        partner_id: partnerId,
        ingestion_event_id: newEvents[1].id,
        model_id: models.find(m => m.model_name === 'Attendance Forecast')?.id,
        model_name: 'Attendance Forecast',
        prediction_output: {
          predicted_attendance: 450,
          confidence_interval: [420, 480],
          factors: ['historical_data', 'marketing_campaign', 'seasonal_trends'],
          recommendation: 'Expect 450 attendees with 90% confidence'
        },
        is_delivered: true,
        metadata: {
          source: 'event_registration',
          processing_time_ms: 189
        }
      },
      {
        partner_id: partnerId,
        ingestion_event_id: newEvents[2].id,
        model_id: models.find(m => m.model_name === 'Lead Scoring')?.id,
        model_name: 'Lead Scoring',
        prediction_output: {
          lead_score: 72,
          confidence: 0.88,
          factors: ['email_engagement', 'click_behavior', 'campaign_response'],
          recommendation: 'Medium priority lead - nurture campaign recommended'
        },
        is_delivered: false,
        metadata: {
          source: 'email_click',
          processing_time_ms: 156
        }
      }
    ];

    const { data: newInsights, error: insightsInsertError } = await supabase
      .from('insights')
      .insert(additionalInsights)
      .select();

    if (insightsInsertError) {
      console.error('❌ Error creating insights:', insightsInsertError);
      return;
    }

    console.log(`✅ Created ${newInsights.length} additional insights`);

    // Create logs
    console.log('\n5. 📋 Creating logs...');
    const logs = [
      {
        partner_id: partnerId,
        method: 'POST',
        path: '/api/ingest',
        status_code: 201,
        request_body: {
          event_type: 'user_engagement',
          user_id: 'user-001',
          data: { page: '/products', time_spent: 180 }
        },
        response_body: {
          success: true,
          event_id: 'event-001',
          processing_time_ms: 245
        }
      },
      {
        partner_id: partnerId,
        method: 'GET',
        path: '/api/insights',
        status_code: 200,
        request_body: null,
        response_body: {
          insights: 3,
          count: 3
        }
      },
      {
        partner_id: partnerId,
        method: 'POST',
        path: '/api/ingest',
        status_code: 400,
        request_body: {
          event_type: 'invalid_event',
          user_id: 'user-002'
        },
        response_body: {
          error: 'Invalid event type',
          valid_types: ['user_engagement', 'event_registration', 'email_click']
        }
      }
    ];

    const { data: newLogs, error: logsError } = await supabase
      .from('logs')
      .insert(logs)
      .select();

    if (logsError) {
      console.error('❌ Error creating logs:', logsError);
      return;
    }

    console.log(`✅ Created ${newLogs.length} logs`);

    // Verify the data
    console.log('\n6. ✅ Verifying all data...');
    
    const { data: allInsights, error: verifyInsightsError } = await supabase
      .from('insights')
      .select('*');
    
    const { data: allLogs, error: verifyLogsError } = await supabase
      .from('logs')
      .select('*');
    
    const { data: allEvents, error: verifyEventsError } = await supabase
      .from('ingestion_events')
      .select('*');

    if (verifyInsightsError || verifyLogsError || verifyEventsError) {
      console.error('❌ Error verifying data:', { verifyInsightsError, verifyLogsError, verifyEventsError });
      return;
    }

    console.log(`📊 Total insights: ${allInsights.length}`);
    console.log(`📋 Total logs: ${allLogs.length}`);
    console.log(`📝 Total ingestion events: ${allEvents.length}`);

    console.log('\n🎉 Test data generation completed successfully!');
    console.log('💡 Your admin panel now has comprehensive test data to work with.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

generateTestData(); 