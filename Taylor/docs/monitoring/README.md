# Monitoring System

## Overview
The EPAI platform includes a comprehensive monitoring and alerting system that helps ensure the stability and security of the platform. This system includes:

1. **Monitoring Dashboards**: Grafana dashboards for database, API, and security metrics
2. **Alert System**: Automated alerts for critical issues with configurable thresholds
3. **Notification Channels**: Email and Slack notifications for immediate response
4. **Documentation**: Comprehensive documentation for maintenance and troubleshooting

## Alert System
The alert system is designed to detect and notify administrators of critical issues across the platform. For detailed information about the available alerts, see [alerts.md](./alerts.md).

### Alert Categories

#### Database Alerts
- **High CPU Usage**: Triggers when database CPU usage exceeds 80% for more than 5 minutes
- **Low Disk Space**: Triggers when available disk space falls below 10%
- **High Connection Count**: Triggers when the number of database connections exceeds 80% of the maximum
- **Long-Running Queries**: Triggers when queries run for more than 30 seconds
- **Database Bloat**: Triggers when table or index bloat exceeds 30%

#### API Alerts
- **High Error Rate**: Triggers when the API error rate exceeds 5% over 5 minutes
- **High Latency**: Triggers when API response time exceeds 1000ms for more than 5 minutes
- **Rate Limit Violations**: Triggers when rate limit violations exceed 100 per hour
- **Traffic Anomalies**: Triggers when traffic patterns deviate significantly from normal

#### Security Alerts
- **Authentication Failures**: Triggers when authentication failures exceed 10 per minute
- **API Key Validation Failures**: Triggers when API key validation failures exceed 20 per hour
- **Unauthorized Access Attempts**: Triggers when unauthorized access attempts exceed 5 per minute
- **Security Event Anomalies**: Triggers when security events deviate significantly from normal patterns

## Notification Channels
The system supports multiple notification channels:

### Email Notifications
- **Admin Email**: Sends alerts to the platform administrators
- **Security Team Email**: Sends security-specific alerts to the security team
- **Operations Team Email**: Sends operational alerts to the operations team

### Slack Notifications
- **#alerts Channel**: Sends all alerts to the #alerts Slack channel
- **#security Channel**: Sends security-specific alerts to the #security Slack channel
- **#operations Channel**: Sends operational alerts to the #operations Slack channel

## Monitoring Dashboard
The monitoring dashboard provides real-time visibility into the platform's performance and health. It includes:

### Database Metrics
- CPU usage
- Memory usage
- Disk space
- Connection count
- Query performance
- Table and index bloat

### API Metrics
- Request count
- Error rate
- Response time
- Rate limit violations
- Endpoint usage

### Security Metrics
- Authentication attempts
- API key validations
- Unauthorized access attempts
- Security event logs

## Implementation Details

### Database Schema
The monitoring system uses the following database tables:

- **alert_definitions**: Stores the configuration for each alert
- **notification_channels**: Stores the configuration for each notification channel
- **alert_history**: Records the history of triggered alerts
- **notification_logs**: Records the history of sent notifications

### Alert Functions
The system includes the following database functions:

- **check_alerts()**: Checks all alert definitions against current metrics
- **send_alert_notifications()**: Sends notifications for triggered alerts
- **schedule_alerts()**: Schedules the execution of the alert checking and notification functions

### Configuration Files
The alert configuration is stored in JSON files:

- **notification-channels.json**: Defines the notification channels
- **database-alerts.json**: Defines the database alerts
- **api-alerts.json**: Defines the API alerts
- **security-alerts.json**: Defines the security alerts

## Maintenance
Regular maintenance of the monitoring system is essential to ensure its effectiveness. This includes:

### Alert Thresholds
Review and update alert thresholds periodically to ensure they are appropriate for the current system load and usage patterns.

### Notification Channels
Verify that notification channels are correctly configured and that notifications are being delivered as expected.

### Alert Definitions
Add new alerts as needed to monitor new components or features of the platform.

### Alert History
Review the alert history periodically to identify patterns and trends that may indicate underlying issues.

## Troubleshooting

### Common Issues

#### Missing Alerts
If alerts are not being triggered as expected:
1. Check that the alert definitions are correctly configured
2. Verify that the alert checking function is being executed
3. Check that the metrics being monitored are available

#### Missing Notifications
If notifications are not being delivered as expected:
1. Check that the notification channels are correctly configured
2. Verify that the notification sending function is being executed
3. Check the notification logs for errors

#### False Positives
If alerts are being triggered incorrectly:
1. Review the alert thresholds and adjust as needed
2. Check that the metrics being monitored are accurate
3. Consider adding conditions to the alert definition to reduce false positives

## Conclusion
The monitoring and alerting system is a critical component of the EPAI platform, providing real-time visibility into the platform's performance and health. By promptly detecting and notifying administrators of issues, the system helps ensure the stability, security, and reliability of the platform. 