#!/usr/bin/env node

/**
 * EPAI Alert System Deployment
 * 
 * This script deploys the alert system by:
 * 1. Deploying the exec-sql Edge Function
 * 2. Applying the SQL file to create the necessary tables and functions
 * 3. Importing the alert configurations from the alert-config directory
 * 
 * Usage:
 * node scripts/deploy-alert-system.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Console styling
const info = (text) => console.log(`ℹ ${text}`);
const success = (text) => console.log(`✓ ${text}`);
const error = (text) => console.error(`✗ ${text}`);
const step = (text) => console.log(`➤ ${text}`);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, 'test.env') });

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration paths
const configDir = path.resolve(__dirname, 'alert-config');
const notificationChannelsPath = path.join(configDir, 'notification-channels.json');
const databaseAlertsPath = path.join(configDir, 'database-alerts.json');
const apiAlertsPath = path.join(configDir, 'api-alerts.json');
const securityAlertsPath = path.join(configDir, 'security-alerts.json');
const sqlFilePath = path.resolve(__dirname, 'create-alert-tables.sql');

// Promisify exec
const execAsync = promisify(exec);

// Helper function to read JSON files
function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    error(`Failed to read file ${filePath}: ${err.message}`);
    throw err;
  }
}

// Deploy exec-sql Edge Function
async function deployExecSqlFunction() {
  step('Deploying exec-sql Edge Function...');
  
  try {
    // Check if the exec-sql function exists
    try {
      await execAsync('cd .. && supabase functions deploy exec-sql');
      success('exec-sql Edge Function deployed successfully');
      return;
    } catch (err) {
      info('exec-sql Edge Function not deployed, creating it...');
    }
    
    // Create the function using the create-exec-sql-function.js script
    await execAsync('node create-exec-sql-function.js');
    success('exec-sql Edge Function created and deployed successfully');
  } catch (err) {
    error(`Failed to deploy exec-sql Edge Function: ${err.message}`);
    throw err;
  }
}

// Apply SQL file using exec-sql function
async function applySqlFile() {
  step('Applying SQL file...');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL file into separate statements
    const statements = sql.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement separately
    for (const statement of statements) {
      try {
        // Try using the exec-sql Edge Function
        const { data, error: functionError } = await supabase.functions.invoke('exec-sql', {
          body: { sql: statement }
        });
        
        if (functionError) {
          throw new Error(`Function error: ${functionError.message}`);
        }
        
        info(`Successfully executed SQL statement: ${statement.substring(0, 50)}...`);
      } catch (stmtErr) {
        error(`Failed to execute SQL statement: ${stmtErr.message}`);
        error(`Statement: ${statement}`);
        throw stmtErr;
      }
    }
    
    success('SQL file applied successfully');
  } catch (err) {
    error(`Failed to apply SQL file: ${err.message}`);
    throw err;
  }
}

// Import notification channels
async function importNotificationChannels() {
  step('Importing notification channels...');
  
  try {
    const channels = readJsonFile(notificationChannelsPath);
    
    for (const channel of channels) {
      // Insert directly using SQL to avoid issues with tables not existing
      const insertSql = `
      INSERT INTO notification_channels (name, type, config, enabled)
      VALUES ('${channel.name}', '${channel.type}', '${JSON.stringify(channel.config)}', ${channel.enabled})
      ON CONFLICT (name) 
      DO UPDATE SET 
        type = EXCLUDED.type,
        config = EXCLUDED.config,
        enabled = EXCLUDED.enabled,
        updated_at = NOW()
      RETURNING id;
      `;
      
      try {
        const { data, error: functionError } = await supabase.functions.invoke('exec-sql', {
          body: { sql: insertSql }
        });
        
        if (functionError) {
          throw new Error(`Function error: ${functionError.message}`);
        }
        
        success(`Imported notification channel: ${channel.name}`);
      } catch (insertErr) {
        error(`Failed to import notification channel ${channel.name}: ${insertErr.message}`);
        throw insertErr;
      }
    }
    
    success('Notification channels imported successfully');
  } catch (err) {
    error(`Failed to import notification channels: ${err.message}`);
    throw err;
  }
}

// Import alert definitions
async function importAlertDefinitions() {
  step('Importing alert definitions...');
  
  try {
    // Read all alert files
    const databaseAlerts = readJsonFile(databaseAlertsPath);
    const apiAlerts = readJsonFile(apiAlertsPath);
    const securityAlerts = readJsonFile(securityAlertsPath);
    
    // Combine all alerts
    const allAlerts = [...databaseAlerts, ...apiAlerts, ...securityAlerts];
    
    for (const alert of allAlerts) {
      // Escape single quotes in SQL
      const escapedQuery = alert.query.replace(/'/g, "''");
      const escapedDescription = alert.description.replace(/'/g, "''");
      const channelsArray = JSON.stringify(alert.notification_channels).replace(/"/g, "'");
      
      // Insert directly using SQL to avoid issues with tables not existing
      const insertSql = `
      INSERT INTO alert_definitions (name, description, query, threshold, frequency, severity, notification_channels)
      VALUES ('${alert.name}', '${escapedDescription}', '${escapedQuery}', ${alert.threshold}, '${alert.frequency}', '${alert.severity}', ARRAY${channelsArray})
      ON CONFLICT (name) 
      DO UPDATE SET 
        description = EXCLUDED.description,
        query = EXCLUDED.query,
        threshold = EXCLUDED.threshold,
        frequency = EXCLUDED.frequency,
        severity = EXCLUDED.severity,
        notification_channels = EXCLUDED.notification_channels,
        updated_at = NOW()
      RETURNING id;
      `;
      
      try {
        const { data, error: functionError } = await supabase.functions.invoke('exec-sql', {
          body: { sql: insertSql }
        });
        
        if (functionError) {
          throw new Error(`Function error: ${functionError.message}`);
        }
        
        success(`Imported alert definition: ${alert.name}`);
      } catch (insertErr) {
        error(`Failed to import alert definition ${alert.name}: ${insertErr.message}`);
        throw insertErr;
      }
    }
    
    success('Alert definitions imported successfully');
  } catch (err) {
    error(`Failed to import alert definitions: ${err.message}`);
    throw err;
  }
}

// Copy documentation to docs directory
async function copyDocumentation() {
  step('Copying documentation...');
  
  try {
    // Create docs/monitoring directory if it doesn't exist
    const monitoringDir = path.resolve(__dirname, '..', 'docs', 'monitoring');
    if (!fs.existsSync(monitoringDir)) {
      fs.mkdirSync(monitoringDir, { recursive: true });
    }
    
    // Copy alert documentation
    const alertDocPath = path.join(configDir, 'alerts-documentation.md');
    const destDocPath = path.join(monitoringDir, 'alerts.md');
    
    if (fs.existsSync(alertDocPath)) {
      fs.copyFileSync(alertDocPath, destDocPath);
      success(`Documentation copied to ${destDocPath}`);
    }
    
    // Create README.md if it doesn't exist
    const readmePath = path.join(monitoringDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
      const readmeContent = `# Monitoring System

## Overview
The EPAI platform includes a comprehensive monitoring and alerting system that helps ensure the stability and security of the platform. This system includes:

1. **Monitoring Dashboards**: Grafana dashboards for database, API, and security metrics
2. **Alert System**: Automated alerts for critical issues with configurable thresholds
3. **Notification Channels**: Email and Slack notifications for immediate response
4. **Documentation**: Comprehensive documentation for maintenance and troubleshooting

## Alert System
The alert system is designed to detect and notify administrators of critical issues across the platform. For detailed information about the available alerts, see [alerts.md](./alerts.md).

## Notification Channels
The system supports multiple notification channels:
- Email notifications
- Slack notifications

## Monitoring Dashboard
The monitoring dashboard provides real-time visibility into the platform's performance and health. It includes:
- Database metrics (CPU, memory, connections)
- API metrics (requests, errors, latency)
- Security metrics (authentication attempts, rate limit violations)

## Maintenance
Regular maintenance of the monitoring system is essential to ensure its effectiveness. This includes:
- Reviewing and updating alert thresholds
- Verifying notification channel configurations
- Adding new alerts as needed
`;
      fs.writeFileSync(readmePath, readmeContent);
      success(`README.md created at ${readmePath}`);
    }
    
    // Create setup-summary.md
    const summaryPath = path.join(monitoringDir, 'setup-summary.md');
    const summaryContent = `# Monitoring System Setup Summary

## Components Deployed

### Database Tables
- \`notification_channels\`: Stores configuration for notification delivery methods
- \`alert_definitions\`: Stores alert rules, thresholds, and notification targets
- \`alert_history\`: Records alert trigger events and resolution status
- \`notification_logs\`: Tracks notification delivery attempts and status

### Database Functions
- \`check_alerts()\`: Evaluates all alert definitions against current system state
- \`send_alert_notifications()\`: Processes triggered alerts and sends notifications
- \`schedule_alerts()\`: Main entry point that runs checks and sends notifications

### Alert Categories
1. **Database Alerts**: Monitor database health, performance, and capacity
2. **API Alerts**: Monitor API performance, error rates, and usage patterns
3. **Security Alerts**: Monitor authentication attempts, rate limit violations, and suspicious activities

## Notification Channels
- **Admin Email**: Critical alerts sent to administrator email
- **Team Slack**: All alerts sent to team Slack channel

## Next Steps
1. **Schedule Alert Checks**: Configure a scheduled job to run \`SELECT schedule_alerts()\` every 5 minutes
2. **Create Monitoring Dashboard**: Set up Grafana dashboard to visualize metrics
3. **Test Alert System**: Trigger test alerts to verify notification delivery
4. **Document Alert Response**: Create runbooks for responding to different alert types

## Maintenance Tasks
- Review alert thresholds monthly and adjust as needed
- Verify notification channel configuration quarterly
- Archive alert history older than 90 days
`;
    fs.writeFileSync(summaryPath, summaryContent);
    success(`Setup summary created at ${summaryPath}`);
  } catch (err) {
    error(`Failed to copy documentation: ${err.message}`);
    throw err;
  }
}

// Main function
async function main() {
  info('EPAI Alert System Deployment');
  info('===========================');
  
  try {
    // Deploy exec-sql Edge Function
    await deployExecSqlFunction();
    
    // Apply SQL file
    await applySqlFile();
    
    // Import notification channels
    await importNotificationChannels();
    
    // Import alert definitions
    await importAlertDefinitions();
    
    // Copy documentation
    await copyDocumentation();
    
    success('Alert system deployment completed successfully!');
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 