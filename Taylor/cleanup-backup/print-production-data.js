#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const PRODUCTION_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PRODUCTION_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQyMTY4OSwiZXhwIjoyMDY0OTk3Njg5fQ.0D4A99QwPrmU_ecC5KkAQl4isJ3vspSWkYjPYvnEYaU';
const supabase = createClient(PRODUCTION_URL, PRODUCTION_SERVICE_ROLE_KEY);

async function main() {
  // Get test partner
  const { data: partners } = await supabase.from('partners').select('id').limit(1);
  if (!partners || partners.length === 0) {
    console.error('❌ No partner found');
    return;
  }
  const partnerId = partners[0].id;

  // Print models
  const { data: models } = await supabase.from('models').select('*');
  console.log('📦 Models:', models);

  // Print logs for this partner
  const { data: logs } = await supabase.from('logs').select('*').eq('partner_id', partnerId);
  console.log('📦 Logs:', logs);

  // Print insights for this partner
  const { data: insights } = await supabase.from('insights').select('*').eq('partner_id', partnerId);
  console.log('📦 Insights:', insights);
}

main(); 