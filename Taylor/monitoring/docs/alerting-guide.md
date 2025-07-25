# EPAI Alerting Guide

## Alert Types

### Critical Alerts

Critical alerts require immediate attention and should be responded to within 15 minutes.

- **High Error Rate**: Error rate exceeds 5% for 5 minutes
- **Service Unavailable**: Any core service is down
- **Database Connection Failures**: Unable to connect to database

### Warning Alerts

Warning alerts should be investigated within 2 hours.

- **High Latency**: API response time exceeds 200ms for 5 minutes
- **Elevated Error Rate**: Error rate exceeds 2% for 15 minutes
- **Disk Space Warning**: Disk usage exceeds 80%

### Info Alerts

Info alerts are for awareness and should be reviewed daily.

- **Daily Usage Summary**: Summary of API usage in the last 24 hours
- **New Partner Onboarded**: Notification when a new partner signs up

## Response Procedures

### Acknowledging Alerts

1. Access the alerting system
2. Find the active alert
3. Click "Acknowledge" to indicate you're working on it
4. Update the incident status

### Escalation Path

1. **Level 1**: On-call engineer
2. **Level 2**: Engineering lead
3. **Level 3**: CTO

### Communication

1. Post updates in the #incidents Slack channel
2. For customer-impacting issues, notify the customer success team
3. For extended outages, prepare external communication
