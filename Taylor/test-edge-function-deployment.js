#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from admin-panel directory
const envPath = path.join('packages', 'admin-panel', '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ Missing Supabase URL');
  process.exit(1);
}

console.log('🔍 Testing Edge Function Deployment...\n');

async function testEdgeFunctionDeployment() {
  const functions = [
    'get-insights',
    'get-models',
    'get-partner-logs',
    'get-usage-stats',
    'api-key-manager'
  ];

  for (const funcName of functions) {
    console.log(`Testing ${funcName}...`);
    
    try {
      // Test if the function endpoint exists
      const response = await fetch(`${supabaseUrl}/functions/v1/${funcName}`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173'
        }
      });

      if (response.status === 204 || response.status === 200) {
        console.log(`  ✅ ${funcName} is deployed and accessible`);
      } else {
        console.log(`  ❌ ${funcName} returned status ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ ${funcName} failed: ${error.message}`);
    }
  }

  console.log('\n🎉 Edge Function deployment test completed!');
}

testEdgeFunctionDeployment(); 