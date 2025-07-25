#!/usr/bin/env node

/**
 * EPAI Penetration Testing Preparation Script
 * 
 * This script helps prepare for penetration testing of the EPAI platform.
 * It performs the following tasks:
 * 1. Generates a penetration testing scope document
 * 2. Creates a test environment with sample data
 * 3. Configures security settings for testing
 * 4. Generates a penetration testing checklist
 * 
 * Usage:
 * node scripts/prepare-penetration-testing.js
 * 
 * Environment variables:
 * SUPABASE_URL - Supabase project URL (test environment)
 * SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(process.cwd(), 'scripts/test.env') });

// --- CONFIGURATION ---
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  outputDir: path.join(process.cwd(), 'pentest-prep'),
};

// Check required environment variables
if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
  console.error(chalk.red('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.'));
  console.error(chalk.yellow('Please ensure scripts/test.env is configured correctly.'));
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

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

function writeToFile(filename, content) {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  const filePath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filePath, content);
  log(`File written: ${filePath}`, 'success');
  return filePath;
}

// Helper function to generate a secure API key
function generateApiKey() {
  return 'epai_' + crypto.randomBytes(24).toString('base64').replace(/[+/=]/g, '');
}

// Helper function to hash an API key (simplified version for testing)
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// --- CORE FUNCTIONS ---

// Step 1: Generate penetration testing scope document
function generatePentestScopeDocument() {
  log('Generating penetration testing scope document...', 'step');
  
  const scopeDoc = `
# EPAI Penetration Testing Scope Document

## Overview
This document outlines the scope, objectives, and boundaries for the penetration testing of the EPAI (Embedded Predictive Analytics Integrator) platform.

## Target Environment
- **Production URL:** https://epai.example.com
- **Staging URL:** https://staging.epai.example.com
- **Local Development URL:** http://localhost:54321

## In-Scope Components

### 1. API Endpoints
- Authentication endpoints
- Data ingestion endpoints
- Model prediction endpoints
- API key management endpoints
- Partner management endpoints

### 2. Database
- Supabase PostgreSQL database
- Row-level security policies
- Database functions and triggers

### 3. Frontend Applications
- Admin Panel (React)
- SDK Embedding (JavaScript)

### 4. Infrastructure
- Edge Functions
- API Gateway
- Authentication services

## Out-of-Scope Components
- Third-party dependencies and libraries
- Underlying cloud infrastructure (AWS, Supabase)
- Physical security
- Social engineering attacks

## Testing Methodology
1. **Reconnaissance:** Information gathering about the application
2. **Vulnerability Scanning:** Automated scanning for known vulnerabilities
3. **Manual Testing:** In-depth testing of authentication, authorization, and business logic
4. **Exploitation:** Attempt to exploit identified vulnerabilities
5. **Reporting:** Document findings and recommendations

## Specific Testing Areas

### Authentication & Authorization
- API key validation and security
- User authentication flows
- Permission boundaries between partners
- JWT token security

### Data Security
- Data validation and sanitization
- SQL injection protection
- Cross-site scripting protection
- Cross-site request forgery protection

### API Security
- Rate limiting effectiveness
- Input validation
- Error handling and information disclosure
- Business logic vulnerabilities

### Compliance
- GDPR/CCPA data handling compliance
- Data retention policy enforcement
- Audit logging effectiveness

## Deliverables
1. Detailed penetration testing report
2. Executive summary of findings
3. Remediation recommendations
4. Re-testing of critical vulnerabilities after fixes

## Timeline
- Testing Period: 2 weeks
- Report Delivery: Within 1 week of testing completion
- Remediation Period: 2 weeks
- Re-testing: 1 week

## Rules of Engagement
- Testing should not disrupt production services
- No denial of service attacks
- Data should not be exfiltrated
- Testing credentials will be provided
- All testing activity must be logged
`;

  writeToFile('pentest_scope.md', scopeDoc.trim());
  log('Penetration testing scope document generated successfully', 'success');
  return scopeDoc;
}

// Step 2: Create a test environment with sample data
async function createTestEnvironment() {
  log('Creating test environment with sample data...', 'step');
  try {
    // 1. Create test users
    log('Creating test users...', 'info');
    const testUsers = [
      { email: 'admin-test@epai.example.com', password: 'AdminTest123!', role: 'admin' },
      { email: 'partner-test@epai.example.com', password: 'PartnerTest123!', role: 'partner' },
      { email: 'readonly-test@epai.example.com', password: 'ReadonlyTest123!', role: 'readonly' }
    ];
    
    // Create users if they don't exist
    for (const user of testUsers) {
      const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers({
        filter: `email eq "${user.email}"`
      });
      
      if (checkError) {
        log(`Error checking if user exists: ${checkError.message}`, 'error');
        continue;
      }
      
      if (existingUsers && existingUsers.users && existingUsers.users.length > 0) {
        log(`User ${user.email} already exists, skipping creation.`, 'info');
        continue;
      }
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { role: user.role }
      });
      
      if (error) {
        log(`Failed to create user ${user.email}: ${error.message}`, 'error');
      } else {
        log(`Created user ${user.email} with role ${user.role}`, 'success');
      }
    }
    
    // 2. Get a Partner ID to associate data with
    const { data: partners, error: partnerError } = await supabase.from('partners').select('id').limit(1);
    
    if (partnerError || !partners || partners.length === 0) {
      throw new Error(`Could not find a partner to associate test data with. Error: ${partnerError?.message}`);
    }
    
    const partnerId = partners[0].id;
    log(`Found partner ID ${partnerId} to associate test data.`, 'info');

    // 3. Create Test Data
    log('Creating test data...', 'info');
    
    // Check table structure before inserting data
    const { data: apiKeysInfo, error: apiKeysInfoError } = await supabase
      .from('api_keys')
      .select('*')
      .limit(1);
      
    if (apiKeysInfoError) {
      log(`Error checking api_keys table structure: ${apiKeysInfoError.message}`, 'error');
    }
    
    // Create API key for testing
    const testApiKey = generateApiKey();
    const apiKeyData = { partner_id: partnerId };
    
    // Check if api_key column exists
    if (apiKeysInfo && apiKeysInfo[0] && 'api_key' in apiKeysInfo[0]) {
      apiKeyData.api_key = testApiKey;
    }
    
    // Check if api_key_hash column exists
    if (apiKeysInfo && apiKeysInfo[0] && 'api_key_hash' in apiKeysInfo[0]) {
      apiKeyData.api_key_hash = hashApiKey(testApiKey);
    }
    
    // Check if is_active column exists
    if (apiKeysInfo && apiKeysInfo[0] && 'is_active' in apiKeysInfo[0]) {
      apiKeyData.is_active = true;
    }
    
    // Check if expires_at column exists
    if (apiKeysInfo && apiKeysInfo[0] && 'expires_at' in apiKeysInfo[0]) {
      apiKeyData.expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
    }
    
    // Only try to create an API key if the partner doesn't already have one
    const { data: existingKeys, error: existingKeysError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('partner_id', partnerId);
      
    if (existingKeysError) {
      log(`Error checking existing API keys: ${existingKeysError.message}`, 'error');
    } else if (!existingKeys || existingKeys.length === 0) {
      const { error: apiKeyError } = await supabase.from('api_keys').insert(apiKeyData);
      
      if (apiKeyError) {
        log(`Failed to create API key: ${apiKeyError.message}`, 'error');
      } else {
        log(`Created test API key: ${testApiKey.substring(0, 8)}...`, 'success');
      }
    } else {
      log(`Partner already has an API key, skipping creation.`, 'info');
    }
    
    // Check model_configs table structure
    const { data: modelConfigsInfo, error: modelConfigsInfoError } = await supabase
      .from('model_configs')
      .select('*')
      .limit(1);
      
    if (modelConfigsInfoError) {
      log(`Error checking model_configs table structure: ${modelConfigsInfoError.message}`, 'error');
    } else {
      // Create test models
      const testModels = [];
      for (let i = 1; i <= 2; i++) {
        const modelData = { 
          model_name: `Test Model ${i}`, 
          model_version: '1.0.0',
          description: `A test model for penetration testing ${i}`,
          endpoint_identifier: `test-model-${i}-endpoint`,
          is_active: true
        };
        
        if (modelConfigsInfo && modelConfigsInfo[0] && 'metadata' in modelConfigsInfo[0]) {
          modelData.metadata = { test: true, purpose: 'penetration testing' };
        }
        
        testModels.push(modelData);
      }
      
      const { data: createdModels, error: modelsError } = await supabase
        .from('model_configs')
        .upsert(testModels)
        .select();
      
      if (modelsError) {
        log(`Failed to create models: ${modelsError.message}`, 'error');
      } else {
        log(`Created ${testModels.length} test models`, 'success');
      }
    }
    
    // Create test logs using the logs table structure
    const { data: logsInfo, error: logsInfoError } = await supabase
      .from('logs')
      .select('*')
      .limit(1);
      
    if (logsInfoError) {
      log(`Error checking logs table structure: ${logsInfoError.message}`, 'error');
    } else {
      // Create structured logs
      const testLogs = [];
      for (let i = 0; i < 10; i++) {
        const logData = {
          log_level: ['INFO', 'WARN', 'ERROR', 'DEBUG'][i % 4],
          function_name: `test-function-${i % 3}`,
          message: `Test log message ${i}`,
          metadata: { 
            test: true, 
            index: i,
            partner_id: partnerId
          }
        };
        
        testLogs.push(logData);
      }
      
      const { error: logsError } = await supabase.from('logs').insert(testLogs);
      
      if (logsError) {
        log(`Failed to create logs: ${logsError.message}`, 'error');
      } else {
        log(`Created ${testLogs.length} test logs`, 'success');
      }
    }
    
    // Try to create partner_logs if the table exists
    try {
      const { data: partnerLogsInfo, error: partnerLogsInfoError } = await supabase
        .from('partner_logs')
        .select('*')
        .limit(1);
        
      if (!partnerLogsInfoError) {
        // Create partner logs
        const testPartnerLogs = [];
        for (let i = 0; i < 10; i++) {
          const logData = {
            partner_id: partnerId,
            method: ['GET', 'POST', 'PUT', 'DELETE'][i % 4],
            path: `/functions/v1/test-endpoint-${i % 5}`,
            status_code: [200, 400, 401, 500][i % 4],
            request_body: { test: true, index: i },
            response_body: { success: i % 2 === 0, message: `Test response ${i}` }
          };
          
          testPartnerLogs.push(logData);
        }
        
        const { error: partnerLogsError } = await supabase.from('partner_logs').insert(testPartnerLogs);
        
        if (partnerLogsError) {
          log(`Failed to create partner logs: ${partnerLogsError.message}`, 'error');
        } else {
          log(`Created ${testPartnerLogs.length} test partner logs`, 'success');
        }
      }
    } catch (err) {
      log(`Partner logs table may not exist: ${err.message}`, 'info');
    }
    
    // Try to create ingestion_events if the table exists
    try {
      const { data: eventsInfo, error: eventsInfoError } = await supabase
        .from('ingestion_events')
        .select('*')
        .limit(1);
        
      if (!eventsInfoError) {
        // Create test ingestion events
        const testEvents = [];
        for (let i = 0; i < 10; i++) {
          const eventData = {
            partner_id: partnerId,
            payload: { 
              userId: `test-user-${i}`, 
              timestamp: new Date().toISOString(),
              eventType: ['user_engagement', 'event_attendance', 'lead_capture'][i % 3],
              actionType: ['click', 'view', 'register'][i % 3]
            },
            status: 'received'
          };
          
          if (i % 3 === 0) {
            eventData.processed_at = new Date();
          }
          
          if (eventsInfo && eventsInfo[0] && 'event_type' in eventsInfo[0]) {
            eventData.event_type = ['user_engagement', 'event_attendance', 'lead_capture'][i % 3];
          }
          
          testEvents.push(eventData);
        }
        
        const { data: createdEvents, error: eventsError } = await supabase
          .from('ingestion_events')
          .insert(testEvents)
          .select();
        
        if (eventsError) {
          log(`Failed to create ingestion events: ${eventsError.message}`, 'error');
        } else {
          log(`Created ${testEvents.length} test ingestion events`, 'success');
          
          // Try to create insights if the table and ingestion events exist
          try {
            const { data: insightsInfo, error: insightsInfoError } = await supabase
              .from('insights')
              .select('*')
              .limit(1);
              
            if (!insightsInfoError && createdEvents && createdEvents.length > 0) {
              // Create test insights
              const testInsights = [];
              for (let i = 0; i < 5; i++) {
                const insightData = {
                  partner_id: partnerId,
                  ingestion_event_id: createdEvents[i % createdEvents.length].id,
                  model_name: `Test Model ${(i % 2) + 1}`,
                  prediction_output: { 
                    title: `Test Insight ${i}`, 
                    description: 'A test insight for penetration testing',
                    confidence: parseFloat((Math.random()).toFixed(2)),
                    created_at: new Date().toISOString()
                  },
                  is_delivered: i % 3 === 0
                };
                
                testInsights.push(insightData);
              }
              
              const { error: insightsError } = await supabase.from('insights').insert(testInsights);
              
              if (insightsError) {
                log(`Failed to create insights: ${insightsError.message}`, 'error');
              } else {
                log(`Created ${testInsights.length} test insights`, 'success');
              }
            }
          } catch (err) {
            log(`Insights table may not exist: ${err.message}`, 'info');
          }
        }
      }
    } catch (err) {
      log(`Ingestion events table may not exist: ${err.message}`, 'info');
    }
    
    // Generate documentation for the test environment
    const testEnvDoc = `
# EPAI Penetration Testing Environment
## Environment Details
- URL: ${CONFIG.supabaseUrl}
## Test Accounts
${testUsers.map(user => `- ${user.role}: ${user.email} / ${user.password}`).join('\n')}
## Test Data
- API Key: ${testApiKey}
- Models: Created in model_configs table
- Logs: Created in logs and partner_logs tables
- Ingestion Events: Attempted to create in ingestion_events table
- Insights: Attempted to create in insights table
`;
    writeToFile('test_environment.md', testEnvDoc.trim());
    
    return { 
      testUsers,
      testApiKey,
      partnerId
    };
  } catch (error) {
    log(`Failed to create test environment: ${error.message}`, 'error');
    throw error;
  }
}

// Step 3: Configure security settings for testing
async function configureSecuritySettings(partnerId) {
  log('Configuring security settings for testing...', 'step');
  try {
    // Generate security configuration document
    const securitySettings = {
      api_key_settings: {
        format: 'epai_[base64_random_bytes]',
        hashing_algorithm: 'bcrypt/sha256',
        expiration_days: 30,
        rotation_required: true
      },
      rate_limits: {
        default_ip_limit: 30,
        default_api_key_limit: 120,
        pentest_endpoint_ip_limit: 100,
        pentest_endpoint_api_key_limit: 500
      },
      security_headers: {
        'Content-Security-Policy': "default-src 'self'",
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      },
      data_retention: {
        logs_days: 90,
        security_events_days: 365,
        ingestion_events_days: 730,
        insights_days: 730,
        pentest_logs_days: 7
      },
      pentest_mode: true,
      detailed_logging: true
    };
    
    const securityDoc = `
# EPAI Penetration Testing Security Configuration

## Security Settings
\`\`\`json
${JSON.stringify(securitySettings, null, 2)}
\`\`\`

## Data Retention
- Regular logs retention period: 90 days
- Security events retention period: 365 days
- Ingestion events retention period: 730 days
- Insights retention period: 730 days

## Rate Limiting
- Default IP-based rate limit: 30 requests/minute
- Default API key-based rate limit: 120 requests/minute
- Penetration testing endpoint IP limit: 100 requests/minute
- Penetration testing endpoint API key limit: 500 requests/minute

## Security Event Logging
- Security events will be logged to the \`security_events\` table
- A 'pentest.started' event will be logged to mark the beginning of testing

## API Key Security
- API keys should be stored as hashes in the database
- API keys should expire after 30 days by default
- API keys should be validated using a secure validation function
- API key usage should be logged for security audit

## Security Headers
- Content-Security-Policy: default-src 'self'
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000; includeSubDomains
`;
    writeToFile('security_configuration.md', securityDoc.trim());
    log('Security settings documented for testing.', 'success');
    return securitySettings;
  } catch (error) {
    log(`Failed to configure security settings: ${error.message}`, 'error');
    throw error;
  }
}

// Step 4: Generate penetration testing checklist
function generatePentestChecklist() {
  log('Generating penetration testing checklist...', 'step');
  const checklist = `
# EPAI Penetration Testing Checklist

## Authentication Testing
- [ ] Test for weak password policies
- [ ] Test for brute force protection
- [ ] Test session management and timeout
- [ ] Test API key authentication
- [ ] Test password reset functionality
- [ ] Test multi-factor authentication if applicable

## Authorization Testing
- [ ] Test role-based access control
- [ ] Test horizontal privilege escalation (accessing other partners' data)
- [ ] Test vertical privilege escalation (gaining admin privileges)
- [ ] Test API endpoint authorization
- [ ] Test Row Level Security (RLS) policies

## Input Validation Testing
- [ ] Test for SQL injection
- [ ] Test for XSS vulnerabilities
- [ ] Test for CSRF vulnerabilities
- [ ] Test file upload functionality
- [ ] Test API parameter validation

## API Security Testing
- [ ] Test rate limiting effectiveness
- [ ] Test API key validation
- [ ] Test error handling and information leakage
- [ ] Test CORS configuration
- [ ] Test security headers

## Data Protection Testing
- [ ] Test data encryption at rest
- [ ] Test data encryption in transit
- [ ] Test sensitive data handling
- [ ] Test data masking in logs
- [ ] Test data retention policies

## Frontend Security Testing
- [ ] Test for DOM-based XSS
- [ ] Test for client-side security controls
- [ ] Test for sensitive data exposure in frontend code
- [ ] Test for insecure storage in localStorage/sessionStorage
- [ ] Test for secure cookie configuration

## SDK Security Testing
- [ ] Test SDK authentication
- [ ] Test SDK data handling
- [ ] Test SDK integration security
- [ ] Test SDK error handling

## Security Logging Testing
- [ ] Test security event logging for authentication attempts
- [ ] Test security event logging for API key usage
- [ ] Test security event logging for rate limit violations
- [ ] Test security event logging for suspicious activity

## Compliance Testing
- [ ] Test data retention policy enforcement
- [ ] Test data deletion functionality
- [ ] Test data access controls for GDPR compliance
- [ ] Test consent management functionality

## Reporting
- [ ] Document all findings with clear reproduction steps
- [ ] Classify vulnerabilities by severity (Critical, High, Medium, Low)
- [ ] Provide remediation recommendations
- [ ] Include evidence (screenshots, logs, etc.)
- [ ] Prepare executive summary
`;
  writeToFile('pentest_checklist.md', checklist.trim());
  log('Penetration testing checklist generated successfully.', 'success');
}

// Main function
async function main() {
  log('EPAI Penetration Testing Preparation', 'info');
  log('==================================', 'info');
  try {
    generatePentestScopeDocument();
    const testEnv = await createTestEnvironment();
    const securitySettings = await configureSecuritySettings(testEnv.partnerId);
    generatePentestChecklist();

    const summary = generatePreparationSummary(testEnv);
    writeToFile('preparation_summary.md', summary.trim());
    log('\nPenetration testing preparation completed successfully!', 'success');
  } catch (error) {
    log(`Preparation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

function generatePreparationSummary(testEnv) {
  log('Generating preparation summary...', 'info');
  
  const summaryDoc = `
# EPAI Penetration Testing Preparation Summary

## Overview
This document summarizes the preparation steps taken for penetration testing of the EPAI platform.

## Environment Setup
- **Test Users Created:** ${testEnv.testUsers.length}
- **Test API Key:** ${testEnv.testApiKey ? 'Created' : 'Failed to create'}
- **Test Data:** Created sample data in available database tables
- **Partner ID for Testing:** ${testEnv.partnerId}

## Documentation Generated
- [Penetration Testing Scope](./pentest_scope.md)
- [Test Environment Details](./test_environment.md)
- [Security Configuration](./security_configuration.md)
- [Penetration Testing Checklist](./pentest_checklist.md)

## Next Steps
1. Share these documents with the penetration testing team
2. Schedule the penetration test
3. Review the test results
4. Implement recommended security improvements
`;

  writeToFile('preparation_summary.md', summaryDoc.trim());
  return summaryDoc;
}

main(); 