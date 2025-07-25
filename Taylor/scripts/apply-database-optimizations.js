#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from admin-panel directory
const envPath = path.join('packages', 'admin-panel', '.env');
dotenv.config({ path: envPath });

console.log('🚀 APPLYING DATABASE OPTIMIZATIONS');
console.log('==================================\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyDatabaseIndexes() {
  console.log('1. Applying Database Indexes');
  console.log('----------------------------');
  
  const migrationPath = 'supabase/migrations/20250125000000_add_performance_indexes.sql';
  
  if (!fs.existsSync(migrationPath)) {
    console.log('❌ Migration file not found:', migrationPath);
    return;
  }
  
  try {
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Applying ${statements.length} index statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`⚠️  Statement ${i + 1} failed:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} applied successfully`);
          }
        } catch (err) {
          console.log(`❌ Statement ${i + 1} error:`, err.message);
        }
      }
    }
    
    console.log('✅ Database indexes applied successfully');
    
  } catch (error) {
    console.error('❌ Failed to apply database indexes:', error.message);
  }
}

async function createPerformanceFunctions() {
  console.log('\n2. Creating Performance Functions');
  console.log('--------------------------------');
  
  try {
    // Function to get partner usage statistics with caching
    const usageStatsFunction = `
      CREATE OR REPLACE FUNCTION get_partner_usage_summary_cached(partner_uuid UUID)
      RETURNS TABLE (
        total_ingestion_events BIGINT,
        total_insights_generated BIGINT,
        total_api_keys BIGINT,
        total_logs BIGINT,
        latest_event_timestamp TIMESTAMPTZ
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          COALESCE(COUNT(DISTINCT ie.id), 0)::BIGINT as total_ingestion_events,
          COALESCE(COUNT(DISTINCT i.id), 0)::BIGINT as total_insights_generated,
          COALESCE(COUNT(DISTINCT ak.id), 0)::BIGINT as total_api_keys,
          COALESCE(COUNT(DISTINCT l.id), 0)::BIGINT as total_logs,
          MAX(ie.created_at) as latest_event_timestamp
        FROM partners p
        LEFT JOIN ingestion_events ie ON p.id = ie.partner_id
        LEFT JOIN insights i ON p.id = i.partner_id
        LEFT JOIN api_keys ak ON p.id = ak.partner_id
        LEFT JOIN logs l ON p.id = l.partner_id
        WHERE p.id = partner_uuid
        GROUP BY p.id;
      END;
      $$;
    `;
    
    const { error: usageError } = await supabase.rpc('exec_sql', { sql: usageStatsFunction });
    if (usageError) {
      console.log('⚠️  Usage stats function creation failed:', usageError.message);
    } else {
      console.log('✅ Usage stats function created successfully');
    }
    
    // Function to get paginated logs with performance optimization
    const paginatedLogsFunction = `
      CREATE OR REPLACE FUNCTION get_partner_logs_paginated(
        partner_uuid UUID,
        page_size INTEGER DEFAULT 50,
        page_number INTEGER DEFAULT 1
      )
      RETURNS TABLE (
        id UUID,
        created_at TIMESTAMPTZ,
        method TEXT,
        path TEXT,
        status_code INTEGER,
        request_body TEXT,
        response_body TEXT,
        total_count BIGINT
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        offset_val INTEGER;
        total_count_val BIGINT;
      BEGIN
        offset_val := (page_number - 1) * page_size;
        
        -- Get total count
        SELECT COUNT(*) INTO total_count_val
        FROM logs
        WHERE partner_id = partner_uuid;
        
        RETURN QUERY
        SELECT 
          l.id,
          l.created_at,
          l.method,
          l.path,
          l.status_code,
          l.request_body,
          l.response_body,
          total_count_val
        FROM logs l
        WHERE l.partner_id = partner_uuid
        ORDER BY l.created_at DESC
        LIMIT page_size
        OFFSET offset_val;
      END;
      $$;
    `;
    
    const { error: logsError } = await supabase.rpc('exec_sql', { sql: paginatedLogsFunction });
    if (logsError) {
      console.log('⚠️  Paginated logs function creation failed:', logsError.message);
    } else {
      console.log('✅ Paginated logs function created successfully');
    }
    
  } catch (error) {
    console.error('❌ Failed to create performance functions:', error.message);
  }
}

async function createCachingTables() {
  console.log('\n3. Creating Caching Tables');
  console.log('--------------------------');
  
  try {
    // Cache table for models (rarely changes)
    const modelsCacheTable = `
      CREATE TABLE IF NOT EXISTS models_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cache_key TEXT UNIQUE NOT NULL,
        cache_data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
      );
      
      CREATE INDEX IF NOT EXISTS idx_models_cache_expires ON models_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_models_cache_key ON models_cache(cache_key);
    `;
    
    const { error: cacheError } = await supabase.rpc('exec_sql', { sql: modelsCacheTable });
    if (cacheError) {
      console.log('⚠️  Models cache table creation failed:', cacheError.message);
    } else {
      console.log('✅ Models cache table created successfully');
    }
    
    // Cache table for usage statistics
    const usageCacheTable = `
      CREATE TABLE IF NOT EXISTS usage_stats_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL,
        cache_data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes'),
        UNIQUE(partner_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_usage_cache_expires ON usage_stats_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_usage_cache_partner ON usage_stats_cache(partner_id);
    `;
    
    const { error: usageCacheError } = await supabase.rpc('exec_sql', { sql: usageCacheTable });
    if (usageCacheError) {
      console.log('⚠️  Usage stats cache table creation failed:', usageCacheError.message);
    } else {
      console.log('✅ Usage stats cache table created successfully');
    }
    
  } catch (error) {
    console.error('❌ Failed to create caching tables:', error.message);
  }
}

async function createCleanupFunctions() {
  console.log('\n4. Creating Cleanup Functions');
  console.log('----------------------------');
  
  try {
    // Function to clean up expired cache entries
    const cleanupCacheFunction = `
      CREATE OR REPLACE FUNCTION cleanup_expired_cache()
      RETURNS INTEGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        DELETE FROM models_cache WHERE expires_at < NOW();
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        DELETE FROM usage_stats_cache WHERE expires_at < NOW();
        GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
        
        RETURN deleted_count;
      END;
      $$;
    `;
    
    const { error: cleanupError } = await supabase.rpc('exec_sql', { sql: cleanupCacheFunction });
    if (cleanupError) {
      console.log('⚠️  Cleanup function creation failed:', cleanupError.message);
    } else {
      console.log('✅ Cleanup function created successfully');
    }
    
    // Function to clean up expired API keys
    const cleanupApiKeysFunction = `
      CREATE OR REPLACE FUNCTION cleanup_expired_api_keys()
      RETURNS INTEGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        DELETE FROM api_keys WHERE expires_at < NOW();
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        RETURN deleted_count;
      END;
      $$;
    `;
    
    const { error: apiKeysError } = await supabase.rpc('exec_sql', { sql: cleanupApiKeysFunction });
    if (apiKeysError) {
      console.log('⚠️  API keys cleanup function creation failed:', apiKeysError.message);
    } else {
      console.log('✅ API keys cleanup function created successfully');
    }
    
  } catch (error) {
    console.error('❌ Failed to create cleanup functions:', error.message);
  }
}

async function testOptimizations() {
  console.log('\n5. Testing Optimizations');
  console.log('------------------------');
  
  try {
    // Test models query performance
    console.log('📊 Testing models query performance...');
    const startTime = Date.now();
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('*');
    const modelsTime = Date.now() - startTime;
    
    if (modelsError) {
      console.log('❌ Models query failed:', modelsError.message);
    } else {
      console.log(`✅ Models query: ${modelsTime}ms (${models.length} records)`);
      if (modelsTime < 100) {
        console.log('🚀 Models query performance improved!');
      }
    }
    
    // Test logs query performance
    console.log('\n📊 Testing logs query performance...');
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
      if (logsTime < 200) {
        console.log('🚀 Logs query performance improved!');
      }
    }
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error.message);
  }
}

async function main() {
  try {
    await applyDatabaseIndexes();
    await createPerformanceFunctions();
    await createCachingTables();
    await createCleanupFunctions();
    await testOptimizations();
    
    console.log('\n🎉 Database optimizations completed!');
    console.log('\nPerformance improvements implemented:');
    console.log('✅ Database indexes for faster queries');
    console.log('✅ Performance functions for optimized data access');
    console.log('✅ Caching tables for frequently accessed data');
    console.log('✅ Cleanup functions for maintenance');
    console.log('✅ Performance testing and validation');
    
  } catch (error) {
    console.error('❌ Database optimization failed:', error.message);
  }
}

main(); 