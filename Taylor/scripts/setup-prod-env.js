#!/usr/bin/env node

/**
 * EPAI Production Environment Setup Script
 * 
 * This script helps set up a production environment for the EPAI platform.
 * It performs the following tasks:
 * 1. Analyzes current database usage to recommend a suitable Supabase tier
 * 2. Sets up environment variables for production
 * 3. Configures security settings for production
 * 4. Creates a checklist for manual steps
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  outputDir: path.join(process.cwd(), 'prod-setup'),
};

// Check if required environment variables are set
if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.');
  console.error('Please run:');
  console.error('  export SUPABASE_URL=your_supabase_url');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper function to write to file
function writeToFile(filename, content) {
  const filePath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filePath, content);
  console.log(`File written: ${filePath}`);
}

// Analyze database usage
async function analyzeDatabaseUsage() {
  console.log('Analyzing database usage...');
  
  try {
    // Get table sizes
    const { data: tableSizes, error: tableSizesError } = await supabase.rpc('get_table_sizes');
    
    if (tableSizesError) {
      console.error('Error getting table sizes:', tableSizesError);
      return null;
    }
    
    // Get row counts
    const { data: rowCounts, error: rowCountsError } = await supabase.rpc('get_row_counts');
    
    if (rowCountsError) {
      console.error('Error getting row counts:', rowCountsError);
      return null;
    }
    
    // Calculate total database size
    const totalSize = tableSizes.reduce((sum, table) => sum + table.size_bytes, 0);
    
    // Format results
    const tables = tableSizes.map(table => {
      const rowCount = rowCounts.find(r => r.table_name === table.table_name)?.row_count || 0;
      return {
        table_name: table.table_name,
        size_bytes: table.size_bytes,
        size_formatted: formatBytes(table.size_bytes),
        row_count: rowCount,
      };
    });
    
    return {
      tables,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
    };
  } catch (error) {
    console.error('Error analyzing database usage:', error);
    return null;
  }
}

// Recommend Supabase tier
function recommendSupabaseTier(dbUsage) {
  // Supabase tiers (as of July 2024)
  const tiers = [
    { name: 'Free', storage: 500 * 1024 * 1024, cost: 0 },
    { name: 'Pro', storage: 8 * 1024 * 1024 * 1024, cost: 25 },
    { name: 'Team', storage: 100 * 1024 * 1024 * 1024, cost: 599 },
  ];
  
  // Find suitable tier
  let recommendedTier = tiers[0];
  for (const tier of tiers) {
    if (dbUsage.totalSize <= tier.storage) {
      recommendedTier = tier;
      break;
    }
  }
  
  // Calculate storage usage percentage
  const usagePercentage = (dbUsage.totalSize / recommendedTier.storage) * 100;
  
  return {
    tier: recommendedTier,
    usagePercentage: usagePercentage.toFixed(2),
  };
}

// Generate environment variables for production
function generateEnvVars() {
  const envVars = {
    // Core configuration
    SUPABASE_URL: 'https://your-prod-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key',
    
    // Security settings
    CORS_ALLOWED_ORIGINS: 'https://admin.yourdomain.com,https://api.yourdomain.com',
    API_RATE_LIMIT: '120',
    IP_RATE_LIMIT: '30',
    
    // Monitoring
    ENABLE_DETAILED_LOGGING: 'true',
    LOG_LEVEL: 'info',
    
    // Performance
    EDGE_FUNCTION_MEMORY: '1024',
    DATABASE_POOL_SIZE: '20',
  };
  
  return envVars;
}

// Generate production checklist
function generateProductionChecklist() {
  const checklist = `# EPAI Production Deployment Checklist

## Pre-Deployment

- [ ] Run security audit script
- [ ] Verify all tests are passing
- [ ] Review API rate limits
- [ ] Check database indexes
- [ ] Validate environment variables

## Supabase Setup

- [ ] Create production project in Supabase
- [ ] Configure authentication settings
  - [ ] Set up email templates
  - [ ] Configure password policies
  - [ ] Set up authorized redirect URLs
- [ ] Apply database migrations
- [ ] Set up database backup schedule
- [ ] Configure row level security policies
- [ ] Deploy Edge Functions

## Frontend Deployment

- [ ] Build production assets
- [ ] Configure CDN
- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Test admin panel login flow

## Monitoring & Alerting

- [ ] Set up error tracking
- [ ] Configure performance monitoring
- [ ] Set up alerts for:
  - [ ] High error rates
  - [ ] Slow database queries
  - [ ] API rate limit breaches
  - [ ] Authentication failures

## Security

- [ ] Enable MFA for admin accounts
- [ ] Configure IP allowlisting for admin panel
- [ ] Set up audit logging
- [ ] Configure CORS settings
- [ ] Review API key expiration policies

## Post-Deployment

- [ ] Verify all endpoints are working
- [ ] Test SDK integration
- [ ] Monitor initial usage
- [ ] Document production environment
`;

  return checklist;
}

// Generate database helper functions for production
function generateDatabaseHelperFunctions() {
  const sql = `-- Database helper functions for production monitoring

-- Function to get table sizes
CREATE OR REPLACE FUNCTION public.get_table_sizes()
RETURNS TABLE(table_name text, size_bytes bigint) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname::text,
    pg_total_relation_size(c.oid)::bigint
  FROM
    pg_class c
  JOIN
    pg_namespace n ON n.oid = c.relnamespace
  WHERE
    n.nspname = 'public'
    AND c.relkind = 'r';
END;
$$;

-- Function to get row counts
CREATE OR REPLACE FUNCTION public.get_row_counts()
RETURNS TABLE(table_name text, row_count bigint) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname::text,
    c.reltuples::bigint
  FROM
    pg_class c
  JOIN
    pg_namespace n ON n.oid = c.relnamespace
  WHERE
    n.nspname = 'public'
    AND c.relkind = 'r';
END;
$$;

-- Function to get slow queries
CREATE OR REPLACE FUNCTION public.get_slow_queries(p_min_time_ms integer DEFAULT 100)
RETURNS TABLE(
  query text,
  total_time_ms numeric,
  mean_time_ms numeric,
  calls bigint,
  rows bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    query,
    total_time,
    mean_time,
    calls,
    rows
  FROM
    pg_stat_statements
  WHERE
    mean_time > p_min_time_ms
  ORDER BY
    mean_time DESC
  LIMIT 20;
END;
$$;

-- Function to get database stats
CREATE OR REPLACE FUNCTION public.get_db_stats()
RETURNS TABLE(
  stat_name text,
  stat_value text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  
  -- Database size
  SELECT 'database_size', pg_size_pretty(pg_database_size(current_database()));
  
  -- Connection count
  SELECT 'active_connections', count(*)::text
  FROM pg_stat_activity
  WHERE state = 'active';
  
  -- Transaction count
  SELECT 'transactions', sum(xact_commit + xact_rollback)::text
  FROM pg_stat_database
  WHERE datname = current_database();
  
  -- Cache hit ratio
  SELECT 'cache_hit_ratio',
    CASE WHEN sum(heap_blks_hit) + sum(heap_blks_read) = 0
      THEN '0'
      ELSE round(100 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)), 2)::text
    END
  FROM pg_statio_user_tables;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_table_sizes() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_row_counts() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_slow_queries(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_db_stats() TO service_role;
`;

  return sql;
}

// Main function
async function main() {
  console.log('EPAI Production Environment Setup');
  console.log('=================================');
  
  // Create output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  // Step 1: Analyze database usage
  console.log('\nStep 1: Analyzing database usage...');
  
  try {
    // First check if helper functions exist, if not create them
    const { data: functionExists, error: functionError } = await supabase.rpc('get_table_sizes')
      .catch(() => ({ data: null, error: { message: 'Function does not exist' } }));
    
    if (functionError && functionError.message.includes('does not exist')) {
      console.log('Creating database helper functions...');
      const helperFunctions = generateDatabaseHelperFunctions();
      
      // Save SQL file
      writeToFile('db-helper-functions.sql', helperFunctions);
      
      console.log('Please run the SQL in db-helper-functions.sql to create the helper functions, then run this script again.');
      process.exit(0);
    }
    
    // Analyze database usage
    const dbUsage = await analyzeDatabaseUsage();
    
    if (!dbUsage) {
      console.error('Failed to analyze database usage.');
      process.exit(1);
    }
    
    // Recommend Supabase tier
    const recommendation = recommendSupabaseTier(dbUsage);
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      databaseUsage: dbUsage,
      recommendation,
    };
    
    // Save report
    writeToFile('database-analysis.json', JSON.stringify(report, null, 2));
    
    // Generate human-readable report
    let readableReport = `# EPAI Database Analysis Report\n\n`;
    readableReport += `Generated: ${new Date().toLocaleString()}\n\n`;
    readableReport += `## Database Size\n\n`;
    readableReport += `Total Size: ${dbUsage.totalSizeFormatted}\n\n`;
    readableReport += `## Table Sizes\n\n`;
    readableReport += `| Table | Size | Rows |\n`;
    readableReport += `|-------|------|------|\n`;
    
    dbUsage.tables.forEach(table => {
      readableReport += `| ${table.table_name} | ${table.size_formatted} | ${table.row_count.toLocaleString()} |\n`;
    });
    
    readableReport += `\n## Recommendation\n\n`;
    readableReport += `Recommended Tier: ${recommendation.tier.name} ($${recommendation.tier.cost}/month)\n`;
    readableReport += `Current Usage: ${recommendation.usagePercentage}% of tier limit\n`;
    
    // Save readable report
    writeToFile('database-analysis.md', readableReport);
    
    console.log(`Database analysis complete. Current size: ${dbUsage.totalSizeFormatted}`);
    console.log(`Recommended tier: ${recommendation.tier.name} ($${recommendation.tier.cost}/month)`);
  } catch (error) {
    console.error('Error analyzing database:', error);
  }
  
  // Step 2: Generate environment variables
  console.log('\nStep 2: Generating environment variables...');
  const envVars = generateEnvVars();
  
  // Save as .env file
  let envFileContent = '# EPAI Production Environment Variables\n\n';
  Object.entries(envVars).forEach(([key, value]) => {
    envFileContent += `${key}=${value}\n`;
  });
  
  writeToFile('.env.production', envFileContent);
  
  // Step 3: Generate production checklist
  console.log('\nStep 3: Generating production checklist...');
  const checklist = generateProductionChecklist();
  writeToFile('production-checklist.md', checklist);
  
  // Step 4: Generate security configuration
  console.log('\nStep 4: Generating security configuration...');
  
  // CORS configuration
  const corsConfig = {
    allowedOrigins: ['https://admin.yourdomain.com', 'https://api.yourdomain.com'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  };
  
  writeToFile('cors-config.json', JSON.stringify(corsConfig, null, 2));
  
  // Rate limiting configuration
  const rateLimitConfig = {
    api: {
      requestsPerMinute: 120,
      burstLimit: 20,
    },
    ip: {
      requestsPerMinute: 30,
      burstLimit: 10,
    },
    auth: {
      maxLoginAttemptsPerHour: 10,
      lockoutPeriodMinutes: 30,
    },
  };
  
  writeToFile('rate-limit-config.json', JSON.stringify(rateLimitConfig, null, 2));
  
  console.log('\nProduction environment setup complete!');
  console.log(`All files have been saved to: ${CONFIG.outputDir}`);
  console.log('\nNext steps:');
  console.log('1. Review the generated files');
  console.log('2. Follow the production checklist');
  console.log('3. Create a new Supabase project for production');
  console.log('4. Apply the environment variables and security configuration');
  
  rl.close();
}

// Run main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 