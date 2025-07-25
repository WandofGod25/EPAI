#!/usr/bin/env node

/**
 * EPAI Penetration Testing Runner
 * 
 * This script runs the penetration testing preparation process:
 * 1. Applies the necessary database migrations
 * 2. Runs the penetration testing preparation script
 * 
 * Usage:
 * node scripts/run-penetration-test.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// --- CONFIGURATION ---
const CONFIG = {
  migrationDir: path.join(process.cwd(), 'supabase/migrations'),
  prepScript: path.join(process.cwd(), 'scripts/prepare-penetration-testing.js'),
  outputDir: path.join(process.cwd(), 'pentest-prep'),
};

// --- HELPER FUNCTIONS ---
function log(message, type = 'info') {
  const prefix = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    error: chalk.red('✗'),
    warning: chalk.yellow('⚠'),
    step: chalk.cyan('➤'),
  };
  console.log(`${prefix[type]} ${message}`);
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function runCommand(command) {
  log(`Running: ${command}`, 'step');
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    return output;
  } catch (error) {
    log(`Command failed: ${error.message}`, 'error');
    throw error;
  }
}

// --- CORE FUNCTIONS ---

// Step 1: Apply database migrations
function applyDatabaseMigrations() {
  log('Applying database migrations...', 'step');
  
  // Check if the migrations directory exists
  if (!fs.existsSync(CONFIG.migrationDir)) {
    log(`Migrations directory not found: ${CONFIG.migrationDir}`, 'error');
    throw new Error('Migrations directory not found');
  }
  
  // Get all migration files
  const migrationFiles = fs.readdirSync(CONFIG.migrationDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  log(`Found ${migrationFiles.length} migration files`, 'info');
  
  // Apply all migrations at once
  try {
    runCommand(`npx supabase db reset --db-url postgresql://postgres:postgres@localhost:54322/postgres --yes`);
    log('Successfully applied all migrations', 'success');
  } catch (error) {
    log(`Failed to apply migrations: ${error.message}`, 'error');
    throw error;
  }
}

// Step 2: Run the penetration testing preparation script
function runPenetrationTestPrep() {
  log('Running penetration testing preparation script...', 'step');
  
  // Check if the script exists
  if (!fs.existsSync(CONFIG.prepScript)) {
    log(`Preparation script not found: ${CONFIG.prepScript}`, 'error');
    throw new Error('Preparation script not found');
  }
  
  // Make the script executable
  fs.chmodSync(CONFIG.prepScript, '755');
  
  // Run the script
  try {
    runCommand(`node ${CONFIG.prepScript}`);
    log('Penetration testing preparation completed successfully', 'success');
  } catch (error) {
    log(`Penetration testing preparation failed: ${error.message}`, 'error');
    throw error;
  }
}

// Main function
async function main() {
  log('EPAI Penetration Testing Runner', 'info');
  log('==============================', 'info');
  
  try {
    // Ensure the output directory exists
    ensureDirectoryExists(CONFIG.outputDir);
    
    // Apply database migrations
    applyDatabaseMigrations();
    
    // Run the penetration testing preparation script
    runPenetrationTestPrep();
    
    log('\nPenetration testing setup completed successfully!', 'success');
    log(`Penetration testing documentation is available in: ${CONFIG.outputDir}`, 'info');
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

main(); 