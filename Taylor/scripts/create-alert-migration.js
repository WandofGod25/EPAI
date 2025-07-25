#!/usr/bin/env node

/**
 * EPAI Create Alert Migration
 * 
 * This script creates a Supabase migration file for the alert system schema.
 * It will create a migration file in the supabase/migrations directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Console styling
const info = (text) => console.log(`ℹ ${text}`);
const success = (text) => console.log(`✓ ${text}`);
const error = (text) => console.error(`✗ ${text}`);
const step = (text) => console.log(`➤ ${text}`);

// Migration SQL content
const migrationSql = `-- Create notification_channels table
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

-- Create alert_definitions table
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

-- Create alert_history table
CREATE TABLE IF NOT EXISTS public.alert_history (
  id SERIAL PRIMARY KEY,
  alert_definition_id INTEGER NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  value NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  notification_sent BOOLEAN DEFAULT FALSE
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id SERIAL PRIMARY KEY,
  alert_history_id INTEGER NOT NULL,
  notification_channel_id INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL,
  error_message TEXT
);

-- Create check_alerts function
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

-- Create send_alert_notifications function
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

-- Create schedule_alerts function
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

-- Create security_events table if it doesn't exist
-- This is used by the security alerts
CREATE TABLE IF NOT EXISTS public.security_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  ip_address TEXT
);

-- Create logs table if it doesn't exist
-- This is used by the API alerts
CREATE TABLE IF NOT EXISTS public.logs (
  id SERIAL PRIMARY KEY,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  ip_address TEXT
);
`;

// Main function
async function main() {
  info('EPAI Create Alert Migration');
  info('=========================');
  
  try {
    // Create the migrations directory if it doesn't exist
    const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    // Generate a timestamp for the migration
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    const migrationName = `${timestamp}_create_alert_system`;
    const migrationFile = path.join(migrationsDir, `${migrationName}.sql`);
    
    // Write the migration file
    fs.writeFileSync(migrationFile, migrationSql);
    success(`Migration file created: ${migrationFile}`);
    
    // Create a seed file for initial data
    const seedsDir = path.resolve(__dirname, '..', 'supabase', 'seed');
    if (!fs.existsSync(seedsDir)) {
      fs.mkdirSync(seedsDir, { recursive: true });
    }
    
    // Read the notification channels and alert definitions
    const configDir = path.resolve(__dirname, 'alert-config');
    const notificationChannelsPath = path.join(configDir, 'notification-channels.json');
    const databaseAlertsPath = path.join(configDir, 'database-alerts.json');
    const apiAlertsPath = path.join(configDir, 'api-alerts.json');
    const securityAlertsPath = path.join(configDir, 'security-alerts.json');
    
    const channels = JSON.parse(fs.readFileSync(notificationChannelsPath, 'utf8'));
    const databaseAlerts = JSON.parse(fs.readFileSync(databaseAlertsPath, 'utf8'));
    const apiAlerts = JSON.parse(fs.readFileSync(apiAlertsPath, 'utf8'));
    const securityAlerts = JSON.parse(fs.readFileSync(securityAlertsPath, 'utf8'));
    
    // Generate the seed SQL
    let seedSql = `-- Seed data for the alert system\n\n`;
    
    // Add notification channels
    seedSql += `-- Notification channels\n`;
    channels.forEach(channel => {
      seedSql += `INSERT INTO notification_channels (name, type, config, enabled)\n`;
      seedSql += `VALUES ('${channel.name}', '${channel.type}', '${JSON.stringify(channel.config)}'::jsonb, ${channel.enabled})\n`;
      seedSql += `ON CONFLICT (name) DO UPDATE SET\n`;
      seedSql += `  type = EXCLUDED.type,\n`;
      seedSql += `  config = EXCLUDED.config,\n`;
      seedSql += `  enabled = EXCLUDED.enabled,\n`;
      seedSql += `  updated_at = NOW();\n\n`;
    });
    
    // Add alert definitions
    const allAlerts = [...databaseAlerts, ...apiAlerts, ...securityAlerts];
    seedSql += `-- Alert definitions\n`;
    allAlerts.forEach(alert => {
      // Escape single quotes in SQL
      const escapedQuery = alert.query.replace(/'/g, "''");
      const escapedDescription = alert.description.replace(/'/g, "''");
      const channelsArray = JSON.stringify(alert.notification_channels).replace(/"/g, "'");
      
      seedSql += `INSERT INTO alert_definitions (name, description, query, threshold, frequency, severity, notification_channels)\n`;
      seedSql += `VALUES ('${alert.name}', '${escapedDescription}', '${escapedQuery}', ${alert.threshold}, '${alert.frequency}', '${alert.severity}', ARRAY${channelsArray})\n`;
      seedSql += `ON CONFLICT (name) DO UPDATE SET\n`;
      seedSql += `  description = EXCLUDED.description,\n`;
      seedSql += `  query = EXCLUDED.query,\n`;
      seedSql += `  threshold = EXCLUDED.threshold,\n`;
      seedSql += `  frequency = EXCLUDED.frequency,\n`;
      seedSql += `  severity = EXCLUDED.severity,\n`;
      seedSql += `  notification_channels = EXCLUDED.notification_channels,\n`;
      seedSql += `  updated_at = NOW();\n\n`;
    });
    
    // Write the seed file
    const seedFile = path.join(seedsDir, `${migrationName}_seed.sql`);
    fs.writeFileSync(seedFile, seedSql);
    success(`Seed file created: ${seedFile}`);
    
    // Create a deployment script
    const deployScript = `#!/usr/bin/env node

/**
 * EPAI Alert System Deployment Script
 * 
 * This script deploys the alert system by:
 * 1. Applying the migration to create the schema
 * 2. Seeding the initial data
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Console styling
const info = (text) => console.log(\`ℹ \${text}\`);
const success = (text) => console.log(\`✓ \${text}\`);
const error = (text) => console.error(\`✗ \${text}\`);
const step = (text) => console.log(\`➤ \${text}\`);

// Main function
async function main() {
  info('EPAI Alert System Deployment');
  info('==========================');
  
  try {
    // Apply the migration
    step('Applying migration...');
    execSync('cd .. && supabase db push', { stdio: 'inherit' });
    success('Migration applied successfully');
    
    // Seed the data
    step('Seeding data...');
    const seedFile = path.join('..', 'supabase', 'seed', '${migrationName}_seed.sql');
    execSync(\`cd .. && supabase db reset --db-url=\${process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres'}\`, { stdio: 'inherit' });
    success('Data seeded successfully');
    
    success('Alert system deployed successfully!');
  } catch (err) {
    error(\`Deployment failed: \${err.message}\`);
    process.exit(1);
  }
}

// Run the script
main();
`;
    
    const deployScriptPath = path.join(__dirname, 'deploy-alert-system-migration.js');
    fs.writeFileSync(deployScriptPath, deployScript);
    success(`Deployment script created: ${deployScriptPath}`);
    
    // Instructions for next steps
    info('\nNext Steps:');
    info('1. Review the migration file: ' + path.relative(process.cwd(), migrationFile));
    info('2. Review the seed file: ' + path.relative(process.cwd(), seedFile));
    info('3. Deploy using: node ' + path.relative(process.cwd(), deployScriptPath));
    
    success('Alert migration created successfully!');
  } catch (err) {
    error(`Failed to create alert migration: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 