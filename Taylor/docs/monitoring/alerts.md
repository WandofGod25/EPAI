# EPAI Alert System Documentation

## Overview

The EPAI platform includes a comprehensive monitoring and alerting system that helps ensure the stability and security of the platform. This document provides detailed information about the available alerts and notification channels.

## Notification Channels

The following notification channels are configured:

### Admin Email

- **Type:** email
- **Enabled:** Yes
- **Email:** admin@epai-platform.com
- **Subject Prefix:** [EPAI ALERT]

### Team Slack

- **Type:** slack
- **Enabled:** Yes
- **Channel:** #alerts

## Database Alerts

### High CPU Usage

- **Description:** Alert when database CPU usage exceeds 80% for 5 minutes
- **Severity:** critical
- **Threshold:** 80
- **Frequency:** every 5 minutes
- **Notification Channels:** Admin Email, Team Slack
- **Query:**
```sql
SELECT COALESCE(MAX(cpu_usage), 0) as value FROM (
        SELECT (stats.cpu_usage * 100) as cpu_usage
        FROM pg_stat_activity stats
        WHERE stats.state = 'active'
      ) cpu_stats
```

### Low Disk Space

- **Description:** Alert when database disk space is below 10%
- **Severity:** critical
- **Threshold:** 90
- **Frequency:** hourly
- **Notification Channels:** Admin Email, Team Slack
- **Query:**
```sql
SELECT COALESCE((100 - (available_bytes * 100 / total_bytes)), 0) as value
      FROM pg_stat_file_tables
      WHERE tablename = 'pg_class'
```

### High Connection Count

- **Description:** Alert when database connection count exceeds 80% of max connections
- **Severity:** warning
- **Threshold:** 80
- **Frequency:** every 15 minutes
- **Notification Channels:** Team Slack
- **Query:**
```sql
SELECT COALESCE(
        (SELECT COUNT(*) FROM pg_stat_activity) * 100 / 
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'),
        0
      ) as value
```

### Long Running Queries

- **Description:** Alert when queries run longer than 5 minutes
- **Severity:** warning
- **Threshold:** 0
- **Frequency:** every 5 minutes
- **Notification Channels:** Team Slack
- **Query:**
```sql
SELECT COALESCE(
        COUNT(pid),
        0
      ) as value
      FROM pg_stat_activity
      WHERE state = 'active'
      AND now() - query_start > interval '5 minutes'
```

## API Alerts

### High API Error Rate

- **Description:** Alert when API error rate exceeds 5% over 5 minutes
- **Severity:** critical
- **Threshold:** 5
- **Frequency:** every 5 minutes
- **Notification Channels:** Admin Email, Team Slack
- **Query:**
```sql
SELECT COALESCE(
        SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0),
        0
      ) as value
      FROM logs
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND path LIKE '/api/%'
```

### High API Latency

- **Description:** Alert when API average latency exceeds 500ms over 5 minutes
- **Severity:** warning
- **Threshold:** 500
- **Frequency:** every 5 minutes
- **Notification Channels:** Team Slack
- **Query:**
```sql
SELECT COALESCE(
        AVG(response_time_ms),
        0
      ) as value
      FROM logs
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND path LIKE '/api/%'
```

### Rate Limit Violations

- **Description:** Alert when rate limit violations exceed 10 in 5 minutes
- **Severity:** warning
- **Threshold:** 10
- **Frequency:** every 5 minutes
- **Notification Channels:** Team Slack
- **Query:**
```sql
SELECT COALESCE(
        COUNT(*),
        0
      ) as value
      FROM logs
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND status_code = 429
```

### Traffic Anomaly

- **Description:** Alert when API traffic is 50% higher than usual
- **Severity:** warning
- **Threshold:** 50
- **Frequency:** every 5 minutes
- **Notification Channels:** Team Slack
- **Query:**
```sql
SELECT COALESCE(
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
      ) as value
```

## Security Alerts

### Authentication Failures

- **Description:** Alert when authentication failures exceed 10 in 5 minutes
- **Severity:** critical
- **Threshold:** 10
- **Frequency:** every 5 minutes
- **Notification Channels:** Admin Email, Team Slack
- **Query:**
```sql
SELECT COALESCE(
        COUNT(*),
        0
      ) as value
      FROM security_events
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND event_type = 'auth_failure'
```

### API Key Validation Failures

- **Description:** Alert when API key validation failures exceed 10 in 5 minutes
- **Severity:** critical
- **Threshold:** 10
- **Frequency:** every 5 minutes
- **Notification Channels:** Admin Email, Team Slack
- **Query:**
```sql
SELECT COALESCE(
        COUNT(*),
        0
      ) as value
      FROM security_events
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND event_type = 'api_key_validation_failure'
```

### Suspicious Access Attempts

- **Description:** Alert when suspicious access attempts are detected
- **Severity:** critical
- **Threshold:** 0
- **Frequency:** every 5 minutes
- **Notification Channels:** Admin Email, Team Slack
- **Query:**
```sql
SELECT COALESCE(
        COUNT(*),
        0
      ) as value
      FROM security_events
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND event_type = 'suspicious_access'
```

### Unauthorized Access

- **Description:** Alert when unauthorized access attempts are detected
- **Severity:** critical
- **Threshold:** 0
- **Frequency:** every 5 minutes
- **Notification Channels:** Admin Email, Team Slack
- **Query:**
```sql
SELECT COALESCE(
        COUNT(*),
        0
      ) as value
      FROM security_events
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      AND event_type = 'unauthorized_access'
```

## Maintenance

### Adding New Alerts

To add a new alert:

1. Add the alert definition to the appropriate JSON file in the `alert-config` directory
2. Run the `deploy-alert-system.js` script to apply the changes

### Modifying Existing Alerts

To modify an existing alert:

1. Update the alert definition in the appropriate JSON file in the `alert-config` directory
2. Run the `deploy-alert-system.js` script to apply the changes

### Testing Alerts

To test an alert:

1. Connect to the database and execute the alert query
2. If the query returns a value above the threshold, the alert should be triggered
3. Run `SELECT schedule_alerts()` to manually trigger the alert check
