#!/usr/bin/env node

/**
 * EPAI Load Testing Script
 * 
 * This script performs comprehensive load testing of the EPAI platform.
 * It tests:
 * 1. API endpoint performance under load
 * 2. Database performance under concurrent queries
 * 3. Edge Function scaling
 * 4. Rate limiting effectiveness
 * 
 * Usage:
 * node scripts/run-load-tests.js
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
const autocannon = require('autocannon');
const { promisify } = require('util');

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  testApiKey: process.env.TEST_API_KEY,
  outputDir: path.join(process.cwd(), 'load-test-results'),
  duration: 30, // seconds
  connections: 100, // concurrent connections
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

// Helper function to run autocannon as a promise
function runLoadTest(options) {
  return new Promise((resolve, reject) => {
    autocannon(options, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

// Function to prepare test data
async function prepareTestData() {
  log('Preparing test data...', 'step');
  
  try {
    // Create test models
    const testModels = [];
    for (let i = 1; i <= 10; i++) {
      testModels.push({
        name: `Load Test Model ${i}`,
        description: `A test model for load testing ${i}`,
        version: '1.0.0',
        status: 'active',
        metadata: { test: true, load_test: true }
      });
    }
    
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .insert(testModels)
      .select();
    
    if (modelsError) {
      throw new Error(`Failed to create test models: ${modelsError.message}`);
    }
    
    log(`Created ${models.length} test models`, 'success');
    
    // Create test events
    const testEvents = [];
    for (let i = 1; i <= 1000; i++) {
      testEvents.push({
        event_type: ['page_view', 'user_engagement', 'event_attendance', 'custom'][i % 4],
        data: {
          test_id: i,
          timestamp: new Date().toISOString(),
          value: Math.random() * 100
        },
        source: 'load_test',
        version: '1.0.0',
        metadata: { test: true, load_test: true }
      });
    }
    
    // Insert in batches of 100
    const batches = [];
    for (let i = 0; i < testEvents.length; i += 100) {
      batches.push(testEvents.slice(i, i + 100));
    }
    
    let insertedCount = 0;
    for (const batch of batches) {
      const { error: eventsError } = await supabase
        .from('ingestion_events')
        .insert(batch);
      
      if (eventsError) {
        throw new Error(`Failed to create test events: ${eventsError.message}`);
      }
      
      insertedCount += batch.length;
      log(`Inserted ${insertedCount}/${testEvents.length} test events`, 'info');
    }
    
    log(`Created ${insertedCount} test events`, 'success');
    
    // Create test insights
    const testInsights = [];
    for (let i = 1; i <= 100; i++) {
      testInsights.push({
        model_id: models[i % models.length].id,
        content: {
          title: `Test Insight ${i}`,
          description: `This is a test insight for load testing ${i}`,
          confidence: Math.random().toFixed(2),
          recommendation: `Test recommendation ${i}`,
        },
        metadata: { test: true, load_test: true }
      });
    }
    
    // Insert in batches of 20
    const insightBatches = [];
    for (let i = 0; i < testInsights.length; i += 20) {
      insightBatches.push(testInsights.slice(i, i + 20));
    }
    
    let insightCount = 0;
    for (const batch of insightBatches) {
      const { error: insightsError } = await supabase
        .from('insights')
        .insert(batch);
      
      if (insightsError) {
        throw new Error(`Failed to create test insights: ${insightsError.message}`);
      }
      
      insightCount += batch.length;
      log(`Inserted ${insightCount}/${testInsights.length} test insights`, 'info');
    }
    
    log(`Created ${insightCount} test insights`, 'success');
    
    return {
      models,
      eventsCount: insertedCount,
      insightsCount: insightCount,
    };
  } catch (error) {
    log(`Failed to prepare test data: ${error.message}`, 'error');
    throw error;
  }
}

// Function to test API endpoints
async function testApiEndpoints() {
  log('Testing API endpoints...', 'step');
  
  const endpoints = [
    {
      name: 'get-models',
      url: `${CONFIG.supabaseUrl}/functions/v1/get-models`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.supabaseKey}`,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'get-insights',
      url: `${CONFIG.supabaseUrl}/functions/v1/get-insights`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.supabaseKey}`,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'get-public-insight',
      url: `${CONFIG.supabaseUrl}/functions/v1/get-public-insight?insightId=1`,
      method: 'GET',
      headers: {
        'apikey': CONFIG.testApiKey,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'ingest',
      url: `${CONFIG.supabaseUrl}/functions/v1/ingest`,
      method: 'POST',
      headers: {
        'apikey': CONFIG.testApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'page_view',
        data: {
          url: 'https://example.com/load-test',
          referrer: 'https://example.com',
          title: 'Load Test Page',
          user_agent: 'LoadTestAgent',
          session_id: '123456789',
        },
        source: 'load_test',
        version: '1.0.0',
      }),
    },
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    log(`Load testing endpoint: ${endpoint.name}`, 'test');
    
    try {
      const options = {
        url: endpoint.url,
        method: endpoint.method,
        headers: endpoint.headers,
        body: endpoint.body,
        duration: CONFIG.duration,
        connections: CONFIG.connections,
      };
      
      const result = await runLoadTest(options);
      results[endpoint.name] = result;
      
      log(`Completed load test for ${endpoint.name}:`, 'success');
      log(`  Requests: ${result.requests.total}`, 'info');
      log(`  Throughput: ${result.requests.average} req/sec`, 'info');
      log(`  Latency (avg): ${result.latency.average} ms`, 'info');
      log(`  Latency (p99): ${result.latency.p99} ms`, 'info');
      log(`  Errors: ${result.errors}`, result.errors > 0 ? 'warning' : 'info');
    } catch (error) {
      log(`Failed to test endpoint ${endpoint.name}: ${error.message}`, 'error');
      results[endpoint.name] = { error: error.message };
    }
  }
  
  return results;
}

// Function to test database performance
async function testDatabasePerformance() {
  log('Testing database performance...', 'step');
  
  const queries = [
    {
      name: 'select-models',
      query: 'SELECT * FROM models WHERE metadata->>\'load_test\' = \'true\'',
    },
    {
      name: 'select-events',
      query: 'SELECT * FROM ingestion_events WHERE metadata->>\'load_test\' = \'true\' LIMIT 100',
    },
    {
      name: 'select-insights',
      query: 'SELECT * FROM insights WHERE metadata->>\'load_test\' = \'true\' LIMIT 100',
    },
    {
      name: 'join-query',
      query: `
        SELECT i.*, m.name as model_name
        FROM insights i
        JOIN models m ON i.model_id = m.id
        WHERE i.metadata->>\'load_test\' = \'true\'
        LIMIT 100
      `,
    },
    {
      name: 'aggregate-query',
      query: `
        SELECT event_type, COUNT(*)
        FROM ingestion_events
        WHERE metadata->>\'load_test\' = \'true\'
        GROUP BY event_type
      `,
    },
  ];
  
  const results = {};
  const concurrentQueries = 20;
  
  for (const queryDef of queries) {
    log(`Testing query: ${queryDef.name}`, 'test');
    
    try {
      const startTime = Date.now();
      const promises = [];
      
      // Run the query multiple times concurrently
      for (let i = 0; i < concurrentQueries; i++) {
        promises.push(supabase.rpc('exec_sql', { sql: queryDef.query }));
      }
      
      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgDuration = duration / concurrentQueries;
      
      results[queryDef.name] = {
        totalDuration: duration,
        averageDuration: avgDuration,
        queriesPerSecond: (concurrentQueries * 1000) / duration,
      };
      
      log(`Completed database test for ${queryDef.name}:`, 'success');
      log(`  Total Duration: ${duration} ms`, 'info');
      log(`  Average Duration: ${avgDuration.toFixed(2)} ms per query`, 'info');
      log(`  Throughput: ${((concurrentQueries * 1000) / duration).toFixed(2)} queries/sec`, 'info');
    } catch (error) {
      log(`Failed to test query ${queryDef.name}: ${error.message}`, 'error');
      results[queryDef.name] = { error: error.message };
    }
  }
  
  return results;
}

// Function to test rate limiting
async function testRateLimiting() {
  log('Testing rate limiting...', 'step');
  
  try {
    // Test with a very high number of connections to trigger rate limiting
    const options = {
      url: `${CONFIG.supabaseUrl}/functions/v1/get-public-insight?insightId=1`,
      method: 'GET',
      headers: {
        'apikey': CONFIG.testApiKey,
        'Content-Type': 'application/json',
      },
      duration: 10, // shorter duration
      connections: 500, // very high number of connections
    };
    
    log('Running high-concurrency test to trigger rate limiting...', 'info');
    const result = await runLoadTest(options);
    
    // Check if rate limiting was triggered (non-2xx responses)
    const rateLimitedRequests = result.non2xx;
    const totalRequests = result.requests.total;
    const rateLimitPercentage = (rateLimitedRequests / totalRequests) * 100;
    
    log(`Rate limiting test results:`, 'success');
    log(`  Total Requests: ${totalRequests}`, 'info');
    log(`  Rate Limited Requests: ${rateLimitedRequests}`, 'info');
    log(`  Rate Limit Percentage: ${rateLimitPercentage.toFixed(2)}%`, 'info');
    
    return {
      totalRequests,
      rateLimitedRequests,
      rateLimitPercentage,
      effective: rateLimitedRequests > 0,
    };
  } catch (error) {
    log(`Failed to test rate limiting: ${error.message}`, 'error');
    return { error: error.message };
  }
}

// Function to clean up test data
async function cleanupTestData() {
  log('Cleaning up test data...', 'step');
  
  try {
    // Delete test insights
    const { error: insightsError } = await supabase
      .from('insights')
      .delete()
      .filter('metadata->>load_test', 'eq', 'true');
    
    if (insightsError) {
      throw new Error(`Failed to delete test insights: ${insightsError.message}`);
    }
    
    log('Deleted test insights', 'success');
    
    // Delete test events
    const { error: eventsError } = await supabase
      .from('ingestion_events')
      .delete()
      .filter('metadata->>load_test', 'eq', 'true');
    
    if (eventsError) {
      throw new Error(`Failed to delete test events: ${eventsError.message}`);
    }
    
    log('Deleted test events', 'success');
    
    // Delete test models
    const { error: modelsError } = await supabase
      .from('models')
      .delete()
      .filter('metadata->>load_test', 'eq', 'true');
    
    if (modelsError) {
      throw new Error(`Failed to delete test models: ${modelsError.message}`);
    }
    
    log('Deleted test models', 'success');
    
    return true;
  } catch (error) {
    log(`Failed to clean up test data: ${error.message}`, 'error');
    return false;
  }
}

// Function to generate test report
function generateTestReport(testData, apiResults, dbResults, rateLimitResults) {
  log('Generating test report...', 'step');
  
  const report = `# EPAI Load Test Report

## Overview
- **Timestamp:** ${new Date().toISOString()}
- **Duration:** ${CONFIG.duration} seconds
- **Concurrent Connections:** ${CONFIG.connections}

## Test Data
- **Models:** ${testData.models.length}
- **Events:** ${testData.eventsCount}
- **Insights:** ${testData.insightsCount}

## API Endpoint Performance

${Object.entries(apiResults).map(([endpoint, result]) => `
### ${endpoint}
${result.error ? `- **Error:** ${result.error}` : `
- **Requests:** ${result.requests.total}
- **Throughput:** ${result.requests.average} req/sec
- **Latency (avg):** ${result.latency.average} ms
- **Latency (p99):** ${result.latency.p99} ms
- **Errors:** ${result.errors}
`}
`).join('')}

## Database Performance

${Object.entries(dbResults).map(([query, result]) => `
### ${query}
${result.error ? `- **Error:** ${result.error}` : `
- **Total Duration:** ${result.totalDuration} ms
- **Average Duration:** ${result.averageDuration.toFixed(2)} ms per query
- **Throughput:** ${result.queriesPerSecond.toFixed(2)} queries/sec
`}
`).join('')}

## Rate Limiting Test

${rateLimitResults.error ? `- **Error:** ${rateLimitResults.error}` : `
- **Total Requests:** ${rateLimitResults.totalRequests}
- **Rate Limited Requests:** ${rateLimitResults.rateLimitedRequests}
- **Rate Limit Percentage:** ${rateLimitResults.rateLimitPercentage.toFixed(2)}%
- **Rate Limiting Effective:** ${rateLimitResults.effective ? 'Yes' : 'No'}
`}

## Performance Analysis

### API Performance
${Object.entries(apiResults)
  .filter(([_, result]) => !result.error)
  .map(([endpoint, result]) => {
    const latencyRating = 
      result.latency.average < 100 ? 'Excellent' :
      result.latency.average < 300 ? 'Good' :
      result.latency.average < 1000 ? 'Fair' :
      'Poor';
    
    const throughputRating =
      result.requests.average > 100 ? 'Excellent' :
      result.requests.average > 50 ? 'Good' :
      result.requests.average > 10 ? 'Fair' :
      'Poor';
    
    return `- **${endpoint}:** ${latencyRating} latency (${result.latency.average} ms), ${throughputRating} throughput (${result.requests.average} req/sec)`;
  })
  .join('\n')}

### Database Performance
${Object.entries(dbResults)
  .filter(([_, result]) => !result.error)
  .map(([query, result]) => {
    const performanceRating = 
      result.averageDuration < 50 ? 'Excellent' :
      result.averageDuration < 200 ? 'Good' :
      result.averageDuration < 500 ? 'Fair' :
      'Poor';
    
    return `- **${query}:** ${performanceRating} (${result.averageDuration.toFixed(2)} ms per query)`;
  })
  .join('\n')}

### Rate Limiting
${!rateLimitResults.error ?
  rateLimitResults.effective ?
    '- Rate limiting is working effectively and protecting the system from excessive load.' :
    '- Rate limiting may not be configured correctly as it did not trigger during high load testing.' :
  '- Rate limiting test failed with an error.'
}

## Recommendations

${(() => {
  const recommendations = [];
  
  // API recommendations
  const slowApis = Object.entries(apiResults)
    .filter(([_, result]) => !result.error && result.latency.average > 500)
    .map(([endpoint]) => endpoint);
  
  if (slowApis.length > 0) {
    recommendations.push(`- Optimize the following slow API endpoints: ${slowApis.join(', ')}`);
  }
  
  // Database recommendations
  const slowQueries = Object.entries(dbResults)
    .filter(([_, result]) => !result.error && result.averageDuration > 200)
    .map(([query]) => query);
  
  if (slowQueries.length > 0) {
    recommendations.push(`- Optimize the following slow database queries: ${slowQueries.join(', ')}`);
  }
  
  // Rate limiting recommendations
  if (!rateLimitResults.error && !rateLimitResults.effective) {
    recommendations.push('- Review rate limiting configuration as it may not be providing adequate protection');
  }
  
  // General recommendations
  recommendations.push('- Consider adding caching for frequently accessed data');
  recommendations.push('- Monitor database connection pool usage during high load');
  recommendations.push('- Set up automated performance testing as part of CI/CD pipeline');
  
  return recommendations.join('\n');
})()}
`;

  writeToFile('load-test-report.md', report);
  
  // Also generate JSON results
  const jsonResults = {
    timestamp: new Date().toISOString(),
    config: {
      duration: CONFIG.duration,
      connections: CONFIG.connections,
    },
    testData: {
      models: testData.models.length,
      events: testData.eventsCount,
      insights: testData.insightsCount,
    },
    apiResults,
    dbResults,
    rateLimitResults,
  };
  
  writeToFile('load-test-results.json', JSON.stringify(jsonResults, null, 2));
  
  log('Test report generated successfully', 'success');
}

// Main function
async function main() {
  log('EPAI Load Tests', 'info');
  log('==============', 'info');
  
  try {
    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    // Step 1: Prepare test data
    const testData = await prepareTestData();
    
    // Step 2: Test API endpoints
    const apiResults = await testApiEndpoints();
    
    // Step 3: Test database performance
    const dbResults = await testDatabasePerformance();
    
    // Step 4: Test rate limiting
    const rateLimitResults = await testRateLimiting();
    
    // Step 5: Generate test report
    generateTestReport(testData, apiResults, dbResults, rateLimitResults);
    
    // Step 6: Clean up test data
    await cleanupTestData();
    
    log('\nLoad tests completed successfully!', 'success');
    log(`Test report saved to ${path.join(CONFIG.outputDir, 'load-test-report.md')}`, 'info');
  } catch (error) {
    log(`Tests failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the main function
main();
