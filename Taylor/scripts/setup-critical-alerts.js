#!/usr/bin/env node

/**
 * EPAI Critical Alerts Setup Script
 * 
 * This script sets up alerting for critical issues in the EPAI platform.
 * 
 * Usage:
 * node scripts/setup-critical-alerts.js
 */

console.log('Setting up critical alerts...');

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  outputDir: path.join(process.cwd(), 'alert-config'),
};

// Check required environment variables
if (!CONFIG.supabaseKey) {
  console.error(chalk.red('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required'));
  console.error(chalk.yellow('Please run:'));
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
  log(`File written: ${filePath}`, 'success');
  return filePath;
}

// Function to set up database alerts
async function setupDatabaseAlerts() {
  log('Setting up database alerts...', 'step');
  
  try {
    // Create alerts table if it doesn't exist
    let tableError = null;
    
    try {
      await supabase
        .from('alerts_config')
        .select('id')
        .limit(1);
    } catch (error) {
      // If the table doesn't exist, create it
      const result = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            CREATE TABLE IF NOT EXISTS alerts_config (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT,
              query TEXT NOT NULL,
              threshold NUMERIC NOT NULL,
              frequency INTERVAL NOT NULL,
              severity TEXT NOT NULL,
              enabled BOOLEAN DEFAULT true,
              notification_channels JSONB DEFAULT '[]'::jsonb,
              last_triggered TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS alert_history (
              id SERIAL PRIMARY KEY,
              alert_id INTEGER REFERENCES alerts_config(id),
              triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              value NUMERIC,
              resolved_at TIMESTAMP WITH TIME ZONE,
              resolution_note TEXT
            );
          `
        }
      });
      
      if (result.error) {
        tableError = result.error;
      }
    }
    
    if (tableError) {
      throw new Error(`Failed to create alerts tables: ${tableError.message}`);
    }
    
    // Define critical database alerts
    const databaseAlerts = [
      {
        name: 'High Database CPU Usage',
        description: 'Alert when database CPU usage exceeds 80% for 5 minutes',
        query: `
          SELECT COALESCE(MAX(cpu_usage), 0) as value
          FROM pg_stat_activity_monitor
          WHERE collected_at > NOW() - INTERVAL '5 minutes'
        `,
        threshold: 80,
        frequency: '5 minutes',
        severity: 'critical',
        notification_channels: ['email', 'slack']
      },
      {
        name: 'Low Disk Space',
        description: 'Alert when available disk space falls below 10%',
        query: `
          SELECT COALESCE(MIN(available_percent), 100) as value
          FROM pg_disk_usage
          WHERE collected_at > NOW() - INTERVAL '5 minutes'
        `,
        threshold: 10,
        frequency: '5 minutes',
        severity: 'critical',
        notification_channels: ['email', 'slack']
      },
      {
        name: 'High Connection Count',
        description: 'Alert when database connections exceed 80% of maximum',
        query: `
          SELECT 
            (COUNT(*) * 100 / current_setting('max_connections')::int) as value
          FROM pg_stat_activity
        `,
        threshold: 80,
        frequency: '5 minutes',
        severity: 'warning',
        notification_channels: ['email']
      },
      {
        name: 'Long-Running Queries',
        description: 'Alert when queries run for more than 30 seconds',
        query: `
          SELECT COUNT(*) as value
          FROM pg_stat_activity
          WHERE state = 'active'
            AND NOW() - query_start > INTERVAL '30 seconds'
            AND query NOT ILIKE '%pg_stat_activity%'
        `,
        threshold: 0,
        frequency: '1 minute',
        severity: 'warning',
        notification_channels: ['email']
      },
      {
        name: 'High Transaction ID Wraparound',
        description: 'Alert when transaction ID wraparound is approaching',
        query: `
          SELECT 
            EXTRACT(EPOCH FROM (
              NOW() - pg_xact_commit_timestamp(xmin)
            ))/86400 as value
          FROM pg_class
          ORDER BY ctid DESC
          LIMIT 1
        `,
        threshold: 1500, // Alert when oldest transaction is older than 1500 days
        frequency: '1 day',
        severity: 'critical',
        notification_channels: ['email', 'slack']
      }
    ];
    
    // Insert alerts
    for (const alert of databaseAlerts) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO alerts_config (
            name, description, query, threshold, frequency, severity, notification_channels
          ) VALUES (
            $1, $2, $3, $4, $5::interval, $6, $7::jsonb
          )
          ON CONFLICT (name) DO UPDATE SET
            description = $2,
            query = $3,
            threshold = $4,
            frequency = $5::interval,
            severity = $6,
            notification_channels = $7::jsonb,
            updated_at = NOW()
        `,
        params: [
          alert.name,
          alert.description,
          alert.query,
          alert.threshold,
          alert.frequency,
          alert.severity,
          JSON.stringify(alert.notification_channels)
        ]
      });
      
      if (error) {
        log(`Failed to create alert ${alert.name}: ${error.message}`, 'error');
      } else {
        log(`Created/updated alert: ${alert.name}`, 'success');
      }
    }
    
    // Create alert checking function
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION check_alerts()
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          v_alert RECORD;
          v_result RECORD;
          v_triggered BOOLEAN;
        BEGIN
          FOR v_alert IN SELECT * FROM alerts_config WHERE enabled = true LOOP
            -- Check if it's time to evaluate this alert
            IF v_alert.last_triggered IS NULL OR 
               NOW() - v_alert.last_triggered >= v_alert.frequency THEN
              
              -- Execute the alert query
              EXECUTE v_alert.query INTO v_result;
              
              -- Check if threshold is exceeded
              IF v_alert.name LIKE 'Low %' THEN
                -- For "Low" alerts, trigger when value falls below threshold
                v_triggered := v_result.value <= v_alert.threshold;
              ELSE
                -- For other alerts, trigger when value exceeds threshold
                v_triggered := v_result.value >= v_alert.threshold;
              END IF;
              
              -- If triggered, record it
              IF v_triggered THEN
                INSERT INTO alert_history (alert_id, value)
                VALUES (v_alert.id, v_result.value);
                
                -- Update last_triggered time
                UPDATE alerts_config
                SET last_triggered = NOW()
                WHERE id = v_alert.id;
                
                -- Here you would add code to send notifications
                -- This would typically call an external notification service
              END IF;
            END IF;
          END LOOP;
        END;
        $$;
        
        -- Comment out the pg_cron job creation as it requires superuser privileges
        -- This would typically be done by Supabase support for hosted instances
        -- SELECT cron.schedule('* * * * *', 'SELECT check_alerts()');
      `
    });
    
    if (functionError) {
      throw new Error(`Failed to create alert checking function: ${functionError.message}`);
    }
    
    log('Database alerts set up successfully', 'success');
    
    return databaseAlerts;
  } catch (error) {
    log(`Failed to set up database alerts: ${error.message}`, 'error');
    throw error;
  }
}

async function setupApiAlerts() {
  log('Setting up API alerts...', 'step');
  
  try {
    // Define API alerts
    const apiAlerts = [
      {
        name: 'High API Error Rate',
        description: 'Alert when API error rate exceeds 5% over 5 minutes',
        query: `
          SELECT 
            CASE 
              WHEN COUNT(*) = 0 THEN 0
              ELSE (SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) * 100.0 / COUNT(*))
            END as value
          FROM logs
          WHERE created_at > NOW() - INTERVAL '5 minutes'
            AND path LIKE '/api/%'
        `,
        threshold: 5,
        frequency: '5 minutes',
        severity: 'critical',
        notification_channels: ['email', 'slack']
      },
      {
        name: 'API Latency',
        description: 'Alert when API response time exceeds 500ms on average over 5 minutes',
        query: `
          SELECT COALESCE(AVG(duration_ms), 0) as value
          FROM logs
          WHERE created_at > NOW() - INTERVAL '5 minutes'
            AND path LIKE '/api/%'
        `,
        threshold: 500,
        frequency: '5 minutes',
        severity: 'warning',
        notification_channels: ['email']
      },
      {
        name: 'API Traffic Spike',
        description: 'Alert when API traffic exceeds 1000 requests per minute',
        query: `
          SELECT COUNT(*) as value
          FROM logs
          WHERE created_at > NOW() - INTERVAL '1 minute'
            AND path LIKE '/api/%'
        `,
        threshold: 1000,
        frequency: '1 minute',
        severity: 'warning',
        notification_channels: ['email']
      }
    ];
    
    // Insert alerts
    for (const alert of apiAlerts) {
      const { data, error } = await supabase
        .from('alerts_config')
        .upsert({
          name: alert.name,
          description: alert.description,
          query: alert.query,
          threshold: alert.threshold,
          frequency: alert.frequency,
          severity: alert.severity,
          notification_channels: alert.notification_channels
        }, {
          onConflict: 'name'
        })
        .select();
      
      if (error) {
        log(`Failed to create alert ${alert.name}: ${error.message}`, 'error');
      } else {
        log(`Created/updated alert: ${alert.name}`, 'success');
      }
    }
    
    log('API alerts setup completed', 'success');
    return apiAlerts;
  } catch (error) {
    log(`Failed to set up API alerts: ${error.message}`, 'error');
    throw error;
  }
}

async function setupSecurityAlerts() {
  log('Setting up security alerts...', 'step');
  
  try {
    // Define security alerts
    const securityAlerts = [
      {
        name: 'Authentication Failures',
        description: 'Alert when there are more than 5 authentication failures in 5 minutes',
        query: `
          SELECT COUNT(*) as value
          FROM security_events
          WHERE created_at > NOW() - INTERVAL '5 minutes'
            AND event_type = 'auth_failure'
        `,
        threshold: 5,
        frequency: '5 minutes',
        severity: 'warning',
        notification_channels: ['email', 'slack']
      },
      {
        name: 'API Key Validation Failures',
        description: 'Alert when there are more than 10 API key validation failures in 5 minutes',
        query: `
          SELECT COUNT(*) as value
          FROM security_events
          WHERE created_at > NOW() - INTERVAL '5 minutes'
            AND event_type = 'api_key_validation_failure'
        `,
        threshold: 10,
        frequency: '5 minutes',
        severity: 'warning',
        notification_channels: ['email']
      },
      {
        name: 'Rate Limit Violations',
        description: 'Alert when there are more than 20 rate limit violations in 5 minutes',
        query: `
          SELECT COUNT(*) as value
          FROM security_events
          WHERE created_at > NOW() - INTERVAL '5 minutes'
            AND event_type = 'rate_limit_violation'
        `,
        threshold: 20,
        frequency: '5 minutes',
        severity: 'warning',
        notification_channels: ['email']
      },
      {
        name: 'SQL Injection Attempts',
        description: 'Alert when there are any SQL injection attempts',
        query: `
          SELECT COUNT(*) as value
          FROM security_events
          WHERE created_at > NOW() - INTERVAL '5 minutes'
            AND event_type = 'sql_injection_attempt'
        `,
        threshold: 0,
        frequency: '5 minutes',
        severity: 'critical',
        notification_channels: ['email', 'slack']
      }
    ];
    
    // Insert alerts
    for (const alert of securityAlerts) {
      const { data, error } = await supabase
        .from('alerts_config')
        .upsert({
          name: alert.name,
          description: alert.description,
          query: alert.query,
          threshold: alert.threshold,
          frequency: alert.frequency,
          severity: alert.severity,
          notification_channels: alert.notification_channels
        }, {
          onConflict: 'name'
        })
        .select();
      
      if (error) {
        log(`Failed to create alert ${alert.name}: ${error.message}`, 'error');
      } else {
        log(`Created/updated alert: ${alert.name}`, 'success');
      }
    }
    
    log('Security alerts setup completed', 'success');
    return securityAlerts;
  } catch (error) {
    log(`Failed to set up security alerts: ${error.message}`, 'error');
    throw error;
  }
}

// Function to set up notification channels
async function setupNotificationChannels() {
  log('Setting up notification channels...', 'step');
  
  try {
    // Create notification_channels table if it doesn't exist
    let tableError = null;
    
    try {
      await supabase
        .from('notification_channels')
        .select('id')
        .limit(1);
    } catch (error) {
      // If the table doesn't exist, create it
      const result = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            CREATE TABLE IF NOT EXISTS notification_channels (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              type TEXT NOT NULL,
              config JSONB NOT NULL,
              enabled BOOLEAN DEFAULT true,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        }
      });
      
      if (result.error) {
        tableError = result.error;
      }
    }
    
    if (tableError) {
      throw new Error(`Failed to create notification channels table: ${tableError.message}`);
    }
    
    // Define notification channels
    const notificationChannels = [
      {
        name: 'Admin Email',
        type: 'email',
        config: {
          email: process.env.EMAIL_NOTIFICATION_ADDRESS || 'admin@epai-example.com',
          subject_prefix: '[EPAI ALERT]'
        },
        enabled: true
      },
      {
        name: 'Alerts Channel',
        type: 'slack',
        config: {
          webhook_url: process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX',
          channel: '#alerts'
        },
        enabled: true
      }
    ];
    
    // Insert notification channels
    for (const channel of notificationChannels) {
      try {
        const { error } = await supabase
          .from('notification_channels')
          .upsert({
            name: channel.name,
            type: channel.type,
            config: channel.config,
            enabled: channel.enabled
          }, {
            onConflict: 'name'
          });
        
        if (error) {
          log(`Failed to create notification channel ${channel.name}: ${error.message}`, 'error');
        } else {
          log(`Created/updated notification channel: ${channel.name}`, 'success');
        }
      } catch (error) {
        log(`Failed to create notification channel ${channel.name}: ${error.message}`, 'error');
      }
    }
    
    // Create notification sending function
    try {
      const result = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            CREATE OR REPLACE FUNCTION send_notification(
              channel_id INTEGER,
              subject TEXT,
              message TEXT,
              data JSONB DEFAULT '{}'::jsonb
            )
            RETURNS BOOLEAN
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            DECLARE
              v_channel RECORD;
              v_success BOOLEAN := false;
            BEGIN
              -- Get the notification channel
              SELECT * INTO v_channel FROM notification_channels WHERE id = channel_id;
              
              IF NOT FOUND THEN
                RAISE EXCEPTION 'Notification channel not found: %', channel_id;
              END IF;
              
              IF NOT v_channel.enabled THEN
                RETURN false;
              END IF;
              
              -- Insert notification record
              INSERT INTO notifications (
                channel_id, subject, message, data, status
              ) VALUES (
                channel_id, subject, message, data, 'pending'
              );
              
              -- In a real implementation, this would trigger a background job
              -- to send the notification via the appropriate channel
              
              RETURN true;
            EXCEPTION WHEN OTHERS THEN
              RETURN false;
            END;
            $$;
            
            -- Create notifications table if it doesn't exist
            CREATE TABLE IF NOT EXISTS notifications (
              id SERIAL PRIMARY KEY,
              channel_id INTEGER REFERENCES notification_channels(id),
              subject TEXT NOT NULL,
              message TEXT NOT NULL,
              data JSONB DEFAULT '{}'::jsonb,
              status TEXT NOT NULL,
              sent_at TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        }
      });
      
      if (result.error) {
        throw new Error(`Failed to create notification sending function: ${result.error.message}`);
      }
      
      log('Notification sending function created successfully', 'success');
    } catch (error) {
      throw new Error(`Failed to create notification sending function: ${error.message}`);
    }
    
    log('Notification channels set up successfully', 'success');
    
    return notificationChannels;
  } catch (error) {
    log(`Failed to set up notification channels: ${error.message}`, 'error');
    throw error;
  }
}

// Function to generate alert documentation
function generateAlertDocumentation(databaseAlerts, apiAlerts, securityAlerts, notificationChannels) {
  log('Generating alert documentation...', 'step');
  
  const documentation = `# EPAI Critical Alerts Configuration

## Overview
This document outlines the critical alerts configured for the EPAI platform.

## Alert Categories

### Database Alerts
${databaseAlerts.map(alert => `
#### ${alert.name}
- **Description:** ${alert.description}
- **Threshold:** ${alert.threshold}
- **Frequency:** ${alert.frequency}
- **Severity:** ${alert.severity}
- **Notification Channels:** ${alert.notification_channels.join(', ')}
`).join('')}

### API Alerts
${apiAlerts.map(alert => `
#### ${alert.name}
- **Description:** ${alert.description}
- **Threshold:** ${alert.threshold}
- **Frequency:** ${alert.frequency}
- **Severity:** ${alert.severity}
- **Notification Channels:** ${alert.notification_channels.join(', ')}
`).join('')}

### Security Alerts
${securityAlerts.map(alert => `
#### ${alert.name}
- **Description:** ${alert.description}
- **Threshold:** ${alert.threshold}
- **Frequency:** ${alert.frequency}
- **Severity:** ${alert.severity}
- **Notification Channels:** ${alert.notification_channels.join(', ')}
`).join('')}

## Notification Channels

${notificationChannels.map(channel => `
### ${channel.name}
- **Type:** ${channel.type}
- **Configuration:**
  - ${Object.entries(channel.config).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`).join('\n  - ')}
`).join('')}

## Alert Management

### Adding a New Alert
To add a new alert, insert a new record into the \`alerts_config\` table:

\`\`\`sql
INSERT INTO alerts_config (
  name, description, query, threshold, frequency, severity, notification_channels
) VALUES (
  'New Alert Name',
  'Description of the alert',
  'SQL query that returns a single numeric value',
  threshold_value,
  'interval (e.g., ''5 minutes'')',
  'severity (critical, warning, info)',
  '["email", "slack"]'::jsonb
);
\`\`\`

### Disabling an Alert
To disable an alert, update the \`enabled\` field:

\`\`\`sql
UPDATE alerts_config
SET enabled = false
WHERE name = 'Alert Name';
\`\`\`

### Viewing Alert History
To view the history of triggered alerts:

\`\`\`sql
SELECT
  a.name,
  a.severity,
  h.triggered_at,
  h.value,
  h.resolved_at
FROM alert_history h
JOIN alerts_config a ON h.alert_id = a.id
ORDER BY h.triggered_at DESC;
\`\`\`

## Monitoring the Alert System

To check if the alert system is functioning properly, you can:

1. View the alert configuration:
   \`\`\`sql
   SELECT * FROM alerts_config;
   \`\`\`

2. Check when alerts were last triggered:
   \`\`\`sql
   SELECT name, last_triggered FROM alerts_config;
   \`\`\`

3. Manually run the alert check function:
   \`\`\`sql
   SELECT check_alerts();
   \`\`\`
`;

  writeToFile('alerts_documentation.md', documentation);
  log('Alert documentation generated successfully', 'success');
}

// Main function
async function main() {
  log('EPAI Critical Alerts Setup', 'info');
  log('=========================', 'info');
  
  try {
    // Set up notification channels
    const notificationChannels = await setupNotificationChannels();
    
    // Set up database alerts
    const databaseAlerts = await setupDatabaseAlerts();
    
    // Set up API alerts
    const apiAlerts = await setupApiAlerts();
    
    // Set up security alerts
    const securityAlerts = await setupSecurityAlerts();
    
    // Generate alert documentation
    generateAlertDocumentation(databaseAlerts, apiAlerts, securityAlerts, notificationChannels);
    
    // Generate SQL script for pg_cron setup
    const pgCronScript = `
-- Enable pg_cron extension (requires superuser privileges)
-- This would typically be done by Supabase support for hosted instances
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the alert check function to run every minute
-- SELECT cron.schedule('* * * * *', 'SELECT check_alerts()');
    `;
    
    writeToFile('pg_cron_setup.sql', pgCronScript);
    
    log('\nCritical alerts setup completed successfully!', 'success');
    log('Alert documentation has been saved to the alert-config directory.', 'info');
    log('\nNext steps:', 'step');
    log('1. Review the generated alert documentation', 'info');
    log('2. Contact Supabase support to enable pg_cron extension', 'info');
    log('3. Configure actual notification endpoints (email, Slack, etc.)', 'info');
    log('4. Test the alert system by triggering test alerts', 'info');
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the main function
main();
