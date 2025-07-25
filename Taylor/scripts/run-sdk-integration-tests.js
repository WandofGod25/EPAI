#!/usr/bin/env node

/**
 * EPAI SDK Integration Testing Script
 * 
 * This script runs comprehensive integration tests for the EPAI SDK.
 * It tests:
 * 1. SDK installation in different frameworks
 * 2. Component rendering
 * 3. API integration
 * 4. Data handling
 * 5. Error scenarios
 * 
 * Usage:
 * node scripts/run-sdk-integration-tests.js
 * 
 * Environment variables:
 * SUPABASE_URL - Supabase project URL (test environment)
 * SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 * TEST_API_KEY - API key for testing
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  testApiKey: process.env.TEST_API_KEY,
  outputDir: path.join(process.cwd(), 'sdk-test-results'),
  tempDir: path.join(process.cwd(), 'sdk-test-temp'),
  sdkPath: path.join(process.cwd(), 'packages/insight-sdk'),
};

// Check required environment variables
if (!CONFIG.supabaseKey || !CONFIG.testApiKey) {
  console.error(chalk.red('Error: Required environment variables are missing'));
  console.error(chalk.yellow('Please set the following environment variables:'));
  console.error(chalk.yellow('  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key'));
  console.error(chalk.yellow('  export TEST_API_KEY=your_test_api_key'));
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// Helper function for logging
function log(message, type = 'info') {
  const prefix = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    error: chalk.red('✗'),
    warning: chalk.yellow('⚠'),
    step: chalk.cyan('➤'),
    test: chalk.magenta('🧪'),
  };
  
  console.log(`${prefix[type]} ${message}`);
}

// Helper function to write to file
function writeToFile(filename, content) {
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  const filePath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filePath, content);
  log(`File written: ${filePath}`, 'info');
  return filePath;
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

// Helper function to create test app
async function createTestApp(framework) {
  log(`Creating test app with ${framework}...`, 'step');
  
  const appDir = path.join(CONFIG.tempDir, `${framework}-test-app`);
  
  // Clean up existing directory
  if (fs.existsSync(appDir)) {
    fs.rmSync(appDir, { recursive: true, force: true });
  }
  
  // Create directory
  fs.mkdirSync(appDir, { recursive: true });
  
  // Initialize app based on framework
  switch (framework) {
    case 'react':
      runCommand(`npx create-react-app .`, appDir);
      break;
    case 'vue':
      runCommand(`npm init vue@latest . -- --typescript --jsx --router --no-eslint-with-prettier`, appDir);
      break;
    case 'vanilla':
      // Create a simple HTML/JS app
      fs.writeFileSync(path.join(appDir, 'index.html'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EPAI SDK Vanilla Test</title>
  <script src="https://cdn.jsdelivr.net/npm/epai-insight-sdk@latest/dist/epai-sdk.js"></script>
</head>
<body>
  <h1>EPAI SDK Vanilla Test</h1>
  <div id="insight-container" data-api-key="${CONFIG.testApiKey}" data-insight-id="1"></div>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      window.EPAI.init();
    });
  </script>
</body>
</html>
      `);
      break;
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }
  
  log(`Test app created at ${appDir}`, 'success');
  return appDir;
}

// Helper function to install SDK in test app
async function installSdkInTestApp(appDir, framework) {
  log(`Installing SDK in ${framework} test app...`, 'step');
  
  // Build SDK
  log('Building SDK...', 'info');
  runCommand('npm run build', CONFIG.sdkPath);
  
  // Install SDK in test app
  switch (framework) {
    case 'react':
    case 'vue':
      // Copy built SDK to test app
      const sdkDistDir = path.join(CONFIG.sdkPath, 'dist');
      const appNodeModulesDir = path.join(appDir, 'node_modules', 'epai-insight-sdk');
      
      // Create node_modules/epai-insight-sdk directory
      fs.mkdirSync(appNodeModulesDir, { recursive: true });
      
      // Copy SDK files
      fs.cpSync(sdkDistDir, path.join(appNodeModulesDir, 'dist'), { recursive: true });
      fs.cpSync(path.join(CONFIG.sdkPath, 'package.json'), path.join(appNodeModulesDir, 'package.json'));
      
      // Install dependencies
      runCommand('npm install', appDir);
      break;
    case 'vanilla':
      // For vanilla JS, we already included the SDK via CDN in the HTML
      break;
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }
  
  log(`SDK installed in ${framework} test app`, 'success');
}

// Helper function to create test component in app
async function createTestComponent(appDir, framework) {
  log(`Creating test component in ${framework} app...`, 'step');
  
  switch (framework) {
    case 'react':
      // Create a test component in React
      fs.writeFileSync(path.join(appDir, 'src', 'SdkTest.jsx'), `
import React, { useEffect } from 'react';
import { InsightCard } from 'epai-insight-sdk';

function SdkTest() {
  return (
    <div className="sdk-test">
      <h2>SDK Test Component</h2>
      <InsightCard 
        apiKey="${CONFIG.testApiKey}"
        insightId={1}
        theme="light"
        showConfidence={true}
        showTitle={true}
        compact={false}
      />
    </div>
  );
}

export default SdkTest;
      `);
      
      // Update App.js to use the test component
      fs.writeFileSync(path.join(appDir, 'src', 'App.js'), `
import React from 'react';
import './App.css';
import SdkTest from './SdkTest';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>EPAI SDK React Test</h1>
        <SdkTest />
      </header>
    </div>
  );
}

export default App;
      `);
      break;
    case 'vue':
      // Create a test component in Vue
      fs.writeFileSync(path.join(appDir, 'src', 'components', 'SdkTest.vue'), `
<template>
  <div class="sdk-test">
    <h2>SDK Test Component</h2>
    <div id="insight-container" data-api-key="${CONFIG.testApiKey}" data-insight-id="1"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { init } from 'epai-insight-sdk';

onMounted(() => {
  init();
});
</script>
      `);
      
      // Update App.vue to use the test component
      fs.writeFileSync(path.join(appDir, 'src', 'App.vue'), `
<template>
  <div class="app">
    <header>
      <h1>EPAI SDK Vue Test</h1>
      <SdkTest />
    </header>
  </div>
</template>

<script setup>
import SdkTest from './components/SdkTest.vue';
</script>
      `);
      break;
    case 'vanilla':
      // For vanilla JS, we already created the test HTML
      break;
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }
  
  log(`Test component created in ${framework} app`, 'success');
}

// Helper function to run tests in browser
async function runBrowserTests(appDir, framework) {
  log(`Running browser tests for ${framework}...`, 'step');
  
  // Start the app
  let appProcess;
  let appUrl;
  
  try {
    switch (framework) {
      case 'react':
        // Start React app
        appProcess = require('child_process').spawn('npm', ['start'], {
          cwd: appDir,
          stdio: 'pipe',
          detached: true,
        });
        appUrl = 'http://localhost:3000';
        break;
      case 'vue':
        // Start Vue app
        appProcess = require('child_process').spawn('npm', ['run', 'dev'], {
          cwd: appDir,
          stdio: 'pipe',
          detached: true,
        });
        appUrl = 'http://localhost:5173';
        break;
      case 'vanilla':
        // For vanilla JS, we'll use a simple HTTP server
        appProcess = require('child_process').spawn('npx', ['http-server', '.', '-p', '8080'], {
          cwd: appDir,
          stdio: 'pipe',
          detached: true,
        });
        appUrl = 'http://localhost:8080';
        break;
      default:
        throw new Error(`Unsupported framework: ${framework}`);
    }
    
    // Wait for app to start
    log(`Waiting for ${framework} app to start...`, 'info');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to app
    log(`Navigating to ${appUrl}...`, 'info');
    await page.goto(appUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Take screenshot
    const screenshotPath = path.join(CONFIG.outputDir, `${framework}-screenshot.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(`Screenshot saved to ${screenshotPath}`, 'info');
    
    // Test SDK initialization
    const sdkInitialized = await page.evaluate(() => {
      return window.EPAI !== undefined;
    });
    
    if (sdkInitialized) {
      log('SDK initialized successfully', 'success');
    } else {
      log('SDK initialization failed', 'error');
      throw new Error('SDK initialization failed');
    }
    
    // Test insight rendering
    const insightRendered = await page.evaluate(() => {
      const insightElement = document.querySelector('.epai-insight-card') || 
                            document.querySelector('#insight-container .epai-insight');
      return insightElement !== null;
    });
    
    if (insightRendered) {
      log('Insight rendered successfully', 'success');
    } else {
      log('Insight rendering failed', 'error');
      throw new Error('Insight rendering failed');
    }
    
    // Close browser
    await browser.close();
    
    return {
      framework,
      success: true,
      screenshot: screenshotPath,
    };
  } catch (error) {
    log(`Browser tests failed for ${framework}: ${error.message}`, 'error');
    return {
      framework,
      success: false,
      error: error.message,
    };
  } finally {
    // Kill app process
    if (appProcess) {
      process.kill(-appProcess.pid);
    }
  }
}

// Helper function to test API integration
async function testApiIntegration() {
  log('Testing API integration...', 'step');
  
  try {
    // Create test HTML file with SDK
    const testHtmlPath = path.join(CONFIG.tempDir, 'api-test.html');
    fs.writeFileSync(testHtmlPath, `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EPAI SDK API Test</title>
  <script>
    // Mock fetch for testing
    window.fetchResults = {};
    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
      const response = await originalFetch(url, options);
      const responseClone = response.clone();
      const json = await responseClone.json();
      window.fetchResults[url] = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: json
      };
      return response;
    };
  </script>
  <script src="${CONFIG.sdkPath}/dist/epai-sdk.js"></script>
</head>
<body>
  <h1>EPAI SDK API Test</h1>
  <div id="insight-container" data-api-key="${CONFIG.testApiKey}" data-insight-id="1"></div>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      window.EPAI.init();
    });
  </script>
</body>
</html>
    `);
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    // Navigate to test HTML
    await page.goto(`file://${testHtmlPath}`, { waitUntil: 'networkidle0' });
    
    // Wait for API calls to complete
    await page.waitForFunction(() => {
      return Object.keys(window.fetchResults).length > 0;
    }, { timeout: 10000 });
    
    // Get API call results
    const apiResults = await page.evaluate(() => {
      return window.fetchResults;
    });
    
    // Close browser
    await browser.close();
    
    // Check API results
    let apiSuccess = false;
    let apiError = null;
    
    for (const [url, result] of Object.entries(apiResults)) {
      if (url.includes('/get-public-insight')) {
        if (result.status === 200 && result.body && result.body.data) {
          apiSuccess = true;
          log(`API call successful: ${url}`, 'success');
        } else {
          apiError = `API call failed: ${url} - Status: ${result.status}`;
          log(apiError, 'error');
        }
      }
    }
    
    return {
      success: apiSuccess,
      error: apiError,
      results: apiResults,
    };
  } catch (error) {
    log(`API integration tests failed: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message,
    };
  }
}

// Helper function to test error scenarios
async function testErrorScenarios() {
  log('Testing error scenarios...', 'step');
  
  const errorScenarios = [
    {
      name: 'invalid-api-key',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EPAI SDK Error Test - Invalid API Key</title>
  <script src="${CONFIG.sdkPath}/dist/epai-sdk.js"></script>
</head>
<body>
  <h1>EPAI SDK Error Test - Invalid API Key</h1>
  <div id="insight-container" data-api-key="invalid_key" data-insight-id="1"></div>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      window.EPAI.init();
    });
  </script>
</body>
</html>
      `,
      expectedError: 'Unauthorized',
    },
    {
      name: 'invalid-insight-id',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EPAI SDK Error Test - Invalid Insight ID</title>
  <script src="${CONFIG.sdkPath}/dist/epai-sdk.js"></script>
</head>
<body>
  <h1>EPAI SDK Error Test - Invalid Insight ID</h1>
  <div id="insight-container" data-api-key="${CONFIG.testApiKey}" data-insight-id="999999"></div>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      window.EPAI.init();
    });
  </script>
</body>
</html>
      `,
      expectedError: 'not found',
    },
    {
      name: 'missing-container',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EPAI SDK Error Test - Missing Container</title>
  <script src="${CONFIG.sdkPath}/dist/epai-sdk.js"></script>
</head>
<body>
  <h1>EPAI SDK Error Test - Missing Container</h1>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      window.EPAI.init();
    });
  </script>
</body>
</html>
      `,
      expectedError: 'No insight containers found',
    },
  ];
  
  const results = [];
  
  for (const scenario of errorScenarios) {
    log(`Testing error scenario: ${scenario.name}`, 'test');
    
    try {
      // Create test HTML file
      const testHtmlPath = path.join(CONFIG.tempDir, `error-test-${scenario.name}.html`);
      fs.writeFileSync(testHtmlPath, scenario.html);
      
      // Launch browser
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      
      // Capture console errors
      let consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Navigate to test HTML
      await page.goto(`file://${testHtmlPath}`, { waitUntil: 'networkidle0' });
      
      // Wait a bit for any errors to appear
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check for expected error
      const errorFound = consoleErrors.some(error => 
        error.includes(scenario.expectedError)
      );
      
      // Check for error element in the DOM
      const errorElementExists = await page.evaluate(() => {
        return document.querySelector('.epai-error') !== null;
      });
      
      // Take screenshot
      const screenshotPath = path.join(CONFIG.outputDir, `error-${scenario.name}.png`);
      await page.screenshot({ path: screenshotPath });
      
      // Close browser
      await browser.close();
      
      if (errorFound || errorElementExists) {
        log(`Error scenario ${scenario.name} passed`, 'success');
        results.push({
          scenario: scenario.name,
          success: true,
          screenshot: screenshotPath,
        });
      } else {
        log(`Error scenario ${scenario.name} failed: Expected error not found`, 'error');
        results.push({
          scenario: scenario.name,
          success: false,
          error: 'Expected error not found',
          screenshot: screenshotPath,
        });
      }
    } catch (error) {
      log(`Error testing scenario ${scenario.name}: ${error.message}`, 'error');
      results.push({
        scenario: scenario.name,
        success: false,
        error: error.message,
      });
    }
  }
  
  return results;
}

// Main function
async function main() {
  log('EPAI SDK Integration Tests', 'info');
  log('========================', 'info');
  
  try {
    // Create output and temp directories
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    if (!fs.existsSync(CONFIG.tempDir)) {
      fs.mkdirSync(CONFIG.tempDir, { recursive: true });
    }
    
    // Check if SDK exists
    if (!fs.existsSync(CONFIG.sdkPath)) {
      throw new Error(`SDK not found at ${CONFIG.sdkPath}`);
    }
    
    // Build SDK
    log('Building SDK...', 'step');
    runCommand('npm run build', CONFIG.sdkPath);
    
    // Test results
    const testResults = {
      framework: {},
      api: null,
      errors: [],
      timestamp: new Date().toISOString(),
    };
    
    // Test frameworks
    const frameworks = ['react', 'vue', 'vanilla'];
    for (const framework of frameworks) {
      log(`Testing ${framework} integration...`, 'step');
      
      try {
        // Create test app
        const appDir = await createTestApp(framework);
        
        // Install SDK in test app
        await installSdkInTestApp(appDir, framework);
        
        // Create test component
        await createTestComponent(appDir, framework);
        
        // Run browser tests
        const result = await runBrowserTests(appDir, framework);
        testResults.framework[framework] = result;
      } catch (error) {
        log(`Failed to test ${framework} integration: ${error.message}`, 'error');
        testResults.framework[framework] = {
          framework,
          success: false,
          error: error.message,
        };
      }
    }
    
    // Test API integration
    log('Testing API integration...', 'step');
    testResults.api = await testApiIntegration();
    
    // Test error scenarios
    log('Testing error scenarios...', 'step');
    testResults.errors = await testErrorScenarios();
    
    // Generate test report
    const reportContent = `# EPAI SDK Integration Test Report

## Overview
- **Timestamp:** ${testResults.timestamp}
- **SDK Version:** ${require(path.join(CONFIG.sdkPath, 'package.json')).version}

## Framework Integration Tests

${Object.entries(testResults.framework).map(([framework, result]) => `
### ${framework.charAt(0).toUpperCase() + framework.slice(1)}
- **Status:** ${result.success ? '✅ Passed' : '❌ Failed'}
${result.error ? `- **Error:** ${result.error}` : ''}
${result.screenshot ? `- **Screenshot:** [View](${path.relative(CONFIG.outputDir, result.screenshot)})` : ''}
`).join('\n')}

## API Integration Test
- **Status:** ${testResults.api.success ? '✅ Passed' : '❌ Failed'}
${testResults.api.error ? `- **Error:** ${testResults.api.error}` : ''}

## Error Handling Tests
${testResults.errors.map(result => `
### ${result.scenario}
- **Status:** ${result.success ? '✅ Passed' : '❌ Failed'}
${result.error ? `- **Error:** ${result.error}` : ''}
${result.screenshot ? `- **Screenshot:** [View](${path.relative(CONFIG.outputDir, result.screenshot)})` : ''}
`).join('\n')}

## Summary
- **Framework Tests:** ${Object.values(testResults.framework).filter(r => r.success).length}/${Object.values(testResults.framework).length} passed
- **API Test:** ${testResults.api.success ? 'Passed' : 'Failed'}
- **Error Tests:** ${testResults.errors.filter(r => r.success).length}/${testResults.errors.length} passed
- **Overall Status:** ${
  Object.values(testResults.framework).every(r => r.success) && 
  testResults.api.success && 
  testResults.errors.every(r => r.success) ? '✅ PASSED' : '❌ FAILED'
}
`;

    writeToFile('test-report.md', reportContent);
    
    // Generate JSON results
    writeToFile('test-results.json', JSON.stringify(testResults, null, 2));
    
    // Clean up temp directory
    fs.rmSync(CONFIG.tempDir, { recursive: true, force: true });
    
    log('\nSDK integration tests completed!', 'success');
    log(`Test report saved to ${path.join(CONFIG.outputDir, 'test-report.md')}`, 'info');
    
    // Return overall status
    const overallSuccess = 
      Object.values(testResults.framework).every(r => r.success) && 
      testResults.api.success && 
      testResults.errors.every(r => r.success);
    
    if (overallSuccess) {
      log('All tests passed!', 'success');
      process.exit(0);
    } else {
      log('Some tests failed!', 'error');
      process.exit(1);
    }
  } catch (error) {
    log(`Tests failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the main function
main();
