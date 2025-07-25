#!/usr/bin/env node

/**
 * EPAI Production Database Configuration Script
 * 
 * This script helps configure the production database with optimized settings,
 * indexes, and partitioning for high-volume tables.
 * 
 * Usage:
 * node scripts/configure-prod-database.js
 * 
 * Environment variables:
 * SUPABASE_URL - Supabase project URL
 * SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  outputDir: path.join(process.cwd(), 'prod-database-config'),
};

// Check if required environment variables are set
if (!CONFIG.supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable must be set.');
  console.error('Please run:');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Helper function to write to file
function writeToFile(filename, content) {
  const filePath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filePath, content);
  console.log(`File written: ${filePath}`);
  return filePath;
}

// Helper function to ask user for confirmation
function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n) `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Analyze database tables and recommend indexes
 */
async function analyzeTablesAndRecommendIndexes() {
  console.log('Analyzing tables and recommending indexes...');
  
  try {
    // Get table information
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return null;
    }
    
    const tableAnalysis = [];
    
    // Analyze each table
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`Analyzing table: ${tableName}`);
      
      // Get columns
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      if (columnsError) {
        console.error(`Error fetching columns for ${tableName}:`, columnsError);
        continue;
      }
      
      // Get existing indexes
      const { data: indexes, error: indexesError } = await supabase.rpc('get_table_indexes', { 
        p_table_name: tableName 
      }).catch(() => ({ data: null, error: { message: 'Function does not exist' } }));
      
      let existingIndexes = [];
      if (indexesError) {
        console.log('Creating get_table_indexes function...');
        // We'll create this function later
      } else if (indexes) {
        existingIndexes = indexes;
      }
      
      // Recommend indexes based on column types and naming patterns
      const recommendedIndexes = [];
      
      // Common patterns for indexes
      const foreignKeyPattern = /_id$/;
      const timestampPattern = /(_at|date|time)$/;
      const searchPattern = /(name|title|description|email|username)$/;
      
      for (const column of columns) {
        // Skip primary key (already indexed)
        if (column.column_name === 'id') continue;
        
        // Foreign keys
        if (foreignKeyPattern.test(column.column_name)) {
          const indexName = `idx_${tableName}_${column.column_name}`;
          if (!existingIndexes.some(idx => idx.indexname === indexName)) {
            recommendedIndexes.push({
              column: column.column_name,
              type: 'btree',
              reason: 'Foreign key columns should be indexed for join performance',
              priority: 'high'
            });
          }
        }
        
        // Timestamp columns often used in queries
        if (timestampPattern.test(column.column_name)) {
          const indexName = `idx_${tableName}_${column.column_name}`;
          if (!existingIndexes.some(idx => idx.indexname === indexName)) {
            recommendedIndexes.push({
              column: column.column_name,
              type: 'btree',
              reason: 'Timestamp columns are often used in filtering and sorting',
              priority: 'medium'
            });
          }
        }
        
        // Search columns
        if (searchPattern.test(column.column_name)) {
          const indexName = `idx_${tableName}_${column.column_name}`;
          if (!existingIndexes.some(idx => idx.indexname === indexName)) {
            recommendedIndexes.push({
              column: column.column_name,
              type: column.data_type.includes('text') ? 'gin' : 'btree',
              reason: 'Columns likely used for searching should be indexed',
              priority: 'medium'
            });
          }
        }
        
        // Special case for partner_id which is used in many queries
        if (column.column_name === 'partner_id') {
          const indexName = `idx_${tableName}_partner_id`;
          if (!existingIndexes.some(idx => idx.indexname === indexName)) {
            recommendedIndexes.push({
              column: 'partner_id',
              type: 'btree',
              reason: 'partner_id is used in many queries and RLS policies',
              priority: 'high'
            });
          }
        }
      }
      
      tableAnalysis.push({
        tableName,
        columns,
        existingIndexes,
        recommendedIndexes
      });
    }
    
    return tableAnalysis;
  } catch (error) {
    console.error('Error analyzing tables:', error);
    return null;
  }
}

/**
 * Generate SQL for recommended indexes
 */
function generateIndexSQL(tableAnalysis) {
  let sql = '-- Recommended indexes for production database\n\n';
  
  for (const table of tableAnalysis) {
    if (table.recommendedIndexes.length > 0) {
      sql += `-- Indexes for table: ${table.tableName}\n`;
      
      for (const index of table.recommendedIndexes) {
        const indexName = `idx_${table.tableName}_${index.column}`;
        const indexType = index.type === 'gin' ? 'GIN' : 'BTREE';
        
        sql += `-- Priority: ${index.priority}, Reason: ${index.reason}\n`;
        
        if (index.type === 'gin') {
          sql += `CREATE INDEX IF NOT EXISTS ${indexName} ON public.${table.tableName} USING gin (${index.column} gin_trgm_ops);\n`;
        } else {
          sql += `CREATE INDEX IF NOT EXISTS ${indexName} ON public.${table.tableName} (${index.column});\n`;
        }
        
        sql += '\n';
      }
    }
  }
  
  return sql;
}

/**
 * Identify high-volume tables for partitioning
 */
async function identifyHighVolumeTables() {
  console.log('Identifying high-volume tables for partitioning...');
  
  try {
    // Get table row counts
    const { data: rowCounts, error: rowCountsError } = await supabase.rpc('get_table_row_counts');
    
    if (rowCountsError) {
      console.error('Error getting row counts:', rowCountsError);
      return null;
    }
    
    // Sort tables by row count
    const sortedTables = rowCounts.sort((a, b) => b.row_count - a.row_count);
    
    // Identify candidates for partitioning (tables with high row counts)
    const partitionCandidates = sortedTables
      .filter(table => table.row_count > 100000) // Arbitrary threshold
      .map(table => ({
        tableName: table.table_name,
        rowCount: table.row_count,
        partitioningStrategy: determinePartitioningStrategy(table.table_name)
      }));
    
    return partitionCandidates;
  } catch (error) {
    console.error('Error identifying high-volume tables:', error);
    return null;
  }
}

/**
 * Determine appropriate partitioning strategy for a table
 */
function determinePartitioningStrategy(tableName) {
  // Default strategy
  let strategy = {
    type: 'none',
    reason: 'Table does not meet criteria for partitioning'
  };
  
  // Logs and events tables are good candidates for time-based partitioning
  if (['logs', 'security_events', 'ingestion_events'].includes(tableName)) {
    strategy = {
      type: 'range',
      column: 'created_at',
      interval: 'month',
      reason: 'Time-series data with regular cleanup of old data'
    };
  }
  
  // Partner-specific data might benefit from list partitioning by partner
  if (['insights'].includes(tableName)) {
    strategy = {
      type: 'list',
      column: 'partner_id',
      reason: 'Data naturally segmented by partner'
    };
  }
  
  return strategy;
}

/**
 * Generate SQL for table partitioning
 */
function generatePartitioningSQL(partitionCandidates) {
  let sql = '-- Table partitioning for high-volume tables\n\n';
  
  for (const table of partitionCandidates) {
    if (table.partitioningStrategy.type === 'none') continue;
    
    sql += `-- Partitioning for table: ${table.tableName}\n`;
    sql += `-- Strategy: ${table.partitioningStrategy.type} partitioning on ${table.partitioningStrategy.column}\n`;
    sql += `-- Reason: ${table.partitioningStrategy.reason}\n\n`;
    
    // For existing tables, we need to create a new partitioned table and migrate data
    sql += `-- Step 1: Create new partitioned table\n`;
    sql += `CREATE TABLE public.${table.tableName}_partitioned (\n`;
    sql += `  LIKE public.${table.tableName} INCLUDING ALL\n`;
    sql += `) PARTITION BY `;
    
    if (table.partitioningStrategy.type === 'range') {
      sql += `RANGE (${table.partitioningStrategy.column});\n\n`;
      
      // Create partitions
      sql += `-- Step 2: Create partitions\n`;
      sql += `-- Example partitions - adjust dates as needed\n`;
      
      // Generate example partitions for the last 3 months
      const now = new Date();
      for (let i = 0; i < 3; i++) {
        const month = now.getMonth() - i;
        const year = now.getFullYear() + Math.floor(month / 12);
        const adjustedMonth = ((month % 12) + 12) % 12; // Handle negative months
        
        const startDate = new Date(year, adjustedMonth, 1);
        const endDate = new Date(year, adjustedMonth + 1, 1);
        
        const partitionName = `${table.tableName}_${year}_${String(adjustedMonth + 1).padStart(2, '0')}`;
        
        sql += `CREATE TABLE public.${partitionName} PARTITION OF public.${table.tableName}_partitioned\n`;
        sql += `  FOR VALUES FROM ('${startDate.toISOString()}') TO ('${endDate.toISOString()}');\n`;
      }
      
      // Default partition for older data
      sql += `CREATE TABLE public.${table.tableName}_default PARTITION OF public.${table.tableName}_partitioned DEFAULT;\n\n`;
    } else if (table.partitioningStrategy.type === 'list') {
      sql += `LIST (${table.partitioningStrategy.column});\n\n`;
      
      // For list partitioning, we'd need to know the actual partner IDs
      sql += `-- Step 2: Create partitions\n`;
      sql += `-- Example partitions - replace with actual partner IDs\n`;
      sql += `-- CREATE TABLE public.${table.tableName}_partner_1 PARTITION OF public.${table.tableName}_partitioned\n`;
      sql += `--   FOR VALUES IN ('partner-id-1');\n`;
      sql += `-- CREATE TABLE public.${table.tableName}_partner_2 PARTITION OF public.${table.tableName}_partitioned\n`;
      sql += `--   FOR VALUES IN ('partner-id-2');\n`;
      sql += `CREATE TABLE public.${table.tableName}_default PARTITION OF public.${table.tableName}_partitioned DEFAULT;\n\n`;
    }
    
    // Migration steps
    sql += `-- Step 3: Migrate data (consider doing this in batches for large tables)\n`;
    sql += `-- INSERT INTO public.${table.tableName}_partitioned SELECT * FROM public.${table.tableName};\n\n`;
    
    sql += `-- Step 4: Rename tables\n`;
    sql += `-- BEGIN;\n`;
    sql += `--   ALTER TABLE public.${table.tableName} RENAME TO ${table.tableName}_old;\n`;
    sql += `--   ALTER TABLE public.${table.tableName}_partitioned RENAME TO ${table.tableName};\n`;
    sql += `-- COMMIT;\n\n`;
    
    sql += `-- Step 5: Drop old table when safe\n`;
    sql += `-- DROP TABLE public.${table.tableName}_old;\n\n`;
  }
  
  return sql;
}

/**
 * Generate database maintenance procedures
 */
function generateMaintenanceProcedures() {
  let sql = '-- Database maintenance procedures\n\n';
  
  // Vacuum procedure
  sql += `-- Regular VACUUM procedure\n`;
  sql += `CREATE OR REPLACE PROCEDURE public.maintenance_vacuum()\n`;
  sql += `LANGUAGE plpgsql\n`;
  sql += `AS $$\n`;
  sql += `BEGIN\n`;
  sql += `  -- Vacuum analyze all tables\n`;
  sql += `  VACUUM ANALYZE;\n`;
  sql += `END;\n`;
  sql += `$$;\n\n`;
  
  // Reindex procedure
  sql += `-- Regular REINDEX procedure\n`;
  sql += `CREATE OR REPLACE PROCEDURE public.maintenance_reindex()\n`;
  sql += `LANGUAGE plpgsql\n`;
  sql += `AS $$\n`;
  sql += `DECLARE\n`;
  sql += `  v_row record;\n`;
  sql += `BEGIN\n`;
  sql += `  -- Reindex all indexes\n`;
  sql += `  FOR v_row IN SELECT indexname FROM pg_indexes WHERE schemaname = 'public' LOOP\n`;
  sql += `    EXECUTE 'REINDEX INDEX ' || v_row.indexname;\n`;
  sql += `  END LOOP;\n`;
  sql += `END;\n`;
  sql += `$$;\n\n`;
  
  // Create partition maintenance procedure for time-based partitioned tables
  sql += `-- Procedure to create new partitions for time-partitioned tables\n`;
  sql += `CREATE OR REPLACE PROCEDURE public.maintenance_create_partitions()\n`;
  sql += `LANGUAGE plpgsql\n`;
  sql += `AS $$\n`;
  sql += `DECLARE\n`;
  sql += `  v_next_month date;\n`;
  sql += `  v_month_after date;\n`;
  sql += `  v_partition_name text;\n`;
  sql += `BEGIN\n`;
  sql += `  -- Calculate next month\n`;
  sql += `  v_next_month := date_trunc('month', now()) + interval '1 month';\n`;
  sql += `  v_month_after := v_next_month + interval '1 month';\n\n`;
  
  // For each partitioned table, create next month's partition if it doesn't exist
  sql += `  -- Create partitions for logs table\n`;
  sql += `  v_partition_name := 'logs_' || to_char(v_next_month, 'YYYY_MM');\n`;
  sql += `  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = v_partition_name) THEN\n`;
  sql += `    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.logs\n`;
  sql += `      FOR VALUES FROM (%L) TO (%L)', \n`;
  sql += `      v_partition_name, v_next_month, v_month_after);\n`;
  sql += `  END IF;\n\n`;
  
  sql += `  -- Create partitions for security_events table\n`;
  sql += `  v_partition_name := 'security_events_' || to_char(v_next_month, 'YYYY_MM');\n`;
  sql += `  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = v_partition_name) THEN\n`;
  sql += `    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.security_events\n`;
  sql += `      FOR VALUES FROM (%L) TO (%L)', \n`;
  sql += `      v_partition_name, v_next_month, v_month_after);\n`;
  sql += `  END IF;\n\n`;
  
  sql += `  -- Create partitions for ingestion_events table\n`;
  sql += `  v_partition_name := 'ingestion_events_' || to_char(v_next_month, 'YYYY_MM');\n`;
  sql += `  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = v_partition_name) THEN\n`;
  sql += `    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.ingestion_events\n`;
  sql += `      FOR VALUES FROM (%L) TO (%L)', \n`;
  sql += `      v_partition_name, v_next_month, v_month_after);\n`;
  sql += `  END IF;\n`;
  sql += `END;\n`;
  sql += `$$;\n\n`;
  
  // Create function to get table indexes (used by the analysis)
  sql += `-- Function to get indexes for a table\n`;
  sql += `CREATE OR REPLACE FUNCTION public.get_table_indexes(p_table_name text)\n`;
  sql += `RETURNS TABLE (\n`;
  sql += `  tablename text,\n`;
  sql += `  indexname text,\n`;
  sql += `  indexdef text\n`;
  sql += `)\n`;
  sql += `SECURITY DEFINER\n`;
  sql += `SET search_path = public\n`;
  sql += `LANGUAGE plpgsql\n`;
  sql += `AS $$\n`;
  sql += `BEGIN\n`;
  sql += `  RETURN QUERY\n`;
  sql += `  SELECT\n`;
  sql += `    t.tablename::text,\n`;
  sql += `    t.indexname::text,\n`;
  sql += `    t.indexdef::text\n`;
  sql += `  FROM\n`;
  sql += `    pg_indexes t\n`;
  sql += `  WHERE\n`;
  sql += `    t.schemaname = 'public'\n`;
  sql += `    AND t.tablename = p_table_name;\n`;
  sql += `END;\n`;
  sql += `$$;\n\n`;
  
  // Grant permissions
  sql += `-- Grant permissions\n`;
  sql += `GRANT EXECUTE ON PROCEDURE public.maintenance_vacuum() TO service_role;\n`;
  sql += `GRANT EXECUTE ON PROCEDURE public.maintenance_reindex() TO service_role;\n`;
  sql += `GRANT EXECUTE ON PROCEDURE public.maintenance_create_partitions() TO service_role;\n`;
  sql += `GRANT EXECUTE ON FUNCTION public.get_table_indexes(text) TO service_role;\n`;
  
  return sql;
}

/**
 * Generate connection pool configuration
 */
function generateConnectionPoolConfig() {
  const config = {
    pool_mode: 'transaction',
    max_client_conn: 100,
    default_pool_size: 20,
    min_pool_size: 5,
    reserve_pool_size: 5,
    reserve_pool_timeout: 3,
    max_db_connections: 0,
    max_user_connections: 0,
    server_reset_query: 'DISCARD ALL',
    server_reset_query_always: 0,
    application_name_add_host: 1
  };
  
  let configFile = '# PgBouncer configuration for production\n\n';
  configFile += '[databases]\n';
  configFile += '* = host=localhost port=5432\n\n';
  configFile += '[pgbouncer]\n';
  
  for (const [key, value] of Object.entries(config)) {
    configFile += `${key} = ${value}\n`;
  }
  
  return configFile;
}

/**
 * Main function
 */
async function main() {
  console.log('EPAI Production Database Configuration');
  console.log('=====================================');
  
  try {
    // Step 1: Analyze tables and recommend indexes
    console.log('\nStep 1: Analyzing tables and recommending indexes...');
    const tableAnalysis = await analyzeTablesAndRecommendIndexes();
    
    if (!tableAnalysis) {
      console.error('Failed to analyze tables.');
    } else {
      const indexSQL = generateIndexSQL(tableAnalysis);
      const indexSQLPath = writeToFile('recommended-indexes.sql', indexSQL);
      
      // Step 2: Identify high-volume tables for partitioning
      console.log('\nStep 2: Identifying high-volume tables for partitioning...');
      const partitionCandidates = await identifyHighVolumeTables();
      
      if (!partitionCandidates) {
        console.error('Failed to identify high-volume tables.');
      } else {
        const partitioningSQL = generatePartitioningSQL(partitionCandidates);
        const partitioningSQLPath = writeToFile('table-partitioning.sql', partitioningSQL);
        
        // Step 3: Generate maintenance procedures
        console.log('\nStep 3: Generating maintenance procedures...');
        const maintenanceSQL = generateMaintenanceProcedures();
        const maintenanceSQLPath = writeToFile('maintenance-procedures.sql', maintenanceSQL);
        
        // Step 4: Generate connection pool configuration
        console.log('\nStep 4: Generating connection pool configuration...');
        const poolConfig = generateConnectionPoolConfig();
        const poolConfigPath = writeToFile('pgbouncer.ini', poolConfig);
        
        // Step 5: Generate production database migration
        console.log('\nStep 5: Generating production database migration...');
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
        const migrationSQL = `-- Migration: Production database optimization
-- Description: Adds indexes, partitioning, and maintenance procedures for production

-- Include recommended indexes
${indexSQL}

-- Include table partitioning
${partitioningSQL}

-- Include maintenance procedures
${maintenanceSQL}
`;
        const migrationPath = writeToFile(`${timestamp}_production_database_optimization.sql`, migrationSQL);
        
        // Create checklist
        console.log('\nGenerating production database checklist...');
        const checklist = `# Production Database Configuration Checklist

## Indexes
- [ ] Review and apply recommended indexes from \`${path.basename(indexSQLPath)}\`
- [ ] Monitor query performance after adding indexes

## Table Partitioning
- [ ] Review partitioning recommendations in \`${path.basename(partitioningSQLPath)}\`
- [ ] Plan maintenance window for implementing partitioning
- [ ] Test partitioning in staging environment first

## Maintenance Procedures
- [ ] Apply maintenance procedures from \`${path.basename(maintenanceSQLPath)}\`
- [ ] Set up cron jobs for regular maintenance:
  - [ ] Daily: \`CALL maintenance_create_partitions();\`
  - [ ] Weekly: \`CALL maintenance_vacuum();\`
  - [ ] Monthly: \`CALL maintenance_reindex();\`

## Connection Pooling
- [ ] Set up PgBouncer with configuration from \`${path.basename(poolConfigPath)}\`
- [ ] Configure application to use connection pool

## Monitoring
- [ ] Set up monitoring for:
  - [ ] Slow queries
  - [ ] Connection count
  - [ ] Cache hit ratio
  - [ ] Index usage
  - [ ] Table bloat

## Backup Strategy
- [ ] Configure daily backups
- [ ] Test backup restoration process
- [ ] Set up point-in-time recovery
`;
        writeToFile('production-database-checklist.md', checklist);
        
        console.log('\nProduction database configuration completed!');
        console.log(`All files have been saved to: ${CONFIG.outputDir}`);
        console.log('\nNext steps:');
        console.log('1. Review the generated SQL files');
        console.log('2. Apply the changes to your staging environment first');
        console.log('3. Follow the production database checklist');
      }
    }
  } catch (error) {
    console.error('Error configuring production database:', error);
  } finally {
    rl.close();
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 