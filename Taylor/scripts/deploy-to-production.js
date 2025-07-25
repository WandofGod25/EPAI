#!/usr/bin/env node

/**
 * EPAI Production Deployment Script
 * 
 * This script handles the deployment of the EPAI platform to the production Supabase instance.
 * It performs the following tasks:
 * 1. Validates the production environment
 * 2. Applies database migrations
 * 3. Deploys Edge Functions
 * 4. Configures security settings
 * 5. Verifies the deployment
 * 
 * Usage:
 * node scripts/deploy-to-production.js
 * 
 * Environment variables:
 * SUPABASE_PROD_URL - Production Supabase URL
 * SUPABASE_PROD_KEY - Production Supabase service role key
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const CONFIG = {
  prodUrl: process.env.SUPABASE_PROD_URL,
  prodKey: process.env.SUPABASE_PROD_KEY,
  supabaseDir: path.join(process.cwd(), 'supabase'),
  functionsDir: path.join(process.cwd(), 'supabase', 'functions'),
  migrationsDir: path.join(process.cwd(), 'supabase', 'migrations'),
  deploymentLog: path.join(process.cwd(), 'deployment-log.md'),
};

// Check required environment variables
if (!CONFIG.prodUrl || !CONFIG.prodKey) {
  console.error(chalk.red('Error: SUPABASE_PROD_URL and SUPABASE_PROD_KEY environment variables are required'));
  console.error(chalk.yellow('Please run:'));
  console.error(chalk.yellow('  export SUPABASE_PROD_URL=your_production_supabase_url'));
  console.error(chalk.yellow('  export SUPABASE_PROD_KEY=your_production_service_role_key'));
  process.exit(1);
}

// Create Supabase client
const prodClient = createClient(CONFIG.prodUrl, CONFIG.prodKey);

// Helper function to ask user for confirmation
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function for logging
function log(message, type = 'info') {
  const prefix = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    error: chalk.red('✗'),
    warning: chalk.yellow('⚠'),
    step: chalk.cyan('➤'),
  };
  
  console.log(`${prefix[type]} ${message}`);
  
  // Also append to deployment log
  fs.appendFileSync(CONFIG.deploymentLog, `${new Date().toISOString()} - ${type.toUpperCase()}: ${message}\n`);
}

// Helper function to run shell commands
function runCommand(command, cwd = process.cwd()) {
  try {
    log(`Running: ${command}`, 'info');
    return execSync(command, { cwd, stdio: 'pipe', encoding: 'utf-8' });
  } catch (error) {
    log(`Command failed: ${error.message}`, 'error');
    throw error;
  }
}

// Function to validate the production environment
async function validateProductionEnvironment() {
  log('Validating production environment...', 'step');
  
  try {
    // Check connection to production Supabase
    const { data, error } = await prodClient.from('partners').select('count(*)');
    
    if (error) {
      throw new Error(`Failed to connect to production Supabase: ${error.message}`);
    }
    
    log('Successfully connected to production Supabase', 'success');
    
    // Check if this is really a production environment
    const confirm = await askQuestion(chalk.yellow('WARNING: You are about to deploy to PRODUCTION. Are you sure? (yes/no): '));
    
    if (confirm.toLowerCase() !== 'yes') {
      throw new Error('Deployment cancelled by user');
    }
    
    // Check if Edge Functions are enabled
    try {
      const { data: functions, error: functionsError } = await prodClient.functions.listFunctions();
      
      if (functionsError) {
        throw new Error(`Failed to list Edge Functions: ${functionsError.message}`);
      }
      
      log(`Found ${functions.length} existing Edge Functions`, 'success');
    } catch (error) {
      throw new Error(`Edge Functions are not enabled: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    log(`Environment validation failed: ${error.message}`, 'error');
    throw error;
  }
}

// Function to apply database migrations
async function applyDatabaseMigrations() {
  log('Applying database migrations...', 'step');
  
  try {
    // Get list of migration files
    const migrationFiles = fs.readdirSync(CONFIG.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    log(`Found ${migrationFiles.length} migration files`, 'info');
    
    // Get applied migrations
    const { data: appliedMigrations, error: migrationsError } = await prodClient.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS migration_history (
          id SERIAL PRIMARY KEY,
          migration_name TEXT NOT NULL UNIQUE,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        SELECT migration_name FROM migration_history;
      `
    });
    
    if (migrationsError) {
      throw new Error(`Failed to get applied migrations: ${migrationsError.message}`);
    }
    
    const appliedMigrationNames = new Set(appliedMigrations?.map(m => m.migration_name) || []);
    log(`Found ${appliedMigrationNames.size} previously applied migrations`, 'info');
    
    // Apply new migrations
    let appliedCount = 0;
    for (const migrationFile of migrationFiles) {
      if (appliedMigrationNames.has(migrationFile)) {
        log(`Migration ${migrationFile} already applied, skipping`, 'info');
        continue;
      }
      
      log(`Applying migration: ${migrationFile}`, 'info');
      
      const migrationPath = path.join(CONFIG.migrationsDir, migrationFile);
      const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
      
      // Apply migration
      const { error: sqlError } = await prodClient.rpc('exec_sql', {
        sql: migrationSql
      });
      
      if (sqlError) {
        throw new Error(`Failed to apply migration ${migrationFile}: ${sqlError.message}`);
      }
      
      // Record migration
      const { error: recordError } = await prodClient.rpc('exec_sql', {
        sql: `
          INSERT INTO migration_history (migration_name)
          VALUES ($1);
        `,
        params: [migrationFile]
      });
      
      if (recordError) {
        throw new Error(`Failed to record migration ${migrationFile}: ${recordError.message}`);
      }
      
      log(`Successfully applied migration: ${migrationFile}`, 'success');
      appliedCount++;
    }
    
    log(`Applied ${appliedCount} new migrations`, 'success');
    
    return appliedCount;
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'error');
    throw error;
  }
}

// Function to deploy Edge Functions
async function deployEdgeFunctions() {
  log('Deploying Edge Functions...', 'step');
  
  try {
    // Check if Supabase CLI is installed
    try {
      runCommand('supabase --version');
    } catch (error) {
      throw new Error('Supabase CLI is not installed. Please install it with "npm install -g supabase"');
    }
    
    // Get list of Edge Function directories
    const functionDirs = fs.readdirSync(CONFIG.functionsDir)
      .filter(dir => fs.statSync(path.join(CONFIG.functionsDir, dir)).isDirectory());
    
    log(`Found ${functionDirs.length} Edge Functions to deploy`, 'info');
    
    // Deploy each function
    for (const functionDir of functionDirs) {
      log(`Deploying function: ${functionDir}`, 'info');
      
      try {
        // Deploy function
        const result = runCommand(`supabase functions deploy ${functionDir} --project-ref ${CONFIG.prodUrl.split('.')[0].split('//')[1]}`, CONFIG.supabaseDir);
        log(`Successfully deployed function: ${functionDir}`, 'success');
      } catch (error) {
        log(`Failed to deploy function ${functionDir}: ${error.message}`, 'error');
        throw error;
      }
    }
    
    log(`Successfully deployed ${functionDirs.length} Edge Functions`, 'success');
    
    return functionDirs.length;
  } catch (error) {
    log(`Function deployment failed: ${error.message}`, 'error');
    throw error;
  }
}

// Function to configure security settings
async function configureSecuritySettings() {
  log('Configuring security settings...', 'step');
  
  try {
    // Define production security settings
    const securitySettings = {
      api_rate_limit: 120, // requests per minute
      ip_rate_limit: 30, // requests per minute
      api_key_expiration_days: 90,
      cors_allowed_origins: 'https://admin.epai.example.com,https://api.epai.example.com',
      enable_security_headers: true,
      enable_detailed_logging: true,
      pentest_mode: false,
    };
    
    // Create settings table if it doesn't exist
    const { error: tableError } = await prodClient.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (tableError) {
      throw new Error(`Failed to create settings table: ${tableError.message}`);
    }
    
    // Update security settings
    const { error: settingsError } = await prodClient.rpc('exec_sql', {
      sql: `
        INSERT INTO app_settings (key, value)
        VALUES ('security', $1::jsonb)
        ON CONFLICT (key)
        DO UPDATE SET value = $1::jsonb, updated_at = NOW();
      `,
      params: [JSON.stringify(securitySettings)],
    });
    
    if (settingsError) {
      throw new Error(`Failed to update security settings: ${settingsError.message}`);
    }
    
    log('Security settings configured successfully', 'success');
    
    return securitySettings;
  } catch (error) {
    log(`Security configuration failed: ${error.message}`, 'error');
    throw error;
  }
}

// Function to verify the deployment
async function verifyDeployment() {
  log('Verifying deployment...', 'step');
  
  try {
    // Check database connection
    const { data: dbCheck, error: dbError } = await prodClient.from('partners').select('count(*)');
    
    if (dbError) {
      throw new Error(`Database verification failed: ${dbError.message}`);
    }
    
    log('Database connection verified', 'success');
    
    // Check Edge Functions
    const { data: functions, error: functionsError } = await prodClient.functions.listFunctions();
    
    if (functionsError) {
      throw new Error(`Edge Functions verification failed: ${functionsError.message}`);
    }
    
    log(`Edge Functions verified: ${functions.length} functions available`, 'success');
    
    // Check a specific Edge Function
    try {
      const response = await fetch(`${CONFIG.prodUrl}/functions/v1/get-models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${CONFIG.prodKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Function returned status ${response.status}`);
      }
      
      log('Sample Edge Function verified', 'success');
    } catch (error) {
      log(`Sample Edge Function verification failed: ${error.message}`, 'warning');
    }
    
    // Check security settings
    const { data: settings, error: settingsError } = await prodClient.rpc('exec_sql', {
      sql: `
        SELECT value FROM app_settings
        WHERE key = 'security';
      `
    });
    
    if (settingsError) {
      throw new Error(`Security settings verification failed: ${settingsError.message}`);
    }
    
    log('Security settings verified', 'success');
    
    return true;
  } catch (error) {
    log(`Deployment verification failed: ${error.message}`, 'error');
    throw error;
  }
}

// Main function
async function main() {
  log('EPAI Production Deployment', 'info');
  log('=========================', 'info');
  
  // Initialize deployment log
  fs.writeFileSync(CONFIG.deploymentLog, `# EPAI Production Deployment Log\nStarted at: ${new Date().toISOString()}\n\n`);
  
  try {
    // Step 1: Validate production environment
    await validateProductionEnvironment();
    
    // Step 2: Apply database migrations
    const migrationsApplied = await applyDatabaseMigrations();
    
    // Step 3: Deploy Edge Functions
    const functionsDeployed = await deployEdgeFunctions();
    
    // Step 4: Configure security settings
    const securitySettings = await configureSecuritySettings();
    
    // Step 5: Verify deployment
    await verifyDeployment();
    
    // Generate deployment summary
    const summary = `
# Deployment Summary

- **Timestamp:** ${new Date().toISOString()}
- **Environment:** Production
- **Migrations Applied:** ${migrationsApplied}
- **Functions Deployed:** ${functionsDeployed}
- **Security Settings:** Configured

## Next Steps
1. Monitor the application for any issues
2. Verify all functionality is working as expected
3. Set up automated backups (if not already done)
4. Conduct penetration testing
5. Perform load testing

## Rollback Plan
If issues are encountered, follow these steps:
1. Check the logs for errors
2. Fix any issues in the development environment
3. Deploy hotfixes as needed
4. If necessary, roll back to the previous version by restoring from backup
`;

    fs.appendFileSync(CONFIG.deploymentLog, summary);
    
    log('\nDeployment completed successfully!', 'success');
    log(`Deployment log saved to ${CONFIG.deploymentLog}`, 'info');
    log('\nNext steps:', 'step');
    log('1. Monitor the application for any issues', 'info');
    log('2. Verify all functionality is working as expected', 'info');
    log('3. Conduct penetration testing', 'info');
    log('4. Perform load testing', 'info');
  } catch (error) {
    log(`Deployment failed: ${error.message}`, 'error');
    
    // Append error to deployment log
    fs.appendFileSync(CONFIG.deploymentLog, `\n## Deployment Failed\n\nError: ${error.message}\n\nTimestamp: ${new Date().toISOString()}\n`);
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
