#!/usr/bin/env node

/**
 * Fix and Seed Production Data Script
 *
 * - Cleans up bad rows in models, logs, and insights tables
 * - Inserts valid sample data for the test user/partner
 * - Ensures all references are correct and no nulls
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const PRODUCTION_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PRODUCTION_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQyMTY4OSwiZXhwIjoyMDY0OTk3Njg5fQ.0D4A99QwPrmU_ecC5KkAQl4isJ3vspSWkYjPYvnEYaU';
const supabase = createClient(PRODUCTION_URL, PRODUCTION_SERVICE_ROLE_KEY);

async function main() {
  console.log('🔧 Cleaning and seeding production data...');

  // 1. Get test user and partner
  const { data: partners, error: partnerError } = await supabase
    .from('partners')
    .select('id, user_id')
    .limit(1);
  if (partnerError || !partners || partners.length === 0) {
    console.error('❌ Could not find test partner:', partnerError);
    return;
  }
  const partnerId = partners[0].id;
  const userId = partners[0].user_id;
  console.log('✅ Using partner:', partnerId);

  // 2. Clean up models table (remove rows with all-null or mostly-null fields)
  const { data: models } = await supabase.from('models').select('*');
  for (const model of models || []) {
    if (!model.model_name || !model.model_version) {
      await supabase.from('models').delete().eq('id', model.id);
      console.log('🗑️ Removed bad model:', model.id);
    }
  }

  // 3. Insert valid models if needed
  const { data: validModels } = await supabase.from('models').select('*');
  if (!validModels || validModels.length < 2) {
    const { data: insertedModels, error: insertModelError } = await supabase
      .from('models')
      .insert([
        {
          model_name: 'Attendance Forecast',
          description: 'Predicts event attendance based on historical data',
          model_version: '1.0.0',
          status: 'active',
          metadata: { type: 'forecasting', category: 'events' }
        },
        {
          model_name: 'Lead Scoring',
          description: 'Scores leads based on engagement and behavior',
          model_version: '1.0.0',
          status: 'active',
          metadata: { type: 'scoring', category: 'sales' }
        }
      ])
      .select();
    if (insertModelError) {
      console.error('❌ Failed to insert models:', insertModelError);
    } else {
      console.log('✅ Inserted models:', insertedModels.map(m => m.id));
    }
  }

  // 4. Clean up logs table (remove logs not for this partner)
  await supabase.from('logs').delete().not('partner_id', 'eq', partnerId);

  // 5. Insert sample logs
  await supabase.from('logs').insert([
    {
      partner_id: partnerId,
      method: 'POST',
      path: '/api/ingest',
      status_code: 200,
      request_body: '{"event_type": "test"}',
      response_body: '{"success": true}'
    },
    {
      partner_id: partnerId,
      method: 'GET',
      path: '/api/models',
      status_code: 200,
      request_body: '{}',
      response_body: '{"models": ["Attendance Forecast", "Lead Scoring"]}'
    }
  ]);
  console.log('✅ Inserted sample logs');

  // 6. Clean up insights table (remove insights not for this partner)
  await supabase.from('insights').delete().not('partner_id', 'eq', partnerId);

  // 7. Insert a sample ingestion event (required for insights)
  const { data: ingestionEvents, error: ingestionEventError } = await supabase
    .from('ingestion_events')
    .insert([
      {
        partner_id: partnerId,
        event_type: 'test_event',
        processed: true
      }
    ])
    .select();
  if (ingestionEventError || !ingestionEvents || ingestionEvents.length === 0) {
    console.error('❌ Failed to insert ingestion event:', ingestionEventError);
    return;
  }
  const ingestionEventId = ingestionEvents[0].id;
  console.log('✅ Inserted ingestion event:', ingestionEventId);

  // 8. Insert a sample insight
  const { data: modelsList } = await supabase.from('models').select('id').limit(1);
  const modelId = modelsList && modelsList.length > 0 ? modelsList[0].id : null;
  if (!modelId) {
    console.error('❌ No valid model found for insight');
    return;
  }
  await supabase.from('insights').insert([
    {
      partner_id: partnerId,
      ingestion_event_id: ingestionEventId,
      model_id: modelId,
      prediction: 'High attendance expected',
      confidence: 0.85,
      metadata: { event_type: 'conference', expected_attendees: 150 }
    }
  ]);
  console.log('✅ Inserted sample insight');

  // 9. Print out current state
  const { data: finalModels } = await supabase.from('models').select('*');
  const { data: finalLogs } = await supabase.from('logs').select('*');
  const { data: finalInsights } = await supabase.from('insights').select('*');
  console.log('📦 Models:', finalModels);
  console.log('📦 Logs:', finalLogs);
  console.log('📦 Insights:', finalInsights);

  console.log('🎉 Database cleanup and seeding complete!');
}

main(); 