#!/usr/bin/env node

/**
 * EPAI Pilot Deployment Monitoring
 * 
 * This script monitors the pilot deployment and generates reports on:
 * - API usage by pilot partners
 * - Error rates
 * - Performance metrics
 * - Insight generation statistics
 * 
 * Usage: node scripts/monitor-pilot.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { format } from 'date-fns';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'scripts', '.env') });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Date range for reporting (default to last 24 hours)
const endDate = new Date();
const startDate = new Date(endDate);
startDate.setDate(endDate.getDate() - 1); // 24 hours ago

/**
 * Generate a usage report for all pilot partners
 */
async function generateUsageReport() {
  console.log(chalk.blue('Generating usage report...'));
  
  try {
    // Get all partners
    const { data: partners, error: partnerError } = await supabase
      .from('partners')
      .select('*');
      
    if (partnerError) {
      console.error(chalk.red('Error fetching partners:'), partnerError.message);
      return null;
    }
    
    // Generate report for each partner
    const report = {
      generated: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      period: {
        start: format(startDate, 'yyyy-MM-dd HH:mm:ss'),
        end: format(endDate, 'yyyy-MM-dd HH:mm:ss')
      },
      partners: [],
      summary: {
        totalPartners: partners.length,
        totalRequests: 0,
        totalErrors: 0,
        totalInsights: 0,
        averageLatency: 0
      }
    };
    
    // Process each partner
    for (const partner of partners) {
      console.log(chalk.blue(`Processing data for partner: ${partner.name || partner.id}`));
      
      // Get logs for this partner
      const { data: logs, error: logsError } = await supabase
        .from('logs')
        .select('*')
        .eq('partner_id', partner.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
        
      if (logsError) {
        console.error(chalk.red(`Error fetching logs for partner ${partner.id}:`), logsError.message);
        continue;
      }
      
      // Get insights for this partner
      const { data: insights, error: insightsError } = await supabase
        .from('insights')
        .select('*')
        .eq('partner_id', partner.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
        
      if (insightsError) {
        console.error(chalk.red(`Error fetching insights for partner ${partner.id}:`), insightsError.message);
        continue;
      }
      
      // Get ingestion events for this partner
      const { data: events, error: eventsError } = await supabase
        .from('ingestion_events')
        .select('*')
        .eq('partner_id', partner.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
        
      if (eventsError) {
        console.error(chalk.red(`Error fetching events for partner ${partner.id}:`), eventsError.message);
        continue;
      }
      
      // Count errors
      const errors = logs ? logs.filter(log => log.status_code >= 400).length : 0;
      
      // Calculate average latency
      const latencies = logs ? logs.map(log => log.duration_ms).filter(Boolean) : [];
      const avgLatency = latencies.length > 0
        ? latencies.reduce((sum, val) => sum + val, 0) / latencies.length
        : 0;
      
      // Count event types
      const eventTypes = {};
      if (events && events.length > 0) {
        for (const event of events) {
          const type = event.event_type || 'unknown';
          eventTypes[type] = (eventTypes[type] || 0) + 1;
        }
      }
      
      // Create partner report
      const partnerReport = {
        id: partner.id,
        name: partner.name || 'Unknown',
        totalRequests: logs ? logs.length : 0,
        errorCount: errors,
        errorRate: logs && logs.length > 0 ? (errors / logs.length) * 100 : 0,
        averageLatency: avgLatency,
        insightCount: insights ? insights.length : 0,
        eventCount: events ? events.length : 0,
        eventTypes,
      };
      
      // Add to summary
      report.summary.totalRequests += partnerReport.totalRequests;
      report.summary.totalErrors += partnerReport.errorCount;
      report.summary.totalInsights += partnerReport.insightCount;
      
      if (partnerReport.averageLatency > 0) {
        report.summary.averageLatency += partnerReport.averageLatency;
      }
      
      // Add to report
      report.partners.push(partnerReport);
    }
    
    // Calculate final summary values
    if (report.partners.length > 0) {
      report.summary.averageLatency = report.summary.averageLatency / report.partners.length;
      report.summary.errorRate = report.summary.totalRequests > 0
        ? (report.summary.totalErrors / report.summary.totalRequests) * 100
        : 0;
    }
    
    return report;
  } catch (error) {
    console.error(chalk.red('Unexpected error generating usage report:'), error.message);
    return null;
  }
}

/**
 * Generate a system health report
 */
async function generateHealthReport() {
  console.log(chalk.blue('Generating system health report...'));
  
  try {
    // Get performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
      
    if (metricsError) {
      console.error(chalk.red('Error fetching performance metrics:'), metricsError.message);
      return null;
    }
    
    // Get recent security events
    const { data: securityEvents, error: securityError } = await supabase
      .from('security_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
      
    if (securityError) {
      console.error(chalk.red('Error fetching security events:'), securityError.message);
      return null;
    }
    
    // Create health report
    const report = {
      generated: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      period: {
        start: format(startDate, 'yyyy-MM-dd HH:mm:ss'),
        end: format(endDate, 'yyyy-MM-dd HH:mm:ss')
      },
      performance: {
        metrics: metrics || [],
        averages: calculatePerformanceAverages(metrics)
      },
      security: {
        events: securityEvents || [],
        summary: summarizeSecurityEvents(securityEvents)
      }
    };
    
    return report;
  } catch (error) {
    console.error(chalk.red('Unexpected error generating health report:'), error.message);
    return null;
  }
}

/**
 * Calculate average performance metrics
 */
function calculatePerformanceAverages(metrics) {
  if (!metrics || metrics.length === 0) {
    return {
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
      avgResponseTime: 0,
      avgDatabaseQueries: 0
    };
  }
  
  let totalCpu = 0;
  let totalMemory = 0;
  let totalResponseTime = 0;
  let totalDbQueries = 0;
  let countCpu = 0;
  let countMemory = 0;
  let countResponseTime = 0;
  let countDbQueries = 0;
  
  for (const metric of metrics) {
    if (metric.cpu_usage !== null && metric.cpu_usage !== undefined) {
      totalCpu += metric.cpu_usage;
      countCpu++;
    }
    
    if (metric.memory_usage !== null && metric.memory_usage !== undefined) {
      totalMemory += metric.memory_usage;
      countMemory++;
    }
    
    if (metric.avg_response_time !== null && metric.avg_response_time !== undefined) {
      totalResponseTime += metric.avg_response_time;
      countResponseTime++;
    }
    
    if (metric.database_queries !== null && metric.database_queries !== undefined) {
      totalDbQueries += metric.database_queries;
      countDbQueries++;
    }
  }
  
  return {
    avgCpuUsage: countCpu > 0 ? totalCpu / countCpu : 0,
    avgMemoryUsage: countMemory > 0 ? totalMemory / countMemory : 0,
    avgResponseTime: countResponseTime > 0 ? totalResponseTime / countResponseTime : 0,
    avgDatabaseQueries: countDbQueries > 0 ? totalDbQueries / countDbQueries : 0
  };
}

/**
 * Summarize security events by type
 */
function summarizeSecurityEvents(events) {
  if (!events || events.length === 0) {
    return {
      total: 0,
      byType: {},
      bySeverity: {}
    };
  }
  
  const byType = {};
  const bySeverity = {};
  
  for (const event of events) {
    const type = event.event_type || 'unknown';
    const severity = event.severity || 'unknown';
    
    byType[type] = (byType[type] || 0) + 1;
    bySeverity[severity] = (bySeverity[severity] || 0) + 1;
  }
  
  return {
    total: events.length,
    byType,
    bySeverity
  };
}

/**
 * Save report to file
 */
function saveReport(report, filename) {
  if (!report) {
    console.error(chalk.red('No report data to save'));
    return false;
  }
  
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(process.cwd(), 'pilot-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Generate filename with date if not provided
  if (!filename) {
    const dateStr = format(new Date(), 'yyyy-MM-dd-HHmmss');
    filename = `pilot-report-${dateStr}.json`;
  }
  
  // Save report to file
  const filePath = path.join(reportsDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  console.log(chalk.green(`Report saved to: ${filePath}`));
  return true;
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue('=== EPAI Pilot Deployment Monitoring ==='));
  console.log(chalk.blue(`Reporting period: ${format(startDate, 'yyyy-MM-dd HH:mm:ss')} to ${format(endDate, 'yyyy-MM-dd HH:mm:ss')}`));
  
  // Generate usage report
  const usageReport = await generateUsageReport();
  if (usageReport) {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    saveReport(usageReport, `usage-report-${dateStr}.json`);
  }
  
  // Generate health report
  const healthReport = await generateHealthReport();
  if (healthReport) {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    saveReport(healthReport, `health-report-${dateStr}.json`);
  }
  
  console.log(chalk.green('\nMonitoring complete!'));
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 