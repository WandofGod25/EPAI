/**
 * Supabase Production Environment Setup Script
 * 
 * This script helps prepare for migrating to a Supabase production environment by:
 * 1. Analyzing current database usage and recommending appropriate production tier
 * 2. Generating configuration files for the production environment
 * 3. Creating a checklist of manual steps required for production setup
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import chalk from 'chalk';

// For ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load environment variables from test.env
dotenv.config({ path: path.join(__dirname, 'test.env') });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Ensure we have the required environment variables
if (!SUPABASE_SERVICE_KEY) {
  console.error(chalk.red('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required'));
  console.error(chalk.yellow('Please run with: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/setup-prod-supabase.js'));
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Analyze current database usage and recommend production tier
 */
async function analyzeUsage() {
  console.log(chalk.blue('Analyzing current database usage...'));
  
  try {
    // Get table row counts
    let tableData;
    try {
      const { data, error } = await supabase.rpc('get_table_row_counts');
      if (error) throw error;
      tableData = data;
    } catch (e) {
      console.log(chalk.yellow('Warning: get_table_row_counts function not available. Using default values.'));
      tableData = [
        { table_name: 'users', row_count: 100 },
        { table_name: 'partners', row_count: 10 },
        { table_name: 'api_keys', row_count: 10 },
        { table_name: 'logs', row_count: 5000 },
        { table_name: 'insights', row_count: 1000 }
      ];
    }
    
    // Get database size
    let sizeData;
    try {
      const { data, error } = await supabase.rpc('get_database_size');
      if (error) throw error;
      sizeData = data;
    } catch (e) {
      console.log(chalk.yellow('Warning: get_database_size function not available. Using default values.'));
      sizeData = { size_gb: 0.5 };
    }
    
    // Get Edge Function usage
    let functionData;
    try {
      const { data, error } = await supabase.rpc('get_function_invocation_counts');
      if (error) throw error;
      functionData = data;
    } catch (e) {
      console.log(chalk.yellow('Warning: get_function_invocation_counts function not available. Using default values.'));
      functionData = [
        { function_name: 'ingest-v2', count: 1000 },
        { function_name: 'get-insights', count: 2000 },
        { function_name: 'api-key-manager', count: 100 }
      ];
    }
    
    // Calculate recommendations based on usage
    const recommendations = calculateRecommendations(tableData, sizeData, functionData);
    
    // Output recommendations
    console.log('\nProduction Environment Recommendations:');
    console.log(chalk.green('-----------------------------------'));
    console.log(chalk.green(`Recommended Tier: ${recommendations.tier}`));
    console.log(chalk.green(`Estimated Monthly Cost: $${recommendations.cost}`));
    console.log(chalk.green(`Database Size: ${recommendations.dbSize} GB`));
    console.log(chalk.green(`Estimated Monthly API Requests: ${recommendations.apiRequests}`));
    console.log(chalk.green(`Recommended Compute Add-on: ${recommendations.compute}`));
    
    return recommendations;
  } catch (error) {
    console.error(chalk.red('Error analyzing usage:'), error.message);
    return null;
  }
}

/**
 * Calculate recommendations based on usage data
 */
function calculateRecommendations(tableData, sizeData, functionData) {
  // This is a simplified recommendation algorithm
  // In a real implementation, this would be more sophisticated
  
  const totalRows = tableData.reduce((sum, table) => sum + table.row_count, 0);
  const dbSizeGB = sizeData.size_gb || 0.1;
  const monthlyRequests = (functionData.reduce((sum, fn) => sum + fn.count, 0) || 100) * 30;
  
  let tier, cost, compute;
  
  if (dbSizeGB < 1 && monthlyRequests < 50000) {
    tier = 'Free';
    cost = 0;
    compute = 'None';
  } else if (dbSizeGB < 8 && monthlyRequests < 1000000) {
    tier = 'Pro';
    cost = 25;
    compute = 'Small';
  } else {
    tier = 'Team';
    cost = 599;
    compute = 'Large';
  }
  
  return {
    tier,
    cost,
    dbSize: dbSizeGB.toFixed(2),
    apiRequests: monthlyRequests.toLocaleString(),
    compute
  };
}

/**
 * Generate production configuration files
 */
function generateConfigFiles(recommendations) {
  console.log('\nGenerating production configuration files...');
  
  const configDir = path.join(__dirname, '..', 'supabase', 'prod-config');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Generate production config.toml
  const configToml = `# Production Supabase Configuration
# Generated on ${new Date().toISOString()}

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]

[db]
port = 5432
shadow_port = 5431
major_version = 15

[studio]
enabled = false

[storage]
enabled = true

[auth]
enabled = true
site_url = "https://app.yourproductionsite.com"
additional_redirect_urls = ["https://app.yourproductionsite.com/auth/callback"]
jwt_expiry = 3600
enable_signup = true

[analytics]
enabled = true
`;

  // Generate production environment variables
  const envVars = `# Production Environment Variables
# Generated on ${new Date().toISOString()}
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Connection
DATABASE_URL=postgresql://postgres:your-password-here@db.your-project-id.supabase.co:5432/postgres

# Application Settings
NODE_ENV=production
`;

  // Write files
  fs.writeFileSync(path.join(configDir, 'config.toml'), configToml);
  fs.writeFileSync(path.join(configDir, '.env.production'), envVars);
  
  console.log(chalk.green(`Configuration files generated in ${configDir}`));
}

/**
 * Generate production setup checklist
 */
function generateChecklist(recommendations) {
  console.log('\nGenerating production setup checklist...');
  
  const checklist = `# Supabase Production Setup Checklist
Generated on ${new Date().toISOString()}

## 1. Account & Project Setup
- [ ] Create or log in to Supabase account at https://supabase.com
- [ ] Upgrade to ${recommendations.tier} tier
- [ ] Create new production project
- [ ] Configure project name and region (choose region closest to your users)
- [ ] Note project URL and API keys

## 2. Database Migration
- [ ] Run database migrations against production database
- [ ] Verify all tables, functions, and triggers are created correctly
- [ ] Set up appropriate database backups (daily recommended)
- [ ] Configure point-in-time recovery

## 3. Authentication Setup
- [ ] Configure authentication providers
- [ ] Set up email templates
- [ ] Configure site URL and redirect URLs
- [ ] Test authentication flows

## 4. Edge Functions Deployment
- [ ] Deploy all Edge Functions to production
- [ ] Test each function with production environment
- [ ] Configure appropriate resource limits

## 5. Security Configuration
- [ ] Review and configure Row Level Security (RLS) policies
- [ ] Set up appropriate API rate limiting
- [ ] Configure CORS settings for production domains
- [ ] Review and restrict JWT expiry times

## 6. Monitoring Setup
- [ ] Set up database performance monitoring
- [ ] Configure alerts for critical metrics
- [ ] Set up log retention policies
- [ ] Create operational dashboards

## 7. Production Validation
- [ ] Run end-to-end tests against production environment
- [ ] Verify all API endpoints are working correctly
- [ ] Test with expected production load
- [ ] Document any production-specific configurations
`;

  const checklistPath = path.join(__dirname, '..', 'supabase', 'prod-config', 'production-checklist.md');
  fs.writeFileSync(checklistPath, checklist);
  
  console.log(chalk.green(`Production checklist generated at ${checklistPath}`));
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue('Supabase Production Environment Setup'));
  console.log(chalk.blue('===================================='));
  
  const recommendations = await analyzeUsage();
  
  if (recommendations) {
    generateConfigFiles(recommendations);
    generateChecklist(recommendations);
    
    console.log('\nSetup completed successfully!');
    console.log(chalk.green('Next steps:'));
    console.log(chalk.green('1. Review the generated configuration files'));
    console.log(chalk.green('2. Follow the production checklist to complete the setup'));
    console.log(chalk.green('3. Update your application to use the production environment'));
  } else {
    console.log('\nSetup could not be completed due to errors.');
  }
}

// Run the script
main(); 