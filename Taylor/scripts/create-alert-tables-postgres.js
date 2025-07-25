#!/usr/bin/env node

/**
 * EPAI Create Alert Tables (PostgreSQL API)
 * 
 * This script creates the alert tables using direct PostgreSQL queries.
 * It uses the Supabase PostgreSQL API to execute SQL statements.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

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

// Function to execute SQL using the PostgreSQL API
async function executeSql(sql) {
  try {
    // Use the PostgreSQL REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to execute SQL: ${errorText}`);
    }
    
    return await response.json();
  } catch (err) {
    // If exec_sql doesn't exist, try creating it first
    if (err.message.includes('Could not find the function')) {
      info('exec_sql function not found, creating it...');
      
      // Create the exec_sql function
      await createExecSqlFunction();
      
      // Try again
      return executeSql(sql);
    }
    
    throw err;
  }
}

// Create the exec_sql function
async function createExecSqlFunction() {
  step('Creating exec_sql function...');
  
  try {
    // Create the function using a direct SQL query through the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: `
          CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
          RETURNS json
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result json;
          BEGIN
            EXECUTE sql;
            result := json_build_object('success', true);
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            result := json_build_object('success', false, 'error', SQLERRM);
            RETURN result;
          END;
          $$;
          
          -- Grant execute permission to authenticated users
          GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
          GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
          
          SELECT json_build_object('success', true) as result;
        `
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create exec_sql function: ${errorText}`);
    }
    
    success('exec_sql function created successfully');
  } catch (err) {
    error(`Failed to create exec_sql function: ${err.message}`);
    throw err;
  }
}

// Create notification_channels table
async function createNotificationChannelsTable() {
  step('Creating notification_channels table...');
  
  try {
    const sql = `
    CREATE TABLE IF NOT EXISTS public.notification_channels (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config JSONB NOT NULL,
      enabled BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(name)
    );
    `;
    
    await executeSql(sql);
    success('notification_channels table created');
  } catch (err) {
    error(`Failed to create notification_channels table: ${err.message}`);
    throw err;
  }
}

// Create alert_definitions table
async function createAlertDefinitionsTable() {
  step('Creating alert_definitions table...');
  
  try {
    const sql = `
    CREATE TABLE IF NOT EXISTS public.alert_definitions (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      query TEXT NOT NULL,
      threshold NUMERIC NOT NULL,
      frequency TEXT NOT NULL,
      severity TEXT NOT NULL,
      notification_channels TEXT[] NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(name)
    );
    `;
    
    await executeSql(sql);
    success('alert_definitions table created');
  } catch (err) {
    error(`Failed to create alert_definitions table: ${err.message}`);
    throw err;
  }
}

// Create alert_history table
async function createAlertHistoryTable() {
  step('Creating alert_history table...');
  
  try {
    const sql = `
    CREATE TABLE IF NOT EXISTS public.alert_history (
      id SERIAL PRIMARY KEY,
      alert_definition_id INTEGER NOT NULL,
      triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      value NUMERIC NOT NULL,
      threshold NUMERIC NOT NULL,
      resolved_at TIMESTAMP WITH TIME ZONE,
      notification_sent BOOLEAN DEFAULT FALSE
    );
    `;
    
    await executeSql(sql);
    success('alert_history table created');
  } catch (err) {
    error(`Failed to create alert_history table: ${err.message}`);
    throw err;
  }
}

// Create notification_logs table
async function createNotificationLogsTable() {
  step('Creating notification_logs table...');
  
  try {
    const sql = `
    CREATE TABLE IF NOT EXISTS public.notification_logs (
      id SERIAL PRIMARY KEY,
      alert_history_id INTEGER NOT NULL,
      notification_channel_id INTEGER NOT NULL,
      sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      status TEXT NOT NULL,
      error_message TEXT
    );
    `;
    
    await executeSql(sql);
    success('notification_logs table created');
  } catch (err) {
    error(`Failed to create notification_logs table: ${err.message}`);
    throw err;
  }
}

// Create alert checking function
async function createAlertFunctions() {
  step('Creating alert functions...');
  
  try {
    // Create check_alerts function
    const checkAlertsSql = `
    CREATE OR REPLACE FUNCTION public.check_alerts()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
      alert_rec RECORD;
      result_rec RECORD;
      query_text TEXT;
    BEGIN
      FOR alert_rec IN SELECT * FROM public.alert_definitions
      LOOP
        -- Execute the alert query
        BEGIN
          EXECUTE alert_rec.query INTO result_rec;
          
          -- Check if the alert threshold is exceeded
          IF result_rec.value > alert_rec.threshold THEN
            -- Insert into alert_history
            INSERT INTO public.alert_history (alert_definition_id, value, threshold)
            VALUES (alert_rec.id, result_rec.value, alert_rec.threshold);
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Log the error
          RAISE NOTICE 'Error executing alert query %: %', alert_rec.name, SQLERRM;
        END;
      END LOOP;
    END;
    $$;
    `;
    
    await executeSql(checkAlertsSql);
    
    // Create send_alert_notifications function
    const sendNotificationsSql = `
    CREATE OR REPLACE FUNCTION public.send_alert_notifications()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
      alert_rec RECORD;
      channel_rec RECORD;
    BEGIN
      -- Get all unnotified alerts
      FOR alert_rec IN 
        SELECT 
          ah.id as history_id,
          ah.value,
          ah.threshold,
          ad.name,
          ad.description,
          ad.severity,
          ad.notification_channels
        FROM public.alert_history ah
        JOIN public.alert_definitions ad ON ah.alert_definition_id = ad.id
        WHERE ah.notification_sent = FALSE
      LOOP
        -- For each notification channel
        FOR channel_name IN SELECT unnest(alert_rec.notification_channels)
        LOOP
          -- Get the channel details
          SELECT * INTO channel_rec 
          FROM public.notification_channels 
          WHERE name = channel_name AND enabled = TRUE;
          
          IF FOUND THEN
            -- Insert into notification_logs
            INSERT INTO public.notification_logs (alert_history_id, notification_channel_id, status)
            VALUES (alert_rec.history_id, channel_rec.id, 'SENT');
            
            -- In a real implementation, this would send the actual notification
            -- For now, we just log it
            RAISE NOTICE 'Sending % alert to %: % (value: %, threshold: %)',
              alert_rec.severity,
              channel_rec.name,
              alert_rec.name,
              alert_rec.value,
              alert_rec.threshold;
          END IF;
        END LOOP;
        
        -- Mark the alert as notified
        UPDATE public.alert_history
        SET notification_sent = TRUE
        WHERE id = alert_rec.history_id;
      END LOOP;
    END;
    $$;
    `;
    
    await executeSql(sendNotificationsSql);
    
    // Create schedule_alerts function
    const scheduleAlertsSql = `
    CREATE OR REPLACE FUNCTION public.schedule_alerts()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      -- Check alerts
      PERFORM public.check_alerts();
      
      -- Send notifications
      PERFORM public.send_alert_notifications();
    END;
    $$;
    `;
    
    await executeSql(scheduleAlertsSql);
    
    success('Alert functions created');
  } catch (err) {
    error(`Failed to create alert functions: ${err.message}`);
    throw err;
  }
}

// Import notification channels
async function importNotificationChannels() {
  step('Importing notification channels...');
  
  try {
    const configDir = path.resolve(__dirname, 'alert-config');
    const notificationChannelsPath = path.join(configDir, 'notification-channels.json');
    const channels = JSON.parse(fs.readFileSync(notificationChannelsPath, 'utf8'));
    
    for (const channel of channels) {
      const sql = `
      INSERT INTO notification_channels (name, type, config, enabled)
      VALUES ('${channel.name}', '${channel.type}', '${JSON.stringify(channel.config)}'::jsonb, ${channel.enabled})
      ON CONFLICT (name) 
      DO UPDATE SET 
        type = EXCLUDED.type,
        config = EXCLUDED.config,
        enabled = EXCLUDED.enabled,
        updated_at = NOW()
      RETURNING id;
      `;
      
      await executeSql(sql);
      success(`Imported notification channel: ${channel.name}`);
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
    const configDir = path.resolve(__dirname, 'alert-config');
    const databaseAlertsPath = path.join(configDir, 'database-alerts.json');
    const apiAlertsPath = path.join(configDir, 'api-alerts.json');
    const securityAlertsPath = path.join(configDir, 'security-alerts.json');
    
    // Read all alert files
    const databaseAlerts = JSON.parse(fs.readFileSync(databaseAlertsPath, 'utf8'));
    const apiAlerts = JSON.parse(fs.readFileSync(apiAlertsPath, 'utf8'));
    const securityAlerts = JSON.parse(fs.readFileSync(securityAlertsPath, 'utf8'));
    
    // Combine all alerts
    const allAlerts = [...databaseAlerts, ...apiAlerts, ...securityAlerts];
    
    for (const alert of allAlerts) {
      // Escape single quotes in SQL
      const escapedQuery = alert.query.replace(/'/g, "''");
      const escapedDescription = alert.description.replace(/'/g, "''");
      const channelsArray = JSON.stringify(alert.notification_channels).replace(/"/g, "'");
      
      const sql = `
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
      
      await executeSql(sql);
      success(`Imported alert definition: ${alert.name}`);
    }
    
    success('Alert definitions imported successfully');
  } catch (err) {
    error(`Failed to import alert definitions: ${err.message}`);
    throw err;
  }
}

// Main function
async function main() {
  info('EPAI Create Alert Tables (PostgreSQL API)');
  info('======================================');
  
  try {
    await createNotificationChannelsTable();
    await createAlertDefinitionsTable();
    await createAlertHistoryTable();
    await createNotificationLogsTable();
    await createAlertFunctions();
    await importNotificationChannels();
    await importAlertDefinitions();
    
    success('All alert tables and functions created and populated successfully!');
  } catch (err) {
    error(`Failed to create alert tables: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 