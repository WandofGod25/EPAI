#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from admin-panel directory
const envPath = path.join('packages', 'admin-panel', '.env');
dotenv.config({ path: envPath });

console.log('🔍 PERFORMANCE ANALYSIS');
console.log('======================\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeDatabasePerformance() {
  console.log('1. Database Performance Analysis');
  console.log('--------------------------------');
  
  try {
    // Test query performance for models
    console.log('\n📊 Testing Models Query Performance...');
    const startTime = Date.now();
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('*');
    const modelsTime = Date.now() - startTime;
    
    if (modelsError) {
      console.log('❌ Models query failed:', modelsError.message);
    } else {
      console.log(`✅ Models query: ${modelsTime}ms (${models.length} records)`);
    }
    
    // Test query performance for logs
    console.log('\n📊 Testing Logs Query Performance...');
    const logsStartTime = Date.now();
    const { data: logs, error: logsError } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    const logsTime = Date.now() - logsStartTime;
    
    if (logsError) {
      console.log('❌ Logs query failed:', logsError.message);
    } else {
      console.log(`✅ Logs query: ${logsTime}ms (${logs.length} records)`);
    }
    
    // Test query performance for insights
    console.log('\n📊 Testing Insights Query Performance...');
    const insightsStartTime = Date.now();
    const { data: insights, error: insightsError } = await supabase
      .from('insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    const insightsTime = Date.now() - insightsStartTime;
    
    if (insightsError) {
      console.log('❌ Insights query failed:', insightsError.message);
    } else {
      console.log(`✅ Insights query: ${insightsTime}ms (${insights.length} records)`);
    }
    
    // Performance recommendations
    console.log('\n📈 Performance Recommendations:');
    if (modelsTime > 100) {
      console.log('⚠️  Models query is slow - consider adding indexes');
    }
    if (logsTime > 200) {
      console.log('⚠️  Logs query is slow - consider pagination and indexes');
    }
    if (insightsTime > 150) {
      console.log('⚠️  Insights query is slow - consider adding indexes');
    }
    
  } catch (error) {
    console.error('❌ Database analysis failed:', error.message);
  }
}

async function analyzeAPIEndpoints() {
  console.log('\n2. API Endpoints Performance Analysis');
  console.log('-------------------------------------');
  
  const apiBaseUrl = process.env.VITE_API_BASE_URL;
  if (!apiBaseUrl) {
    console.log('❌ Missing API base URL');
    return;
  }
  
  const endpoints = [
    'get-models',
    'get-insights', 
    'get-partner-logs',
    'get-usage-stats',
    'api-key-manager'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📊 Testing ${endpoint} endpoint...`);
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${apiBaseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({})
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.ok) {
        console.log(`✅ ${endpoint}: ${duration}ms (${response.status})`);
        
        if (duration > 500) {
          console.log(`⚠️  ${endpoint} is slow - consider optimization`);
        }
      } else {
        console.log(`⚠️  ${endpoint}: ${duration}ms (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} failed:`, error.message);
    }
  }
}

async function checkDatabaseIndexes() {
  console.log('\n3. Database Index Analysis');
  console.log('--------------------------');
  
  try {
    // Check for common index patterns
    const tables = ['models', 'logs', 'insights', 'partners', 'api_keys'];
    
    for (const table of tables) {
      console.log(`\n📊 Checking ${table} table...`);
      
      // Test ordering by created_at
      const startTime = Date.now();
      const { data, error } = await supabase
        .from(table)
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      const duration = Date.now() - startTime;
      
      if (error) {
        console.log(`❌ ${table} query failed:`, error.message);
      } else {
        console.log(`✅ ${table} ordering: ${duration}ms`);
        if (duration > 100) {
          console.log(`⚠️  ${table} needs index on created_at`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Index analysis failed:', error.message);
  }
}

async function analyzeCachingOpportunities() {
  console.log('\n4. Caching Analysis');
  console.log('-------------------');
  
  console.log('📊 Identifying caching opportunities:');
  console.log('✅ Models data - good candidate for caching (rarely changes)');
  console.log('✅ Usage statistics - good candidate for caching (can be computed periodically)');
  console.log('⚠️  Logs data - not suitable for caching (real-time data)');
  console.log('⚠️  Insights data - moderate caching potential (depends on update frequency)');
  console.log('⚠️  API keys - not suitable for caching (security sensitive)');
}

async function generateOptimizationPlan() {
  console.log('\n5. Optimization Plan');
  console.log('-------------------');
  
  console.log('🚀 Recommended Optimizations:');
  console.log('');
  console.log('1. Database Indexes:');
  console.log('   - Add index on logs.created_at for faster pagination');
  console.log('   - Add index on insights.created_at for faster queries');
  console.log('   - Add index on partners.id for faster joins');
  console.log('');
  console.log('2. API Optimizations:');
  console.log('   - Implement response caching for get-models');
  console.log('   - Add pagination to get-partner-logs');
  console.log('   - Implement request rate limiting');
  console.log('');
  console.log('3. Frontend Optimizations:');
  console.log('   - Implement data caching in React components');
  console.log('   - Add loading states and error boundaries');
  console.log('   - Optimize bundle size');
  console.log('');
  console.log('4. Monitoring Enhancements:');
  console.log('   - Add performance metrics collection');
  console.log('   - Implement slow query alerts');
  console.log('   - Add API response time monitoring');
}

async function main() {
  try {
    await analyzeDatabasePerformance();
    await analyzeAPIEndpoints();
    await checkDatabaseIndexes();
    await analyzeCachingOpportunities();
    await generateOptimizationPlan();
    
    console.log('\n🎉 Performance analysis completed!');
    console.log('\nNext steps:');
    console.log('1. Implement database indexes');
    console.log('2. Add API response caching');
    console.log('3. Optimize frontend performance');
    console.log('4. Enhance monitoring and alerting');
    
  } catch (error) {
    console.error('❌ Performance analysis failed:', error.message);
  }
}

main(); 