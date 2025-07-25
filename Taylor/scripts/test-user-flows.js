#!/usr/bin/env node

/**
 * EPAI End-to-End User Flow Testing Script
 * 
 * This script tests complete user flows through the EPAI platform.
 * It tests:
 * 1. User authentication and onboarding
 * 2. API key management
 * 3. Data ingestion and insight generation
 * 4. SDK embedding and rendering
 * 
 * Usage:
 * node scripts/test-user-flows.js
 * 
 * Environment variables:
 * SUPABASE_URL - Supabase project URL (test environment)
 * SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  adminPanelUrl: process.env.ADMIN_PANEL_URL || 'http://localhost:5173',
  outputDir: path.join(process.cwd(), 'e2e-test-results'),
  screenshotsDir: path.join(process.cwd(), 'e2e-test-results', 'screenshots'),
};

// Check required environment variables
if (!CONFIG.supabaseKey) {
  console.error(chalk.red('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required'));
  console.error(chalk.yellow('Please set the following environment variables:'));
  console.error(chalk.yellow('  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key'));
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

// Helper function to take screenshots
async function takeScreenshot(page, name) {
  // Ensure screenshots directory exists
  if (!fs.existsSync(CONFIG.screenshotsDir)) {
    fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true });
  }
  
  const screenshotPath = path.join(CONFIG.screenshotsDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  log(`Screenshot saved to ${screenshotPath}`, 'info');
  return screenshotPath;
}

// Function to create a test user
async function createTestUser() {
  log('Creating test user...', 'step');
  
  const email = `test-user-${Date.now()}@example.com`;
  const password = `Test123!@#${Date.now()}`;
  
  try {
    // Create user with Supabase Auth Admin API
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }
    
    log(`Test user created: ${email}`, 'success');
    
    return { email, password, user };
  } catch (error) {
    log(`Failed to create test user: ${error.message}`, 'error');
    throw error;
  }
}

// Function to test user authentication flow
async function testAuthenticationFlow(testUser) {
  log('Testing authentication flow...', 'test');
  
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to admin panel
    log(`Navigating to admin panel: ${CONFIG.adminPanelUrl}`, 'info');
    await page.goto(CONFIG.adminPanelUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Take screenshot of login page
    await takeScreenshot(page, 'login-page');
    
    // Fill login form
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', testUser.email);
    await page.type('input[type="password"]', testUser.password);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    
    // Take screenshot of dashboard
    await takeScreenshot(page, 'dashboard-page');
    
    log('User successfully authenticated and redirected to dashboard', 'success');
    
    // Close browser
    await browser.close();
    
    return true;
  } catch (error) {
    log(`Authentication flow test failed: ${error.message}`, 'error');
    return false;
  }
}

// Function to test API key management flow
async function testApiKeyManagementFlow(testUser) {
  log('Testing API key management flow...', 'test');
  
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to admin panel and login
    log(`Navigating to admin panel: ${CONFIG.adminPanelUrl}`, 'info');
    await page.goto(CONFIG.adminPanelUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Fill login form
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', testUser.email);
    await page.type('input[type="password"]', testUser.password);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    
    // Navigate to settings page
    await page.click('[data-testid="settings-link"]');
    
    // Wait for settings page to load
    await page.waitForSelector('[data-testid="api-key-card"]', { timeout: 10000 });
    
    // Take screenshot of settings page with API key
    await takeScreenshot(page, 'settings-page-with-api-key');
    
    // Get current API key
    const currentApiKey = await page.evaluate(() => {
      const apiKeyElement = document.querySelector('[data-testid="api-key-value"]');
      return apiKeyElement ? apiKeyElement.textContent : null;
    });
    
    if (!currentApiKey) {
      throw new Error('Could not find API key on settings page');
    }
    
    log('Found current API key', 'success');
    
    // Click regenerate button
    await page.click('[data-testid="regenerate-api-key-button"]');
    
    // Wait for confirmation dialog
    await page.waitForSelector('[data-testid="confirm-regenerate-dialog"]', { timeout: 5000 });
    
    // Take screenshot of confirmation dialog
    await takeScreenshot(page, 'regenerate-api-key-dialog');
    
    // Confirm regeneration
    await page.click('[data-testid="confirm-regenerate-button"]');
    
    // Wait for new API key to appear
    await page.waitForFunction(() => {
      const apiKeyElement = document.querySelector('[data-testid="api-key-value"]');
      const newApiKey = apiKeyElement ? apiKeyElement.textContent : null;
      return newApiKey && newApiKey !== 'Loading...';
    }, { timeout: 10000 });
    
    // Take screenshot of settings page with new API key
    await takeScreenshot(page, 'settings-page-with-new-api-key');
    
    // Get new API key
    const newApiKey = await page.evaluate(() => {
      const apiKeyElement = document.querySelector('[data-testid="api-key-value"]');
      return apiKeyElement ? apiKeyElement.textContent : null;
    });
    
    if (!newApiKey || newApiKey === currentApiKey) {
      throw new Error('API key was not regenerated');
    }
    
    log('API key successfully regenerated', 'success');
    
    // Close browser
    await browser.close();
    
    return { currentApiKey, newApiKey };
  } catch (error) {
    log(`API key management flow test failed: ${error.message}`, 'error');
    return false;
  }
}

// Function to test data ingestion flow
async function testDataIngestionFlow(apiKey) {
  log('Testing data ingestion flow...', 'test');
  
  try {
    // Create test event data
    const eventData = {
      event_type: 'page_view',
      data: {
        url: 'https://example.com/test-page',
        referrer: 'https://example.com',
        title: 'Test Page',
        user_agent: 'E2E Test Agent',
        session_id: uuidv4(),
      },
      source: 'e2e_test',
      version: '1.0.0',
    };
    
    // Send event to ingest endpoint
    log('Sending test event to ingest endpoint...', 'info');
    const response = await fetch(`${CONFIG.supabaseUrl}/functions/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ingest endpoint returned status ${response.status}: ${errorText}`);
    }
    
    const responseData = await response.json();
    log('Event successfully ingested', 'success');
    
    // Wait for insight to be generated
    log('Waiting for insight to be generated...', 'info');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if insight was generated
    const { data: insights, error } = await supabase
      .from('insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      throw new Error(`Failed to check for generated insight: ${error.message}`);
    }
    
    if (insights && insights.length > 0) {
      log('Insight was successfully generated', 'success');
      return { eventData, insight: insights[0] };
    } else {
      log('No insight was generated', 'warning');
      return { eventData, insight: null };
    }
  } catch (error) {
    log(`Data ingestion flow test failed: ${error.message}`, 'error');
    return false;
  }
}

// Function to test SDK embedding flow
async function testSdkEmbeddingFlow(apiKey, insightId) {
  log('Testing SDK embedding flow...', 'test');
  
  try {
    // Create test HTML file with embedded SDK
    const testHtmlPath = path.join(CONFIG.outputDir, 'sdk-test.html');
    const testHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EPAI SDK Embedding Test</title>
  <script src="${CONFIG.supabaseUrl}/functions/v1/sdk-loader.js"></script>
</head>
<body>
  <h1>EPAI SDK Embedding Test</h1>
  <div id="insight-container" data-api-key="${apiKey}" data-insight-id="${insightId}"></div>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      window.EPAI.init();
    });
  </script>
</body>
</html>
    `;
    
    fs.writeFileSync(testHtmlPath, testHtml);
    log(`Test HTML file created at ${testHtmlPath}`, 'info');
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to test HTML file
    log('Loading test HTML file...', 'info');
    await page.goto(`file://${testHtmlPath}`, { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Wait for SDK to load and render insight
    await page.waitForFunction(() => {
      return document.querySelector('.epai-insight-card') !== null ||
             document.querySelector('#insight-container .epai-insight') !== null;
    }, { timeout: 10000 }).catch(() => {
      log('Insight element not found within timeout', 'warning');
    });
    
    // Take screenshot of rendered insight
    const screenshotPath = await takeScreenshot(page, 'sdk-embedding-test');
    
    // Check if insight was rendered
    const insightRendered = await page.evaluate(() => {
      const insightElement = document.querySelector('.epai-insight-card') || 
                            document.querySelector('#insight-container .epai-insight');
      return insightElement !== null;
    });
    
    if (insightRendered) {
      log('SDK successfully embedded and insight rendered', 'success');
    } else {
      log('SDK embedding test failed: Insight not rendered', 'error');
    }
    
    // Close browser
    await browser.close();
    
    return { success: insightRendered, screenshotPath };
  } catch (error) {
    log(`SDK embedding flow test failed: ${error.message}`, 'error');
    return false;
  }
}

// Function to clean up test data
async function cleanupTestData(testUser) {
  log('Cleaning up test data...', 'step');
  
  try {
    // Delete test user
    if (testUser && testUser.user && testUser.user.id) {
      const { error } = await supabase.auth.admin.deleteUser(testUser.user.id);
      
      if (error) {
        log(`Failed to delete test user: ${error.message}`, 'warning');
      } else {
        log('Test user deleted', 'success');
      }
    }
    
    // Delete test data from database
    const { error: dataError } = await supabase.rpc('exec_sql', {
      sql: `
        DELETE FROM insights WHERE metadata->>'e2e_test' = 'true';
        DELETE FROM ingestion_events WHERE source = 'e2e_test';
      `
    });
    
    if (dataError) {
      log(`Failed to delete test data: ${dataError.message}`, 'warning');
    } else {
      log('Test data deleted', 'success');
    }
    
    return true;
  } catch (error) {
    log(`Cleanup failed: ${error.message}`, 'error');
    return false;
  }
}

// Function to generate test report
function generateTestReport(results) {
  log('Generating test report...', 'step');
  
  const report = `# EPAI End-to-End User Flow Test Report

## Overview
- **Timestamp:** ${new Date().toISOString()}
- **Environment:** ${CONFIG.supabaseUrl}
- **Admin Panel URL:** ${CONFIG.adminPanelUrl}

## Test Results

### Authentication Flow
- **Status:** ${results.authFlow ? '✅ Passed' : '❌ Failed'}
${results.authFlow === false ? '- **Error:** Authentication flow test failed' : ''}

### API Key Management Flow
- **Status:** ${results.apiKeyFlow ? '✅ Passed' : '❌ Failed'}
${results.apiKeyFlow === false ? '- **Error:** API key management flow test failed' : ''}
${results.apiKeyFlow && results.apiKeyFlow.currentApiKey ? `- **Original API Key:** ${results.apiKeyFlow.currentApiKey.substring(0, 8)}...` : ''}
${results.apiKeyFlow && results.apiKeyFlow.newApiKey ? `- **Regenerated API Key:** ${results.apiKeyFlow.newApiKey.substring(0, 8)}...` : ''}

### Data Ingestion Flow
- **Status:** ${results.dataIngestionFlow ? '✅ Passed' : '❌ Failed'}
${results.dataIngestionFlow === false ? '- **Error:** Data ingestion flow test failed' : ''}
${results.dataIngestionFlow && results.dataIngestionFlow.eventData ? `- **Event Type:** ${results.dataIngestionFlow.eventData.event_type}` : ''}
${results.dataIngestionFlow && results.dataIngestionFlow.insight ? '- **Insight Generated:** Yes' : '- **Insight Generated:** No'}

### SDK Embedding Flow
- **Status:** ${results.sdkEmbeddingFlow && results.sdkEmbeddingFlow.success ? '✅ Passed' : '❌ Failed'}
${results.sdkEmbeddingFlow === false ? '- **Error:** SDK embedding flow test failed' : ''}
${results.sdkEmbeddingFlow && results.sdkEmbeddingFlow.screenshotPath ? `- **Screenshot:** [View](${path.relative(CONFIG.outputDir, results.sdkEmbeddingFlow.screenshotPath)})` : ''}

## Summary
- **Authentication:** ${results.authFlow ? 'Passed' : 'Failed'}
- **API Key Management:** ${results.apiKeyFlow ? 'Passed' : 'Failed'}
- **Data Ingestion:** ${results.dataIngestionFlow ? 'Passed' : 'Failed'}
- **SDK Embedding:** ${results.sdkEmbeddingFlow && results.sdkEmbeddingFlow.success ? 'Passed' : 'Failed'}
- **Overall Status:** ${
  results.authFlow && 
  results.apiKeyFlow && 
  results.dataIngestionFlow && 
  (results.sdkEmbeddingFlow && results.sdkEmbeddingFlow.success) ? '✅ PASSED' : '❌ FAILED'
}

## Screenshots
${fs.readdirSync(CONFIG.screenshotsDir).map(file => `- [${file}](${path.relative(CONFIG.outputDir, path.join(CONFIG.screenshotsDir, file))})`).join('\n')}
`;

  writeToFile('e2e-test-report.md', report);
  
  // Also generate JSON results
  const jsonResults = {
    timestamp: new Date().toISOString(),
    environment: CONFIG.supabaseUrl,
    adminPanelUrl: CONFIG.adminPanelUrl,
    results: {
      authFlow: results.authFlow,
      apiKeyFlow: results.apiKeyFlow,
      dataIngestionFlow: results.dataIngestionFlow,
      sdkEmbeddingFlow: results.sdkEmbeddingFlow,
    },
    screenshots: fs.readdirSync(CONFIG.screenshotsDir).map(file => path.join(CONFIG.screenshotsDir, file)),
  };
  
  writeToFile('e2e-test-results.json', JSON.stringify(jsonResults, null, 2));
  
  log('Test report generated successfully', 'success');
}

// Main function
async function main() {
  log('EPAI End-to-End User Flow Tests', 'info');
  log('==============================', 'info');
  
  try {
    // Ensure output directories exist
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    if (!fs.existsSync(CONFIG.screenshotsDir)) {
      fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true });
    }
    
    // Step 1: Create test user
    const testUser = await createTestUser();
    
    // Step 2: Test authentication flow
    const authFlow = await testAuthenticationFlow(testUser);
    
    // Step 3: Test API key management flow
    const apiKeyFlow = await testApiKeyManagementFlow(testUser);
    
    // Step 4: Test data ingestion flow
    const dataIngestionFlow = apiKeyFlow ? await testDataIngestionFlow(apiKeyFlow.newApiKey) : false;
    
    // Step 5: Test SDK embedding flow
    const insightId = dataIngestionFlow && dataIngestionFlow.insight ? dataIngestionFlow.insight.id : 1;
    const sdkEmbeddingFlow = apiKeyFlow ? await testSdkEmbeddingFlow(apiKeyFlow.newApiKey, insightId) : false;
    
    // Generate test report
    const results = {
      authFlow,
      apiKeyFlow,
      dataIngestionFlow,
      sdkEmbeddingFlow,
    };
    
    generateTestReport(results);
    
    // Clean up test data
    await cleanupTestData(testUser);
    
    // Log overall results
    const allPassed = authFlow && apiKeyFlow && dataIngestionFlow && (sdkEmbeddingFlow && sdkEmbeddingFlow.success);
    
    if (allPassed) {
      log('\nAll end-to-end user flow tests passed!', 'success');
    } else {
      log('\nSome end-to-end user flow tests failed!', 'error');
    }
    
    log(`Test report saved to ${path.join(CONFIG.outputDir, 'e2e-test-report.md')}`, 'info');
  } catch (error) {
    log(`Tests failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the main function
main();
