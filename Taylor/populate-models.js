import { createClient } from '@supabase/supabase-js';

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateModels() {
  console.log('🚀 Populating models table with realistic data...\n');

  try {
    // First, get a partner ID to associate models with
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id')
      .limit(1);

    if (partnersError) {
      console.error('❌ Error fetching partners:', partnersError);
      return;
    }

    if (partners.length === 0) {
      console.error('❌ No partners found. Please create a partner first.');
      return;
    }

    const partnerId = partners[0].id;
    console.log(`📋 Using partner ID: ${partnerId}`);

    // Define realistic models for the EPAI platform
    const models = [
      {
        model_name: 'Event Attendance Predictor',
        description: 'Predicts event attendance based on historical data, marketing campaigns, and external factors like weather and competing events.',
        model_version: 'v2.1.0',
        partner_id: partnerId,
        status: 'active',
        metadata: {
          category: 'event_analytics',
          accuracy: 0.87,
          last_trained: '2024-01-15',
          features: ['historical_attendance', 'marketing_spend', 'weather_forecast', 'competitor_events'],
          use_cases: ['event_planning', 'resource_allocation', 'marketing_optimization']
        }
      },
      {
        model_name: 'Lead Scoring Engine',
        description: 'Scores leads based on engagement patterns, demographic data, and behavioral signals to prioritize sales efforts.',
        model_version: 'v1.8.2',
        partner_id: partnerId,
        status: 'active',
        metadata: {
          category: 'sales_intelligence',
          accuracy: 0.92,
          last_trained: '2024-01-10',
          features: ['email_engagement', 'website_activity', 'social_media_interaction', 'company_size'],
          use_cases: ['lead_prioritization', 'sales_automation', 'campaign_targeting']
        }
      },
      {
        model_name: 'Customer Churn Predictor',
        description: 'Identifies customers at risk of churning based on usage patterns, support interactions, and satisfaction metrics.',
        model_version: 'v1.5.3',
        partner_id: partnerId,
        status: 'active',
        metadata: {
          category: 'customer_analytics',
          accuracy: 0.89,
          last_trained: '2024-01-12',
          features: ['usage_frequency', 'support_tickets', 'feature_adoption', 'payment_history'],
          use_cases: ['retention_campaigns', 'proactive_support', 'product_improvement']
        }
      },
      {
        model_name: 'Revenue Forecasting Model',
        description: 'Forecasts revenue based on historical trends, seasonality, market conditions, and pipeline data.',
        model_version: 'v2.0.1',
        partner_id: partnerId,
        status: 'active',
        metadata: {
          category: 'financial_analytics',
          accuracy: 0.85,
          last_trained: '2024-01-08',
          features: ['historical_revenue', 'pipeline_value', 'market_indicators', 'seasonal_patterns'],
          use_cases: ['budget_planning', 'investor_reporting', 'resource_allocation']
        }
      },
      {
        model_name: 'Content Performance Predictor',
        description: 'Predicts content performance (views, engagement, conversions) based on content characteristics and audience data.',
        model_version: 'v1.3.4',
        partner_id: partnerId,
        status: 'active',
        metadata: {
          category: 'content_analytics',
          accuracy: 0.78,
          last_trained: '2024-01-14',
          features: ['content_type', 'topic_relevance', 'audience_demographics', 'publishing_timing'],
          use_cases: ['content_strategy', 'editorial_planning', 'audience_targeting']
        }
      },
      {
        model_name: 'Inventory Optimization Engine',
        description: 'Optimizes inventory levels based on demand forecasting, supplier lead times, and cost constraints.',
        model_version: 'v1.7.0',
        partner_id: partnerId,
        status: 'active',
        metadata: {
          category: 'supply_chain',
          accuracy: 0.91,
          last_trained: '2024-01-11',
          features: ['demand_history', 'supplier_lead_time', 'seasonal_demand', 'cost_variables'],
          use_cases: ['inventory_management', 'purchase_planning', 'cost_optimization']
        }
      }
    ];

    console.log(`📊 Inserting ${models.length} models...`);

    // Insert models one by one to handle any potential errors
    for (const model of models) {
      const { data, error } = await supabase
        .from('models')
        .insert([model])
        .select();

      if (error) {
        console.error(`❌ Error inserting model "${model.model_name}":`, error);
      } else {
        console.log(`✅ Successfully inserted: ${model.model_name} (v${model.model_version})`);
      }
    }

    // Verify the insertion
    console.log('\n🔍 Verifying models in database...');
    const { data: insertedModels, error: verifyError } = await supabase
      .from('models')
      .select('*')
      .eq('partner_id', partnerId);

    if (verifyError) {
      console.error('❌ Error verifying models:', verifyError);
      return;
    }

    console.log(`✅ Successfully verified ${insertedModels.length} models in database:`);
    insertedModels.forEach((model, index) => {
      console.log(`   ${index + 1}. ${model.model_name} (v${model.model_version}) - ${model.status}`);
    });

    console.log('\n🎉 Models population completed successfully!');
    console.log('💡 You can now refresh your admin panel to see the models.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

populateModels(); 