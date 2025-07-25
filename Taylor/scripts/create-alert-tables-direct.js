#!/usr/bin/env node

/**
 * EPAI Create Alert Tables (Direct Method)
 * 
 * This script creates the alert tables directly using the Supabase client.
 * It avoids using the exec_sql function or Edge Functions.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

// Create notification_channels table
async function createNotificationChannelsTable() {
  step('Creating notification_channels table...');
  
  try {
    const { error: tableError } = await supabase
      .from('notification_channels')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, create it
      const { error: createError } = await supabase
        .from('_sql')
        .select('*')
        .csv(`
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
        `);
      
      if (createError) {
        throw new Error(`Failed to create notification_channels table: ${createError.message}`);
      }
      
      success('Created notification_channels table');
    } else {
      success('notification_channels table already exists');
    }
  } catch (err) {
    error(`Error creating notification_channels table: ${err.message}`);
    throw err;
  }
}

// Create alert_definitions table
async function createAlertDefinitionsTable() {
  step('Creating alert_definitions table...');
  
  try {
    const { error: tableError } = await supabase
      .from('alert_definitions')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, create it
      const { error: createError } = await supabase
        .from('_sql')
        .select('*')
        .csv(`
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
        `);
      
      if (createError) {
        throw new Error(`Failed to create alert_definitions table: ${createError.message}`);
      }
      
      success('Created alert_definitions table');
    } else {
      success('alert_definitions table already exists');
    }
  } catch (err) {
    error(`Error creating alert_definitions table: ${err.message}`);
    throw err;
  }
}

// Create alert_history table
async function createAlertHistoryTable() {
  step('Creating alert_history table...');
  
  try {
    const { error: tableError } = await supabase
      .from('alert_history')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, create it
      const { error: createError } = await supabase
        .from('_sql')
        .select('*')
        .csv(`
        CREATE TABLE IF NOT EXISTS public.alert_history (
          id SERIAL PRIMARY KEY,
          alert_definition_id INTEGER NOT NULL,
          triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          value NUMERIC NOT NULL,
          threshold NUMERIC NOT NULL,
          resolved_at TIMESTAMP WITH TIME ZONE,
          notification_sent BOOLEAN DEFAULT FALSE
        );
        `);
      
      if (createError) {
        throw new Error(`Failed to create alert_history table: ${createError.message}`);
      }
      
      success('Created alert_history table');
    } else {
      success('alert_history table already exists');
    }
  } catch (err) {
    error(`Error creating alert_history table: ${err.message}`);
    throw err;
  }
}

// Create notification_logs table
async function createNotificationLogsTable() {
  step('Creating notification_logs table...');
  
  try {
    const { error: tableError } = await supabase
      .from('notification_logs')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, create it
      const { error: createError } = await supabase
        .from('_sql')
        .select('*')
        .csv(`
        CREATE TABLE IF NOT EXISTS public.notification_logs (
          id SERIAL PRIMARY KEY,
          alert_history_id INTEGER NOT NULL,
          notification_channel_id INTEGER NOT NULL,
          sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status TEXT NOT NULL,
          error_message TEXT
        );
        `);
      
      if (createError) {
        throw new Error(`Failed to create notification_logs table: ${createError.message}`);
      }
      
      success('Created notification_logs table');
    } else {
      success('notification_logs table already exists');
    }
  } catch (err) {
    error(`Error creating notification_logs table: ${err.message}`);
    throw err;
  }
}

// Create alert checking function
async function createAlertFunctions() {
  step('Creating alert functions...');
  
  try {
    // Create check_alerts function
    const { error: checkAlertsError } = await supabase
      .from('_sql')
      .select('*')
      .csv(`
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
      `);
    
    if (checkAlertsError) {
      throw new Error(`Failed to create check_alerts function: ${checkAlertsError.message}`);
    }
    
    // Create send_alert_notifications function
    const { error: sendNotificationsError } = await supabase
      .from('_sql')
      .select('*')
      .csv(`
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
      `);
    
    if (sendNotificationsError) {
      throw new Error(`Failed to create send_alert_notifications function: ${sendNotificationsError.message}`);
    }
    
    // Create schedule_alerts function
    const { error: scheduleAlertsError } = await supabase
      .from('_sql')
      .select('*')
      .csv(`
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
      `);
    
    if (scheduleAlertsError) {
      throw new Error(`Failed to create schedule_alerts function: ${scheduleAlertsError.message}`);
    }
    
    success('Created alert functions');
  } catch (err) {
    error(`Error creating alert functions: ${err.message}`);
    throw err;
  }
}

// Main function
async function main() {
  info('EPAI Create Alert Tables (Direct Method)');
  info('=======================================');
  
  try {
    await createNotificationChannelsTable();
    await createAlertDefinitionsTable();
    await createAlertHistoryTable();
    await createNotificationLogsTable();
    await createAlertFunctions();
    
    success('All alert tables and functions created successfully!');
  } catch (err) {
    error(`Failed to create alert tables: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 