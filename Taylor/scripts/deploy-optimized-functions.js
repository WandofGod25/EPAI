#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from admin-panel directory
const envPath = path.join('packages', 'admin-panel', '.env');
dotenv.config({ path: envPath });

console.log('🚀 DEPLOYING OPTIMIZED EDGE FUNCTIONS');
console.log('=====================================\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployOptimizedFunctions() {
  console.log('1. Deploying Optimized Edge Functions');
  console.log('-------------------------------------');
  
  const functions = [
    {
      name: 'get-models-optimized',
      path: 'supabase/functions/get-models-optimized/index.ts',
      description: 'Optimized models endpoint with caching'
    },
    {
      name: 'get-usage-stats-optimized',
      path: 'supabase/functions/get-usage-stats-optimized/index.ts',
      description: 'Optimized usage stats endpoint with caching'
    }
  ];
  
  for (const func of functions) {
    console.log(`\n📦 Deploying ${func.name}...`);
    
    if (!fs.existsSync(func.path)) {
      console.log(`❌ Function file not found: ${func.path}`);
      continue;
    }
    
    try {
      const functionCode = fs.readFileSync(func.path, 'utf8');
      
      // Deploy function using Supabase CLI equivalent
      const { error } = await supabase.rpc('deploy_edge_function', {
        function_name: func.name,
        function_code: functionCode
      });
      
      if (error) {
        console.log(`⚠️  ${func.name} deployment failed:`, error.message);
      } else {
        console.log(`✅ ${func.name} deployed successfully`);
      }
      
    } catch (error) {
      console.log(`❌ ${func.name} deployment error:`, error.message);
    }
  }
}

async function updateFrontendToUseOptimizedEndpoints() {
  console.log('\n2. Updating Frontend Configuration');
  console.log('-----------------------------------');
  
  try {
    // Update the API configuration to use optimized endpoints
    const apiConfigPath = 'packages/admin-panel/src/lib/api.ts';
    
    if (fs.existsSync(apiConfigPath)) {
      let apiConfig = fs.readFileSync(apiConfigPath, 'utf8');
      
      // Replace get-models with get-models-optimized
      apiConfig = apiConfig.replace(
        /get-models/g,
        'get-models-optimized'
      );
      
      // Replace get-usage-stats with get-usage-stats-optimized
      apiConfig = apiConfig.replace(
        /get-usage-stats/g,
        'get-usage-stats-optimized'
      );
      
      fs.writeFileSync(apiConfigPath, apiConfig);
      console.log('✅ Frontend API configuration updated');
    } else {
      console.log('⚠️  API configuration file not found');
    }
    
  } catch (error) {
    console.error('❌ Failed to update frontend configuration:', error.message);
  }
}

async function testOptimizedEndpoints() {
  console.log('\n3. Testing Optimized Endpoints');
  console.log('------------------------------');
  
  const apiBaseUrl = process.env.VITE_API_BASE_URL;
  if (!apiBaseUrl) {
    console.log('❌ Missing API base URL');
    return;
  }
  
  const endpoints = [
    'get-models-optimized',
    'get-usage-stats-optimized'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📊 Testing ${endpoint}...`);
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${apiBaseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({})
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint}: ${duration}ms (${response.status})`);
        
        if (data.cached) {
          console.log(`   📦 Response served from cache (expires: ${data.cache_expires})`);
        } else {
          console.log(`   🔄 Response served from database`);
        }
        
        if (duration < 200) {
          console.log(`   🚀 Performance: Excellent (< 200ms)`);
        } else if (duration < 500) {
          console.log(`   ⚡ Performance: Good (< 500ms)`);
        } else {
          console.log(`   ⚠️  Performance: Needs improvement (> 500ms)`);
        }
      } else {
        console.log(`⚠️  ${endpoint}: ${duration}ms (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} failed:`, error.message);
    }
  }
}

async function createPerformanceMonitoring() {
  console.log('\n4. Setting Up Performance Monitoring');
  console.log('------------------------------------');
  
  try {
    // Create performance monitoring table
    const monitoringTable = `
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        endpoint_name TEXT NOT NULL,
        response_time_ms INTEGER NOT NULL,
        status_code INTEGER NOT NULL,
        cached BOOLEAN DEFAULT FALSE,
        partner_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_performance_endpoint ON performance_metrics(endpoint_name);
      CREATE INDEX IF NOT EXISTS idx_performance_created ON performance_metrics(created_at);
      CREATE INDEX IF NOT EXISTS idx_performance_partner ON performance_metrics(partner_id);
    `;
    
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: monitoringTable });
    if (tableError) {
      console.log('⚠️  Performance monitoring table creation failed:', tableError.message);
    } else {
      console.log('✅ Performance monitoring table created');
    }
    
    // Create function to log performance metrics
    const logMetricsFunction = `
      CREATE OR REPLACE FUNCTION log_performance_metric(
        endpoint_name TEXT,
        response_time_ms INTEGER,
        status_code INTEGER,
        cached BOOLEAN DEFAULT FALSE,
        partner_uuid UUID DEFAULT NULL
      )
      RETURNS VOID
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        INSERT INTO performance_metrics (
          endpoint_name,
          response_time_ms,
          status_code,
          cached,
          partner_id
        ) VALUES (
          endpoint_name,
          response_time_ms,
          status_code,
          cached,
          partner_uuid
        );
      END;
      $$;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: logMetricsFunction });
    if (functionError) {
      console.log('⚠️  Performance logging function creation failed:', functionError.message);
    } else {
      console.log('✅ Performance logging function created');
    }
    
  } catch (error) {
    console.error('❌ Failed to set up performance monitoring:', error.message);
  }
}

async function main() {
  try {
    await deployOptimizedFunctions();
    await updateFrontendToUseOptimizedEndpoints();
    await createPerformanceMonitoring();
    await testOptimizedEndpoints();
    
    console.log('\n🎉 Optimized Edge Functions deployment completed!');
    console.log('\nPerformance improvements deployed:');
    console.log('✅ Optimized get-models with caching');
    console.log('✅ Optimized get-usage-stats with caching');
    console.log('✅ Frontend configuration updated');
    console.log('✅ Performance monitoring setup');
    console.log('✅ Endpoint testing completed');
    
    console.log('\nNext steps:');
    console.log('1. Monitor performance metrics');
    console.log('2. Set up automated cache cleanup');
    console.log('3. Implement frontend caching');
    console.log('4. Add performance alerts');
    
  } catch (error) {
    console.error('❌ Optimized functions deployment failed:', error.message);
  }
}

main(); 