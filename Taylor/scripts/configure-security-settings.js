#!/usr/bin/env node

/**
 * EPAI Security Settings Configuration Script
 * 
 * This script configures security settings for the EPAI platform in production.
 * It sets up rate limiting, data retention policies, and API key security.
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

// Default security settings
const DEFAULT_SETTINGS = {
  rateLimiting: {
    general: {
      requests_per_minute: 60,
      burst: 10
    },
    ingest: {
      requests_per_minute: 120,
      burst: 20
    },
    public_api: {
      requests_per_minute: 300,
      burst: 50
    }
  },
  dataRetention: {
    logs: 90, // days
    security_events: 365, // days
    ingestion_events: 180, // days
    insights: 365 // days
  },
  apiKeySecurity: {
    default_expiration_days: 90,
    max_expiration_days: 365,
    min_length: 32,
    require_rotation: true
  }
};

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
 * Prompt for a value with default
 */
function promptWithDefault(message, defaultValue) {
  return new Promise((resolve) => {
    rl.question(`${message} [${defaultValue}]: `, (answer) => {
      resolve(answer.trim() || defaultValue);
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
 * Execute SQL in the Supabase database
 */
function executeSQL(sql) {
  try {
    const result = execSync(`echo "${sql}" | supabase db execute --project-ref ${SUPABASE_PROJECT_ID}`, {
      encoding: 'utf8'
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Configure rate limiting settings
 */
async function configureRateLimiting(settings) {
  console.log('\nConfiguring rate limiting...');
  
  // Customize settings if needed
  settings.general.requests_per_minute = await promptWithDefault(
    'General API requests per minute per IP',
    settings.general.requests_per_minute
  );
  
  settings.ingest.requests_per_minute = await promptWithDefault(
    'Ingest API requests per minute per API key',
    settings.ingest.requests_per_minute
  );
  
  settings.public_api.requests_per_minute = await promptWithDefault(
    'Public API requests per minute per API key',
    settings.public_api.requests_per_minute
  );
  
  // Create SQL to insert or update rate limiting settings
  const sql = `
    -- Clear existing rate limit configurations
    DELETE FROM rate_limit_config;
    
    -- Insert new configurations
    INSERT INTO rate_limit_config (endpoint_pattern, limit_type, limit_value, time_window_seconds, burst_limit)
    VALUES
      ('*', 'ip', ${settings.general.requests_per_minute}, 60, ${settings.general.burst}),
      ('ingest-v2', 'api_key', ${settings.ingest.requests_per_minute}, 60, ${settings.ingest.burst}),
      ('get-public-insight', 'api_key', ${settings.public_api.requests_per_minute}, 60, ${settings.public_api.burst});
  `;
  
  const { success, error } = executeSQL(sql);
  
  if (success) {
    console.log('✅ Rate limiting configured successfully');
    return true;
  } else {
    console.error('❌ Failed to configure rate limiting');
    console.error(error);
    return false;
  }
}

/**
 * Configure data retention policies
 */
async function configureDataRetention(settings) {
  console.log('\nConfiguring data retention policies...');
  
  // Customize settings if needed
  settings.logs = await promptWithDefault(
    'Log retention period (days)',
    settings.logs
  );
  
  settings.security_events = await promptWithDefault(
    'Security events retention period (days)',
    settings.security_events
  );
  
  settings.ingestion_events = await promptWithDefault(
    'Ingestion events retention period (days)',
    settings.ingestion_events
  );
  
  settings.insights = await promptWithDefault(
    'Insights retention period (days)',
    settings.insights
  );
  
  // Create SQL to insert or update data retention settings
  const sql = `
    -- Clear existing data retention configurations
    DELETE FROM data_retention_config;
    
    -- Insert new configurations
    INSERT INTO data_retention_config (table_name, retention_days, enabled)
    VALUES
      ('logs', ${settings.logs}, true),
      ('security_events', ${settings.security_events}, true),
      ('ingestion_events', ${settings.ingestion_events}, true),
      ('insights', ${settings.insights}, true);
      
    -- Set up the data purging job to run daily at 2 AM
    SELECT cron.schedule(
      'daily-data-purge',
      '0 2 * * *',
      $$SELECT purge_expired_data()$$
    );
  `;
  
  const { success, error } = executeSQL(sql);
  
  if (success) {
    console.log('✅ Data retention policies configured successfully');
    return true;
  } else {
    console.error('❌ Failed to configure data retention policies');
    console.error(error);
    return false;
  }
}

/**
 * Configure API key security
 */
async function configureApiKeySecurity(settings) {
  console.log('\nConfiguring API key security...');
  
  // Customize settings if needed
  settings.default_expiration_days = await promptWithDefault(
    'Default API key expiration period (days)',
    settings.default_expiration_days
  );
  
  settings.max_expiration_days = await promptWithDefault(
    'Maximum API key expiration period (days)',
    settings.max_expiration_days
  );
  
  settings.min_length = await promptWithDefault(
    'Minimum API key length',
    settings.min_length
  );
  
  settings.require_rotation = await confirm(
    'Require API key rotation?'
  );
  
  // Create SQL to configure API key security settings
  const sql = `
    -- Create or replace the API key settings function
    CREATE OR REPLACE FUNCTION get_api_key_settings()
    RETURNS jsonb AS $$
    BEGIN
      RETURN jsonb_build_object(
        'default_expiration_days', ${settings.default_expiration_days},
        'max_expiration_days', ${settings.max_expiration_days},
        'min_length', ${settings.min_length},
        'require_rotation', ${settings.require_rotation}
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Update existing API keys to have an expiration date if they don't have one
    UPDATE api_keys
    SET expires_at = created_at + interval '${settings.default_expiration_days} days'
    WHERE expires_at IS NULL;
  `;
  
  const { success, error } = executeSQL(sql);
  
  if (success) {
    console.log('✅ API key security configured successfully');
    return true;
  } else {
    console.error('❌ Failed to configure API key security');
    console.error(error);
    return false;
  }
}

/**
 * Verify security settings
 */
async function verifySettings() {
  console.log('\nVerifying security settings...');
  
  // SQL to check settings
  const sql = `
    -- Check rate limiting settings
    SELECT * FROM rate_limit_config;
    
    -- Check data retention settings
    SELECT * FROM data_retention_config;
    
    -- Check API key settings
    SELECT get_api_key_settings();
    
    -- Check scheduled jobs
    SELECT * FROM cron.job WHERE jobname = 'daily-data-purge';
  `;
  
  const { success, result, error } = executeSQL(sql);
  
  if (success) {
    console.log('\nCurrent security settings:');
    console.log(result);
    return true;
  } else {
    console.error('❌ Failed to verify security settings');
    console.error(error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('EPAI Security Settings Configuration Script');
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
  
  // Confirm before proceeding
  const confirmed = await confirm('\nConfigure security settings for production?');
  if (!confirmed) {
    console.log('Operation cancelled');
    rl.close();
    process.exit(0);
  }
  
  // Configure settings
  let success = true;
  
  // Rate limiting
  if (await confirm('Configure rate limiting?')) {
    success = await configureRateLimiting(DEFAULT_SETTINGS.rateLimiting) && success;
  }
  
  // Data retention
  if (await confirm('Configure data retention policies?')) {
    success = await configureDataRetention(DEFAULT_SETTINGS.dataRetention) && success;
  }
  
  // API key security
  if (await confirm('Configure API key security?')) {
    success = await configureApiKeySecurity(DEFAULT_SETTINGS.apiKeySecurity) && success;
  }
  
  // Verify settings
  if (success && await confirm('Verify security settings?')) {
    await verifySettings();
  }
  
  // Summary
  console.log('\nConfiguration Summary:');
  if (success) {
    console.log('✅ Security settings configured successfully');
    console.log('\nNext steps:');
    console.log('1. Test the security features in the production environment');
    console.log('2. Monitor security logs for any issues');
  } else {
    console.log('❌ Some security settings failed to configure');
    console.log('Please review the errors and try again');
  }
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 