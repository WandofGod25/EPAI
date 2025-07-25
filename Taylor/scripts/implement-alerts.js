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

// Configuration paths
const configDir = path.resolve(__dirname, 'alert-config');
const notificationChannelsPath = path.join(configDir, 'notification-channels.json');
const databaseAlertsPath = path.join(configDir, 'database-alerts.json');
const apiAlertsPath = path.join(configDir, 'api-alerts.json');
const securityAlertsPath = path.join(configDir, 'security-alerts.json');

// Helper function to read JSON files
function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    error(`Failed to read file ${filePath}: ${err.message}`);
    throw err;
  }
}

// Create alert tables directly
async function createAlertTables() {
  step('Creating alert tables...');
  
  try {
    // Create notification_channels table
    const { error: channelsError } = await supabase.rpc('exec_sql', {
      sql: `
      CREATE TABLE IF NOT EXISTS notification_channels (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config JSONB NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(name)
      );
      `
    });
    
    if (channelsError) {
      // Try direct SQL if exec_sql fails
      await supabase.from('_sql').select('*').csv(`
      CREATE TABLE IF NOT EXISTS notification_channels (
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
    }
    
    // Create alert_definitions table
    const { error: definitionsError } = await supabase.rpc('exec_sql', {
      sql: `
      CREATE TABLE IF NOT EXISTS alert_definitions (
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
      `
    });
    
    if (definitionsError) {
      // Try direct SQL if exec_sql fails
      await supabase.from('_sql').select('*').csv(`
      CREATE TABLE IF NOT EXISTS alert_definitions (
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
    }
    
    // Create alert_history table
    const { error: historyError } = await supabase.rpc('exec_sql', {
      sql: `
      CREATE TABLE IF NOT EXISTS alert_history (
        id SERIAL PRIMARY KEY,
        alert_definition_id INTEGER NOT NULL,
        triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        value NUMERIC NOT NULL,
        threshold NUMERIC NOT NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        notification_sent BOOLEAN DEFAULT FALSE
      );
      `
    });
    
    if (historyError) {
      // Try direct SQL if exec_sql fails
      await supabase.from('_sql').select('*').csv(`
      CREATE TABLE IF NOT EXISTS alert_history (
        id SERIAL PRIMARY KEY,
        alert_definition_id INTEGER NOT NULL,
        triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        value NUMERIC NOT NULL,
        threshold NUMERIC NOT NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        notification_sent BOOLEAN DEFAULT FALSE
      );
      `);
    }
    
    // Create notification_logs table
    const { error: logsError } = await supabase.rpc('exec_sql', {
      sql: `
      CREATE TABLE IF NOT EXISTS notification_logs (
        id SERIAL PRIMARY KEY,
        alert_history_id INTEGER NOT NULL,
        notification_channel_id INTEGER NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT NOT NULL,
        error_message TEXT
      );
      `
    });
    
    if (logsError) {
      // Try direct SQL if exec_sql fails
      await supabase.from('_sql').select('*').csv(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id SERIAL PRIMARY KEY,
        alert_history_id INTEGER NOT NULL,
        notification_channel_id INTEGER NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT NOT NULL,
        error_message TEXT
      );
      `);
    }
    
    success('Alert tables created successfully');
  } catch (err) {
    error(`Failed to create alert tables: ${err.message}`);
    throw err;
  }
}

// Create notification channels
async function createNotificationChannels() {
  step('Creating notification channels...');
  
  try {
    const channels = readJsonFile(notificationChannelsPath);
    
    for (const channel of channels) {
      // Check if channel already exists
      const { data: existingChannel, error: checkError } = await supabase
        .from('notification_channels')
        .select('id')
        .eq('name', channel.name)
        .maybeSingle();
      
      if (checkError) {
        throw new Error(`Error checking channel ${channel.name}: ${checkError.message}`);
      }
      
      if (existingChannel) {
        // Update existing channel
        const { error: updateError } = await supabase
          .from('notification_channels')
          .update({
            type: channel.type,
            config: channel.config,
            enabled: channel.enabled,
            updated_at: new Date()
          })
          .eq('id', existingChannel.id);
        
        if (updateError) {
          throw new Error(`Error updating channel ${channel.name}: ${updateError.message}`);
        }
        
        success(`Updated notification channel: ${channel.name}`);
      } else {
        // Create new channel
        const { error: insertError } = await supabase
          .from('notification_channels')
          .insert({
            name: channel.name,
            type: channel.type,
            config: channel.config,
            enabled: channel.enabled
          });
        
        if (insertError) {
          throw new Error(`Error creating channel ${channel.name}: ${insertError.message}`);
        }
        
        success(`Created notification channel: ${channel.name}`);
      }
    }
    
    success('Notification channels created successfully');
  } catch (err) {
    error(`Failed to create notification channels: ${err.message}`);
    throw err;
  }
}

// Create alert definitions
async function createAlertDefinitions() {
  step('Creating alert definitions...');
  
  try {
    // Read all alert files
    const databaseAlerts = readJsonFile(databaseAlertsPath);
    const apiAlerts = readJsonFile(apiAlertsPath);
    const securityAlerts = readJsonFile(securityAlertsPath);
    
    // Combine all alerts
    const allAlerts = [...databaseAlerts, ...apiAlerts, ...securityAlerts];
    
    for (const alert of allAlerts) {
      // Check if alert already exists
      const { data: existingAlert, error: checkError } = await supabase
        .from('alert_definitions')
        .select('id')
        .eq('name', alert.name)
        .maybeSingle();
      
      if (checkError) {
        throw new Error(`Error checking alert ${alert.name}: ${checkError.message}`);
      }
      
      if (existingAlert) {
        // Update existing alert
        const { error: updateError } = await supabase
          .from('alert_definitions')
          .update({
            description: alert.description,
            query: alert.query,
            threshold: alert.threshold,
            frequency: alert.frequency,
            severity: alert.severity,
            notification_channels: alert.notification_channels,
            updated_at: new Date()
          })
          .eq('id', existingAlert.id);
        
        if (updateError) {
          throw new Error(`Error updating alert ${alert.name}: ${updateError.message}`);
        }
        
        success(`Updated alert definition: ${alert.name}`);
      } else {
        // Create new alert
        const { error: insertError } = await supabase
          .from('alert_definitions')
          .insert({
            name: alert.name,
            description: alert.description,
            query: alert.query,
            threshold: alert.threshold,
            frequency: alert.frequency,
            severity: alert.severity,
            notification_channels: alert.notification_channels
          });
        
        if (insertError) {
          throw new Error(`Error creating alert ${alert.name}: ${insertError.message}`);
        }
        
        success(`Created alert definition: ${alert.name}`);
      }
    }
    
    success('Alert definitions created successfully');
  } catch (err) {
    error(`Failed to create alert definitions: ${err.message}`);
    throw err;
  }
}

// Main function
async function main() {
  info('EPAI Alert Implementation');
  info('========================');
  
  try {
    // Create tables first
    await createAlertTables();
    
    // Create notification channels
    await createNotificationChannels();
    
    // Create alert definitions
    await createAlertDefinitions();
    
    success('Alert implementation completed successfully!');
  } catch (err) {
    error(`Implementation failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 