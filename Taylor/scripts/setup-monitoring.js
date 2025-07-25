/**
 * Monitoring Setup Script
 * 
 * This script helps set up basic monitoring for the EPAI platform by:
 * 1. Creating monitoring dashboards in Grafana
 * 2. Setting up alerts for critical metrics
 * 3. Generating monitoring documentation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MONITORING_DIR = path.join(__dirname, '..', 'monitoring');
const GRAFANA_DASHBOARD_DIR = path.join(MONITORING_DIR, 'grafana', 'dashboards');
const ALERTING_RULES_DIR = path.join(MONITORING_DIR, 'grafana', 'alerting');
const DOCS_DIR = path.join(MONITORING_DIR, 'docs');

/**
 * Create directory structure for monitoring
 */
function createDirectoryStructure() {
  console.log('Creating directory structure...');
  
  const directories = [
    MONITORING_DIR,
    GRAFANA_DASHBOARD_DIR,
    ALERTING_RULES_DIR,
    DOCS_DIR,
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

/**
 * Generate Grafana dashboards
 */
function generateGrafanaDashboards() {
  console.log('\nGenerating Grafana dashboards...');
  
  // System Overview Dashboard
  const systemDashboard = {
    "annotations": {
      "list": [
        {
          "builtIn": 1,
          "datasource": {
            "type": "grafana",
            "uid": "-- Grafana --"
          },
          "enable": true,
          "hide": true,
          "iconColor": "rgba(0, 211, 255, 1)",
          "name": "Annotations & Alerts",
          "type": "dashboard"
        }
      ]
    },
    "editable": true,
    "fiscalYearStartMonth": 0,
    "graphTooltip": 0,
    "id": null,
    "links": [],
    "liveNow": false,
    "panels": [
      {
        "datasource": {
          "type": "postgres",
          "uid": "${DS_SUPABASE}"
        },
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "axisCenteredZero": false,
              "axisColorMode": "text",
              "axisLabel": "",
              "axisPlacement": "auto",
              "barAlignment": 0,
              "drawStyle": "line",
              "fillOpacity": 0,
              "gradientMode": "none",
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "viz": false
              },
              "lineInterpolation": "linear",
              "lineWidth": 1,
              "pointSize": 5,
              "scaleDistribution": {
                "type": "linear"
              },
              "showPoints": "auto",
              "spanNulls": false,
              "stacking": {
                "group": "A",
                "mode": "none"
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "red",
                  "value": 80
                }
              ]
            }
          },
          "overrides": []
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        },
        "id": 1,
        "options": {
          "legend": {
            "calcs": [],
            "displayMode": "list",
            "placement": "bottom",
            "showLegend": true
          },
          "tooltip": {
            "mode": "single",
            "sort": "none"
          }
        },
        "title": "API Requests",
        "type": "timeseries"
      },
      {
        "datasource": {
          "type": "postgres",
          "uid": "${DS_SUPABASE}"
        },
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "axisCenteredZero": false,
              "axisColorMode": "text",
              "axisLabel": "",
              "axisPlacement": "auto",
              "barAlignment": 0,
              "drawStyle": "line",
              "fillOpacity": 0,
              "gradientMode": "none",
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "viz": false
              },
              "lineInterpolation": "linear",
              "lineWidth": 1,
              "pointSize": 5,
              "scaleDistribution": {
                "type": "linear"
              },
              "showPoints": "auto",
              "spanNulls": false,
              "stacking": {
                "group": "A",
                "mode": "none"
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "red",
                  "value": 80
                }
              ]
            }
          },
          "overrides": []
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        },
        "id": 2,
        "options": {
          "legend": {
            "calcs": [],
            "displayMode": "list",
            "placement": "bottom",
            "showLegend": true
          },
          "tooltip": {
            "mode": "single",
            "sort": "none"
          }
        },
        "title": "Response Time",
        "type": "timeseries"
      }
    ],
    "refresh": "",
    "schemaVersion": 38,
    "style": "dark",
    "tags": [],
    "templating": {
      "list": []
    },
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "timepicker": {},
    "timezone": "",
    "title": "EPAI System Overview",
    "version": 0,
    "weekStart": ""
  };
  
  // API Performance Dashboard
  const apiDashboard = {
    "annotations": {
      "list": [
        {
          "builtIn": 1,
          "datasource": {
            "type": "grafana",
            "uid": "-- Grafana --"
          },
          "enable": true,
          "hide": true,
          "iconColor": "rgba(0, 211, 255, 1)",
          "name": "Annotations & Alerts",
          "type": "dashboard"
        }
      ]
    },
    "editable": true,
    "fiscalYearStartMonth": 0,
    "graphTooltip": 0,
    "id": null,
    "links": [],
    "liveNow": false,
    "panels": [
      {
        "datasource": {
          "type": "postgres",
          "uid": "${DS_SUPABASE}"
        },
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "axisCenteredZero": false,
              "axisColorMode": "text",
              "axisLabel": "",
              "axisPlacement": "auto",
              "barAlignment": 0,
              "drawStyle": "line",
              "fillOpacity": 0,
              "gradientMode": "none",
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "viz": false
              },
              "lineInterpolation": "linear",
              "lineWidth": 1,
              "pointSize": 5,
              "scaleDistribution": {
                "type": "linear"
              },
              "showPoints": "auto",
              "spanNulls": false,
              "stacking": {
                "group": "A",
                "mode": "none"
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green",
                  "value": null
                },
                {
                  "color": "red",
                  "value": 80
                }
              ]
            }
          },
          "overrides": []
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        },
        "id": 1,
        "options": {
          "legend": {
            "calcs": [],
            "displayMode": "list",
            "placement": "bottom",
            "showLegend": true
          },
          "tooltip": {
            "mode": "single",
            "sort": "none"
          }
        },
        "title": "Edge Function Response Time",
        "type": "timeseries"
      }
    ],
    "refresh": "",
    "schemaVersion": 38,
    "style": "dark",
    "tags": [],
    "templating": {
      "list": []
    },
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "timepicker": {},
    "timezone": "",
    "title": "EPAI API Performance",
    "version": 0,
    "weekStart": ""
  };
  
  // Write dashboard files
  fs.writeFileSync(
    path.join(GRAFANA_DASHBOARD_DIR, 'system-overview.json'),
    JSON.stringify(systemDashboard, null, 2)
  );
  
  fs.writeFileSync(
    path.join(GRAFANA_DASHBOARD_DIR, 'api-performance.json'),
    JSON.stringify(apiDashboard, null, 2)
  );
  
  console.log('Grafana dashboards generated successfully.');
}

/**
 * Generate alerting rules
 */
function generateAlertingRules() {
  console.log('\nGenerating alerting rules...');
  
  const highErrorRateAlert = {
    "name": "HighErrorRate",
    "type": "threshold",
    "settings": {
      "conditions": [
        {
          "evaluator": {
            "params": [5],
            "type": "gt"
          },
          "operator": {
            "type": "and"
          },
          "query": {
            "params": ["A"]
          },
          "reducer": {
            "params": [],
            "type": "avg"
          },
          "type": "query"
        }
      ],
      "noDataState": "no_data",
      "execErrState": "alerting"
    },
    "message": "Error rate is above 5% for the last 5 minutes",
    "frequency": "1m",
    "handler": 1,
    "notifications": []
  };
  
  const highLatencyAlert = {
    "name": "HighLatency",
    "type": "threshold",
    "settings": {
      "conditions": [
        {
          "evaluator": {
            "params": [200],
            "type": "gt"
          },
          "operator": {
            "type": "and"
          },
          "query": {
            "params": ["A"]
          },
          "reducer": {
            "params": [],
            "type": "avg"
          },
          "type": "query"
        }
      ],
      "noDataState": "no_data",
      "execErrState": "alerting"
    },
    "message": "API response time is above 200ms for the last 5 minutes",
    "frequency": "1m",
    "handler": 1,
    "notifications": []
  };
  
  // Write alerting rule files
  fs.writeFileSync(
    path.join(ALERTING_RULES_DIR, 'high-error-rate.json'),
    JSON.stringify(highErrorRateAlert, null, 2)
  );
  
  fs.writeFileSync(
    path.join(ALERTING_RULES_DIR, 'high-latency.json'),
    JSON.stringify(highLatencyAlert, null, 2)
  );
  
  console.log('Alerting rules generated successfully.');
}

/**
 * Generate monitoring documentation
 */
function generateMonitoringDocs() {
  console.log('\nGenerating monitoring documentation...');
  
  const overviewDoc = `# EPAI Monitoring Overview

## Introduction

This document provides an overview of the monitoring setup for the EPAI platform. It covers the dashboards, alerts, and operational procedures for monitoring the system.

## Dashboards

### System Overview Dashboard

The System Overview dashboard provides a high-level view of the EPAI platform's health and performance. It includes the following metrics:

- API request volume
- Response times
- Error rates
- Database performance
- Edge Function execution statistics

### API Performance Dashboard

The API Performance dashboard focuses specifically on the performance of the EPAI API endpoints. It includes:

- Response times by endpoint
- Error rates by endpoint
- Request volume by endpoint
- Cache hit rates

## Alerts

### High Error Rate Alert

Triggers when the error rate exceeds 5% over a 5-minute period.

**Response Procedure:**
1. Check the logs for error patterns
2. Verify if a recent deployment correlates with the increase
3. Check external dependencies for outages
4. Rollback to previous version if necessary

### High Latency Alert

Triggers when the average API response time exceeds 200ms over a 5-minute period.

**Response Procedure:**
1. Check database performance
2. Verify Edge Function execution times
3. Check for unusual traffic patterns
4. Scale resources if necessary

## Operational Procedures

### Daily Monitoring Checks

1. Review all dashboards at the start of the day
2. Check for any triggered alerts in the last 24 hours
3. Verify that all critical services are operational
4. Review any scheduled maintenance activities

### Incident Response

1. Acknowledge the alert
2. Investigate the root cause
3. Mitigate the immediate issue
4. Document the incident
5. Schedule a post-mortem if necessary
`;

  const alertingDoc = `# EPAI Alerting Guide

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
`;

  // Write documentation files
  fs.writeFileSync(path.join(DOCS_DIR, 'monitoring-overview.md'), overviewDoc);
  fs.writeFileSync(path.join(DOCS_DIR, 'alerting-guide.md'), alertingDoc);
  
  console.log('Monitoring documentation generated successfully.');
}

/**
 * Generate Docker Compose file for local monitoring setup
 */
function generateDockerCompose() {
  console.log('\nGenerating Docker Compose file for local monitoring...');
  
  const dockerCompose = `version: '3'

services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - ./grafana/dashboards:/var/lib/grafana/dashboards
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    restart: unless-stopped
`;

  const prometheusConfig = `global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'epai_api'
    static_configs:
      - targets: ['api:8000']
`;

  const grafanaProvisioningDatasources = `apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
`;

  const grafanaProvisioningDashboards = `apiVersion: 1

providers:
  - name: 'EPAI Dashboards'
    orgId: 1
    folder: 'EPAI'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
`;

  // Create directories for Prometheus and Grafana provisioning
  const prometheusDir = path.join(MONITORING_DIR, 'prometheus');
  const grafanaProvisioningDir = path.join(MONITORING_DIR, 'grafana', 'provisioning');
  const grafanaProvisioningDatasourcesDir = path.join(grafanaProvisioningDir, 'datasources');
  const grafanaProvisioningDashboardsDir = path.join(grafanaProvisioningDir, 'dashboards');
  
  [prometheusDir, grafanaProvisioningDatasourcesDir, grafanaProvisioningDashboardsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Write Docker Compose and configuration files
  fs.writeFileSync(path.join(MONITORING_DIR, 'docker-compose.yml'), dockerCompose);
  fs.writeFileSync(path.join(prometheusDir, 'prometheus.yml'), prometheusConfig);
  fs.writeFileSync(path.join(grafanaProvisioningDatasourcesDir, 'datasources.yml'), grafanaProvisioningDatasources);
  fs.writeFileSync(path.join(grafanaProvisioningDashboardsDir, 'dashboards.yml'), grafanaProvisioningDashboards);
  
  console.log('Docker Compose and configuration files generated successfully.');
}

/**
 * Main function
 */
function main() {
  console.log('EPAI Monitoring Setup');
  console.log('====================');
  
  createDirectoryStructure();
  generateGrafanaDashboards();
  generateAlertingRules();
  generateMonitoringDocs();
  generateDockerCompose();
  
  console.log('\nMonitoring setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Review the generated dashboards and alerting rules');
  console.log('2. Start the monitoring stack with: cd monitoring && docker-compose up -d');
  console.log('3. Access Grafana at: http://localhost:3000 (admin/admin)');
  console.log('4. Configure the Supabase data source in Grafana');
}

// Run the script
main(); 