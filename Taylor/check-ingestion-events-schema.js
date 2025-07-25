#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const PRODUCTION_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PRODUCTION_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQyMTY4OSwiZXhwIjoyMDY0OTk3Njg5fQ.0D4A99QwPrmU_ecC5KkAQl4isJ3vspSWkYjPYvnEYaU';
const supabase = createClient(PRODUCTION_URL, PRODUCTION_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('ingestion_events').select('*').limit(1);
  if (error) {
    console.error('❌ Error:', error);
  } else if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    console.log('Sample:', data[0]);
  } else {
    console.log('No data in ingestion_events table.');
  }
}

main(); 