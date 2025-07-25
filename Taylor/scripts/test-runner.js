#!/usr/bin/env node

/**
 * EPAI Test Runner
 * 
 * This script runs tests for the EPAI platform.
 * It can:
 * 1. Run unit tests
 * 2. Run integration tests
 * 3. Run component tests (React components)
 * 4. Run all tests
 * 
 * Usage:
 * node scripts/test-runner.js unit
 * node scripts/test-runner.js integration
 * node scripts/test-runner.js component
 * node scripts/test-runner.js all
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const CONFIG = {
  testsDir: path.join(process.cwd(), 'tests'),
  unitTestsDir: path.join(process.cwd(), 'tests', 'unit'),
  integrationTestsDir: path.join(process.cwd(), 'tests', 'integration'),
  componentTestsDir: path.join(process.cwd(), 'packages', 'admin-panel', 'src', 'components'),
  resultsDir: path.join(process.cwd(), 'test-results'),
};

// Main function
function main() {
  const testType = process.argv[2] || 'all';
  
  try {
    // Ensure directories exist
    ensureDirectoriesExist();
    
    switch (testType) {
      case 'unit':
        runUnitTests();
        break;
      case 'integration':
        runIntegrationTests();
        break;
      case 'component':
        runComponentTests();
        break;
      case 'all':
        runAllTests();
        break;
      default:
        console.error(`Error: Unknown test type "${testType}"`);
        console.error('Valid types: unit, integration, component, all');
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Ensure directories exist
function ensureDirectoriesExist() {
  if (!fs.existsSync(CONFIG.testsDir)) {
    fs.mkdirSync(CONFIG.testsDir, { recursive: true });
  }
  
  if (!fs.existsSync(CONFIG.unitTestsDir)) {
    fs.mkdirSync(CONFIG.unitTestsDir, { recursive: true });
  }
  
  if (!fs.existsSync(CONFIG.integrationTestsDir)) {
    fs.mkdirSync(CONFIG.integrationTestsDir, { recursive: true });
  }
  
  if (!fs.existsSync(CONFIG.resultsDir)) {
    fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
  }
}

// Run unit tests
function runUnitTests() {
  console.log('Running unit tests...');
  
  try {
    // Check if there are any unit tests
    const unitTests = fs.readdirSync(CONFIG.unitTestsDir).filter(file => file.endsWith('.test.js'));
    
    if (unitTests.length === 0) {
      console.log('No unit tests found');
      return;
    }
    
    // Run unit tests using vitest
    const command = 'npx vitest run tests/unit';
    const output = execSync(command, { encoding: 'utf8' });
    
    console.log(output);
    
    // Save test results
    const resultsPath = path.join(CONFIG.resultsDir, 'unit-test-results.txt');
    fs.writeFileSync(resultsPath, output);
    
    console.log(`Unit test results saved to: ${resultsPath}`);
  } catch (error) {
    console.error(`Unit tests failed: ${error.message}`);
    process.exit(1);
  }
}

// Run integration tests
function runIntegrationTests() {
  console.log('Running integration tests...');
  
  try {
    // Check if there are any integration tests
    const integrationTests = fs.readdirSync(CONFIG.integrationTestsDir).filter(file => file.endsWith('.test.js'));
    
    if (integrationTests.length === 0) {
      console.log('No integration tests found');
      return;
    }
    
    // Run integration tests using vitest
    const command = 'npx vitest run tests/integration';
    const output = execSync(command, { encoding: 'utf8' });
    
    console.log(output);
    
    // Save test results
    const resultsPath = path.join(CONFIG.resultsDir, 'integration-test-results.txt');
    fs.writeFileSync(resultsPath, output);
    
    console.log(`Integration test results saved to: ${resultsPath}`);
  } catch (error) {
    console.error(`Integration tests failed: ${error.message}`);
    process.exit(1);
  }
}

// Run component tests
function runComponentTests() {
  console.log('Running React component tests...');
  
  try {
    // Run component tests using Jest
    const command = 'cd packages/admin-panel && npm test';
    const output = execSync(command, { encoding: 'utf8' });
    
    console.log(output);
    
    // Save test results
    const resultsPath = path.join(CONFIG.resultsDir, 'component-test-results.txt');
    fs.writeFileSync(resultsPath, output);
    
    console.log(`Component test results saved to: ${resultsPath}`);
  } catch (error) {
    console.error(`Component tests failed: ${error.message}`);
    process.exit(1);
  }
}

// Run all tests
function runAllTests() {
  console.log('Running all tests...');
  
  try {
    // Run unit tests
    runUnitTests();
    
    // Run integration tests
    runIntegrationTests();
    
    // Run component tests
    runComponentTests();
    
    console.log('All tests completed');
  } catch (error) {
    console.error(`Tests failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
