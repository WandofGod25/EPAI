#!/usr/bin/env node

/**
 * EPAI Security Migrations Application Script
 * 
 * This script applies security-related database migrations to the production environment.
 * It ensures that all security tables, functions, and policies are properly created.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

// Setup paths and environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

// Configuration
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROD_PROJECT_ID;
const MIGRATIONS_DIR = path.join(rootDir, 'supabase', 'migrations');
const SECURITY_MIGRATIONS = [
  // List security-related migrations to apply
  '20240701000000_add_security_events_table.sql',
  '20240701000001_add_data_retention_config_table.sql',
  '20240701000002_add_data_deletion_audit_table.sql',
  '20240701000003_add_rate_limit_config_table.sql',
  '20240701000004_add_api_key_security_functions.sql',
  '20240701000005_add_security_event_logging_functions.sql',
  '20240701000006_add_data_retention_enforcement_functions.sql',
  '20240701000007_add_security_policies.sql'
];

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt for confirmation
 */
function confirm(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Check if Supabase CLI is installed
 */
function checkSupabaseCLI() {
  try {
    const version = execSync('supabase --version', { encoding: 'utf8' });
    console.log(`Supabase CLI detected: ${version.trim()}`);
    return true;
  } catch (error) {
    console.error('Error: Supabase CLI not found. Please install it first.');
    console.error('Installation instructions: https://supabase.io/docs/guides/cli');
    return false;
  }
}

/**
 * Check if migration file exists
 */
function checkMigrationExists(migrationFile) {
  const fullPath = path.join(MIGRATIONS_DIR, migrationFile);
  return fs.existsSync(fullPath);
}

/**
 * Apply a single migration file
 */
async function applyMigration(migrationFile) {
  const fullPath = path.join(MIGRATIONS_DIR, migrationFile);
  
  console.log(`Applying migration: ${migrationFile}`);
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync(fullPath, 'utf8');
    
    // Execute the SQL using Supabase CLI
    execSync(`echo "${sql}" | supabase db execute --project-ref ${SUPABASE_PROJECT_ID}`, {
      stdio: 'inherit'
    });
    
    console.log(`✅ Successfully applied migration: ${migrationFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to apply migration: ${migrationFile}`);
    console.error(error.message);
    return false;
  }
}

/**
 * Verify that the security tables exist
 */
async function verifySecurityTables() {
  console.log('\nVerifying security tables...');
  
  const tablesToCheck = [
    'security_events',
    'data_retention_config',
    'data_deletion_audit',
    'rate_limit_config'
  ];
  
  const checkTableSQL = tablesToCheck.map(table => 
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}') AS "${table}_exists";`
  ).join('\n');
  
  try {
    const result = execSync(`echo "${checkTableSQL}" | supabase db execute --project-ref ${SUPABASE_PROJECT_ID}`, {
      encoding: 'utf8'
    });
    
    console.log('\nVerification results:');
    console.log(result);
    
    // Check if any tables are missing
    const missingTables = tablesToCheck.filter(table => !result.includes(`${table}_exists | t`));
    
    if (missingTables.length > 0) {
      console.error(`❌ Some security tables are missing: ${missingTables.join(', ')}`);
      return false;
    } else {
      console.log('✅ All security tables verified successfully');
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to verify security tables');
    console.error(error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('EPAI Security Migrations Application Script');
  console.log('==========================================');
  
  // Check for Supabase CLI
  if (!checkSupabaseCLI()) {
    process.exit(1);
  }
  
  // Check for project ID
  if (!SUPABASE_PROJECT_ID) {
    console.error('Error: SUPABASE_PROD_PROJECT_ID not found in environment variables');
    console.error('Please set this variable in your .env file');
    process.exit(1);
  }
  
  console.log(`\nTarget Supabase Project: ${SUPABASE_PROJECT_ID}`);
  console.log(`Migrations directory: ${MIGRATIONS_DIR}`);
  
  // Check if migration files exist
  const missingMigrations = SECURITY_MIGRATIONS.filter(file => !checkMigrationExists(file));
  if (missingMigrations.length > 0) {
    console.error(`Error: The following migration files are missing:`);
    missingMigrations.forEach(file => console.error(`  - ${file}`));
    process.exit(1);
  }
  
  // Confirm before proceeding
  console.log('\nThe following security migrations will be applied:');
  SECURITY_MIGRATIONS.forEach(file => console.log(`  - ${file}`));
  
  const confirmed = await confirm('\nApply these migrations to production?');
  if (!confirmed) {
    console.log('Operation cancelled');
    rl.close();
    process.exit(0);
  }
  
  // Apply migrations
  console.log('\nApplying security migrations...');
  let success = true;
  
  for (const migration of SECURITY_MIGRATIONS) {
    const result = await applyMigration(migration);
    if (!result) {
      success = false;
      if (!await confirm('Continue with remaining migrations?')) {
        break;
      }
    }
  }
  
  // Verify tables
  if (success) {
    await verifySecurityTables();
  }
  
  // Summary
  console.log('\nMigration Summary:');
  if (success) {
    console.log('✅ All security migrations applied successfully');
    console.log('\nNext steps:');
    console.log('1. Run scripts/configure-security-settings.js to configure security settings');
    console.log('2. Verify security features in the production environment');
  } else {
    console.log('❌ Some migrations failed to apply');
    console.log('Please review the errors and try again');
  }
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 