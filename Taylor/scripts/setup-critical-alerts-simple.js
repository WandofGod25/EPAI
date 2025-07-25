#!/usr/bin/env node

/**
 * EPAI Critical Alerts Setup (Simplified)
 * 
 * This script sets up the critical alerts for the EPAI platform.
 * It generates configuration files for notification channels and alert definitions.
 */

import fs from 'fs';
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

// Create the alert-config directory if it doesn't exist
const configDir = path.resolve(__dirname, 'alert-config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Set up notification channels
function setupNotificationChannels() {
  step('Setting up notification channels...');
  
  const channels = [
    {
      name: 'Admin Email',
      type: 'email',
      config: {
        email: 'admin@epai-platform.com',
        subject_prefix: '[EPAI ALERT]'
      },
      enabled: true
    },
    {
      name: 'Team Slack',
      type: 'slack',
      config: {
        webhook_url: 'https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX',
        channel: '#alerts'
      },
      enabled: true
    }
  ];
  
  const filePath = path.join(configDir, 'notification-channels.json');
  fs.writeFileSync(filePath, JSON.stringify(channels, null, 2));
  success(`File written: ${filePath}`);
  
  success('Notification channels setup completed');
}

// Set up database alerts
function setupDatabaseAlerts() {
  step('Setting up database alerts...');
  
  const alerts = [
    {
      name: 'High CPU Usage',
      description: 'Alert when database CPU usage exceeds 80% for 5 minutes',
      query: `SELECT COALESCE(MAX(cpu_usage), 0) as value FROM (
        SELECT (stats.cpu_usage * 100) as cpu_usage
        FROM pg_stat_activity stats
        WHERE stats.state = 'active'
      ) cpu_stats`,
      threshold: 80,
      frequency: 'every 5 minutes',
      severity: 'critical',
      notification_channels: ['Admin Email', 'Team Slack']
    },
    {
      name: 'Low Disk Space',
      description: 'Alert when database disk space is below 10%',
      query: `SELECT COALESCE((100 - (available_bytes * 100 / total_bytes)), 0) as value
      FROM pg_stat_file_tables
      WHERE tablename = 'pg_class'`,
      threshold: 90,
      frequency: 'hourly',
      severity: 'critical',
      notification_channels: ['Admin Email', 'Team Slack']
    },
    {
      name: 'High Connection Count',
      description: 'Alert when database connection count exceeds 80% of max connections',
      query: `SELECT COALESCE(
        (SELECT COUNT(*) FROM pg_stat_activity) * 100 / 
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'),
        0
      ) as value`,
      threshold: 80,
      frequency: 'every 15 minutes',
      severity: 'warning',
      notification_channels: ['Team Slack']
    },
    {
      name: 'Long Running Queries',
      description: 'Alert when queries run longer than 5 minutes',
      query: `SELECT COALESCE(
        COUNT(pid),
        0
      ) as value
      FROM pg_stat_activity
      WHERE state = 'active'
      AND now() - query_start > interval '5 minutes'`,
      threshold: 0,
      frequency: 'every 5 minutes',
      severity: 'warning',
      notification_channels: ['Team Slack']
    }
  ];
  
  const filePath = path.join(configDir, 'database-alerts.json');
  fs.writeFileSync(filePath, JSON.stringify(alerts, null, 2));
  success(`File written: ${filePath}`);
  
  success('Database alerts setup completed');
}

// Set up API alerts
function setupApiAlerts() {
  step('Setting up API alerts...');
  
  const alerts = [
    {
      name: 'High API Error Rate',
      description: 'Alert when API error rate exceeds 5% over 5 minutes',
      query: `SELECT COALESCE(
        SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0),
        0
      ) as value
      FROM logs
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND path LIKE '/api/%'`,
      threshold: 5,
      frequency: 'every 5 minutes',
      severity: 'critical',
      notification_channels: ['Admin Email', 'Team Slack']
    },
    {
      name: 'High API Latency',
      description: 'Alert when API average latency exceeds 500ms over 5 minutes',
      query: `SELECT COALESCE(
        AVG(response_time_ms),
        0
      ) as value
      FROM logs
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND path LIKE '/api/%'`,
      threshold: 500,
      frequency: 'every 5 minutes',
      severity: 'warning',
      notification_channels: ['Team Slack']
    },
    {
      name: 'Rate Limit Violations',
      description: 'Alert when rate limit violations exceed 10 in 5 minutes',
      query: `SELECT COALESCE(
        COUNT(*),
        0
      ) as value
      FROM logs
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND status_code = 429`,
      threshold: 10,
      frequency: 'every 5 minutes',
      severity: 'warning',
      notification_channels: ['Team Slack']
    },
    {
      name: 'Traffic Anomaly',
      description: 'Alert when API traffic is 50% higher than usual',
      query: `SELECT COALESCE(
        (
          SELECT COUNT(*) FROM logs
          WHERE created_at > NOW() - INTERVAL '5 minutes'
        ) * 100.0 / NULLIF(
          (
            SELECT AVG(count)
            FROM (
              SELECT COUNT(*) as count
              FROM logs
              WHERE created_at > NOW() - INTERVAL '1 day'
              GROUP BY DATE_TRUNC('hour', created_at)
            ) hourly_counts
          ),
          0
        ) - 100,
        0
      ) as value`,
      threshold: 50,
      frequency: 'every 5 minutes',
      severity: 'warning',
      notification_channels: ['Team Slack']
    }
  ];
  
  const filePath = path.join(configDir, 'api-alerts.json');
  fs.writeFileSync(filePath, JSON.stringify(alerts, null, 2));
  success(`File written: ${filePath}`);
  
  success('API alerts setup completed');
}

// Set up security alerts
function setupSecurityAlerts() {
  step('Setting up security alerts...');
  
  const alerts = [
    {
      name: 'Authentication Failures',
      description: 'Alert when authentication failures exceed 10 in 5 minutes',
      query: `SELECT COALESCE(
        COUNT(*),
        0
      ) as value
      FROM security_events
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND event_type = 'auth_failure'`,
      threshold: 10,
      frequency: 'every 5 minutes',
      severity: 'critical',
      notification_channels: ['Admin Email', 'Team Slack']
    },
    {
      name: 'API Key Validation Failures',
      description: 'Alert when API key validation failures exceed 10 in 5 minutes',
      query: `SELECT COALESCE(
        COUNT(*),
        0
      ) as value
      FROM security_events
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND event_type = 'api_key_validation_failure'`,
      threshold: 10,
      frequency: 'every 5 minutes',
      severity: 'critical',
      notification_channels: ['Admin Email', 'Team Slack']
    },
    {
      name: 'Suspicious Access Attempts',
      description: 'Alert when suspicious access attempts are detected',
      query: `SELECT COALESCE(
        COUNT(*),
        0
      ) as value
      FROM security_events
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND event_type = 'suspicious_access'`,
      threshold: 0,
      frequency: 'every 5 minutes',
      severity: 'critical',
      notification_channels: ['Admin Email', 'Team Slack']
    },
    {
      name: 'Unauthorized Access',
      description: 'Alert when unauthorized access attempts are detected',
      query: `SELECT COALESCE(
        COUNT(*),
        0
      ) as value
      FROM security_events
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND event_type = 'unauthorized_access'`,
      threshold: 0,
      frequency: 'every 5 minutes',
      severity: 'critical',
      notification_channels: ['Admin Email', 'Team Slack']
    }
  ];
  
  const filePath = path.join(configDir, 'security-alerts.json');
  fs.writeFileSync(filePath, JSON.stringify(alerts, null, 2));
  success(`File written: ${filePath}`);
  
  success('Security alerts setup completed');
}

// Generate alert documentation
function generateAlertDocumentation() {
  step('Generating alert documentation...');
  
  // Read all alert files
  const databaseAlertsPath = path.join(configDir, 'database-alerts.json');
  const apiAlertsPath = path.join(configDir, 'api-alerts.json');
  const securityAlertsPath = path.join(configDir, 'security-alerts.json');
  const notificationChannelsPath = path.join(configDir, 'notification-channels.json');
  
  const databaseAlerts = JSON.parse(fs.readFileSync(databaseAlertsPath, 'utf8'));
  const apiAlerts = JSON.parse(fs.readFileSync(apiAlertsPath, 'utf8'));
  const securityAlerts = JSON.parse(fs.readFileSync(securityAlertsPath, 'utf8'));
  const channels = JSON.parse(fs.readFileSync(notificationChannelsPath, 'utf8'));
  
  // Generate markdown documentation
  let markdown = `# EPAI Alert System Documentation

## Overview

The EPAI platform includes a comprehensive monitoring and alerting system that helps ensure the stability and security of the platform. This document provides detailed information about the available alerts and notification channels.

## Notification Channels

The following notification channels are configured:

`;

  // Add notification channels
  channels.forEach(channel => {
    markdown += `### ${channel.name}\n\n`;
    markdown += `- **Type:** ${channel.type}\n`;
    markdown += `- **Enabled:** ${channel.enabled ? 'Yes' : 'No'}\n`;
    
    if (channel.type === 'email') {
      markdown += `- **Email:** ${channel.config.email}\n`;
      markdown += `- **Subject Prefix:** ${channel.config.subject_prefix}\n`;
    } else if (channel.type === 'slack') {
      markdown += `- **Channel:** ${channel.config.channel}\n`;
    }
    
    markdown += '\n';
  });

  // Add database alerts
  markdown += `## Database Alerts\n\n`;
  databaseAlerts.forEach(alert => {
    markdown += `### ${alert.name}\n\n`;
    markdown += `- **Description:** ${alert.description}\n`;
    markdown += `- **Severity:** ${alert.severity}\n`;
    markdown += `- **Threshold:** ${alert.threshold}\n`;
    markdown += `- **Frequency:** ${alert.frequency}\n`;
    markdown += `- **Notification Channels:** ${alert.notification_channels.join(', ')}\n`;
    markdown += `- **Query:**\n\`\`\`sql\n${alert.query}\n\`\`\`\n\n`;
  });

  // Add API alerts
  markdown += `## API Alerts\n\n`;
  apiAlerts.forEach(alert => {
    markdown += `### ${alert.name}\n\n`;
    markdown += `- **Description:** ${alert.description}\n`;
    markdown += `- **Severity:** ${alert.severity}\n`;
    markdown += `- **Threshold:** ${alert.threshold}\n`;
    markdown += `- **Frequency:** ${alert.frequency}\n`;
    markdown += `- **Notification Channels:** ${alert.notification_channels.join(', ')}\n`;
    markdown += `- **Query:**\n\`\`\`sql\n${alert.query}\n\`\`\`\n\n`;
  });

  // Add security alerts
  markdown += `## Security Alerts\n\n`;
  securityAlerts.forEach(alert => {
    markdown += `### ${alert.name}\n\n`;
    markdown += `- **Description:** ${alert.description}\n`;
    markdown += `- **Severity:** ${alert.severity}\n`;
    markdown += `- **Threshold:** ${alert.threshold}\n`;
    markdown += `- **Frequency:** ${alert.frequency}\n`;
    markdown += `- **Notification Channels:** ${alert.notification_channels.join(', ')}\n`;
    markdown += `- **Query:**\n\`\`\`sql\n${alert.query}\n\`\`\`\n\n`;
  });

  // Add maintenance section
  markdown += `## Maintenance

### Adding New Alerts

To add a new alert:

1. Add the alert definition to the appropriate JSON file in the \`alert-config\` directory
2. Run the \`deploy-alert-system.js\` script to apply the changes

### Modifying Existing Alerts

To modify an existing alert:

1. Update the alert definition in the appropriate JSON file in the \`alert-config\` directory
2. Run the \`deploy-alert-system.js\` script to apply the changes

### Testing Alerts

To test an alert:

1. Connect to the database and execute the alert query
2. If the query returns a value above the threshold, the alert should be triggered
3. Run \`SELECT schedule_alerts()\` to manually trigger the alert check
`;

  // Write the documentation to a file
  const docPath = path.join(configDir, 'alerts-documentation.md');
  fs.writeFileSync(docPath, markdown);
  success(`File written: ${docPath}`);
  
  success('Alert documentation generated successfully');
}

// Create docs directory and copy documentation
function createDocs() {
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
}

// Main function
function main() {
  info('EPAI Critical Alerts Setup (Simplified)');
  info('====================================');
  
  try {
    setupNotificationChannels();
    setupDatabaseAlerts();
    setupApiAlerts();
    setupSecurityAlerts();
    generateAlertDocumentation();
    createDocs();
    
    success('Critical alerts setup completed successfully!');
  } catch (err) {
    error(`Setup failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 