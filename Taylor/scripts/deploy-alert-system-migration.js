#!/usr/bin/env node

/**
 * EPAI Alert System Deployment Script
 * 
 * This script deploys the alert system by:
 * 1. Applying the migration to create the schema
 * 2. Seeding the initial data
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Console styling
const info = (text) => console.log(`ℹ ${text}`);
const success = (text) => console.log(`✓ ${text}`);
const error = (text) => console.error(`✗ ${text}`);
const step = (text) => console.log(`➤ ${text}`);

// Main function
async function main() {
  info('EPAI Alert System Deployment');
  info('==========================');
  
  try {
    // Apply the migration
    step('Applying migration...');
    execSync('cd .. && supabase db push', { stdio: 'inherit' });
    success('Migration applied successfully');
    
    // Seed the data
    step('Seeding data...');
    const seedFile = path.join('..', 'supabase', 'seed', '20250709T010718_create_alert_system_seed.sql');
    execSync(`cd .. && supabase db reset --db-url=${process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres'}`, { stdio: 'inherit' });
    success('Data seeded successfully');
    
    success('Alert system deployed successfully!');
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
main();
