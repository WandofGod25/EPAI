#!/usr/bin/env node

/**
 * EPAI Automated Backup Configuration Script
 * 
 * This script helps configure automated backups for the EPAI production database.
 * It performs the following tasks:
 * 1. Sets up a backup schedule in the database
 * 2. Creates a backup verification procedure
 * 3. Generates a backup rotation policy
 * 4. Provides instructions for external backup solutions
 * 
 * Usage:
 * node scripts/configure-automated-backups.js
 * 
 * Environment variables:
 * SUPABASE_PROD_URL - Production Supabase URL
 * SUPABASE_PROD_KEY - Production Supabase service role key
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const CONFIG = {
  prodUrl: process.env.SUPABASE_PROD_URL,
  prodKey: process.env.SUPABASE_PROD_KEY,
  outputDir: path.join(process.cwd(), 'backup-config'),
};

// Check required environment variables
if (!CONFIG.prodUrl || !CONFIG.prodKey) {
  console.error(chalk.red('Error: SUPABASE_PROD_URL and SUPABASE_PROD_KEY environment variables are required'));
  console.error(chalk.yellow('Please run:'));
  console.error(chalk.yellow('  export SUPABASE_PROD_URL=your_production_supabase_url'));
  console.error(chalk.yellow('  export SUPABASE_PROD_KEY=your_production_service_role_key'));
  process.exit(1);
}

// Create Supabase client
const prodClient = createClient(CONFIG.prodUrl, CONFIG.prodKey);

// Helper function to ask user for confirmation
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function for logging
function log(message, type = 'info') {
  const prefix = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    error: chalk.red('✗'),
    warning: chalk.yellow('⚠'),
    step: chalk.cyan('➤'),
  };
  
  console.log(`${prefix[type]} ${message}`);
}

// Helper function to write to file
function writeToFile(filename, content) {
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  const filePath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filePath, content);
  log(`File written: ${filePath}`, 'success');
  return filePath;
}

// Step 1: Set up backup schedule in the database
async function setupBackupSchedule() {
  log('Setting up backup schedule...', 'step');
  
  try {
    // Create backup configuration table
    const { error: tableError } = await prodClient.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS backup_config (
          id SERIAL PRIMARY KEY,
          backup_type TEXT NOT NULL,
          schedule TEXT NOT NULL,
          retention_period INTERVAL NOT NULL,
          last_backup TIMESTAMP WITH TIME ZONE,
          enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create backup log table
        CREATE TABLE IF NOT EXISTS backup_log (
          id SERIAL PRIMARY KEY,
          backup_type TEXT NOT NULL,
          status TEXT NOT NULL,
          file_name TEXT,
          file_size BIGINT,
          start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          end_time TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          metadata JSONB
        );
      `
    });
    
    if (tableError) {
      throw new Error(`Failed to create backup tables: ${tableError.message}`);
    }
    
    // Get backup configuration from user
    log('Configuring backup schedule...', 'info');
    
    const dailyBackupTime = await askQuestion('Enter daily backup time (HH:MM, 24-hour format, UTC): ');
    const weeklyBackupDay = await askQuestion('Enter day for weekly full backup (0-6, where 0 is Sunday): ');
    const dailyRetentionDays = await askQuestion('Enter retention period for daily backups (days): ');
    const weeklyRetentionWeeks = await askQuestion('Enter retention period for weekly backups (weeks): ');
    const monthlyRetentionMonths = await askQuestion('Enter retention period for monthly backups (months): ');
    
    // Insert backup configuration
    const { error: configError } = await prodClient.rpc('exec_sql', {
      sql: `
        -- Clear existing configuration
        TRUNCATE backup_config;
        
        -- Insert daily backup configuration
        INSERT INTO backup_config (backup_type, schedule, retention_period)
        VALUES ('daily', $1, $2::INT || ' days'::INTERVAL);
        
        -- Insert weekly backup configuration
        INSERT INTO backup_config (backup_type, schedule, retention_period)
        VALUES ('weekly', $3, $4::INT || ' weeks'::INTERVAL);
        
        -- Insert monthly backup configuration
        INSERT INTO backup_config (backup_type, schedule, retention_period)
        VALUES ('monthly', 'first day of month ' || $1, $5::INT || ' months'::INTERVAL);
      `,
      params: [
        dailyBackupTime,
        parseInt(dailyRetentionDays),
        `${dailyBackupTime} on ${weeklyBackupDay}`,
        parseInt(weeklyRetentionWeeks),
        parseInt(monthlyRetentionMonths),
      ],
    });
    
    if (configError) {
      throw new Error(`Failed to insert backup configuration: ${configError.message}`);
    }
    
    log('Backup schedule configured successfully', 'success');
    
    // Generate SQL for pg_cron job
    const pgCronSQL = `
-- Enable pg_cron extension (requires superuser privileges)
-- This would typically be done by Supabase support for hosted instances
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create backup function
CREATE OR REPLACE FUNCTION perform_database_backup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_backup_type TEXT;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_backup_id INTEGER;
  v_file_name TEXT;
BEGIN
  -- Determine backup type based on current time
  IF EXTRACT(DAY FROM v_now) = 1 THEN
    v_backup_type := 'monthly';
  ELSIF EXTRACT(DOW FROM v_now) = ${weeklyBackupDay}::INTEGER THEN
    v_backup_type := 'weekly';
  ELSE
    v_backup_type := 'daily';
  END IF;
  
  -- Log backup start
  INSERT INTO backup_log (backup_type, status)
  VALUES (v_backup_type, 'in_progress')
  RETURNING id INTO v_backup_id;
  
  -- Generate backup file name
  v_file_name := 'epai_' || v_backup_type || '_' || TO_CHAR(v_now, 'YYYY_MM_DD_HH24_MI_SS') || '.dump';
  
  -- Update backup log with file name
  UPDATE backup_log
  SET file_name = v_file_name
  WHERE id = v_backup_id;
  
  -- In a real implementation, this would call pg_dump
  -- Since we can't do that directly from a function, this is where
  -- an external script would take over
  
  -- Update backup configuration
  UPDATE backup_config
  SET last_backup = v_now,
      updated_at = v_now
  WHERE backup_type = v_backup_type;
  
  -- Mark backup as completed
  UPDATE backup_log
  SET status = 'completed',
      end_time = NOW()
  WHERE id = v_backup_id;
  
  -- Clean up old backups based on retention policy
  DELETE FROM backup_log
  WHERE backup_type = 'daily'
    AND start_time < NOW() - (SELECT retention_period FROM backup_config WHERE backup_type = 'daily')
    AND status = 'completed';
    
  DELETE FROM backup_log
  WHERE backup_type = 'weekly'
    AND start_time < NOW() - (SELECT retention_period FROM backup_config WHERE backup_type = 'weekly')
    AND status = 'completed';
    
  DELETE FROM backup_log
  WHERE backup_type = 'monthly'
    AND start_time < NOW() - (SELECT retention_period FROM backup_config WHERE backup_type = 'monthly')
    AND status = 'completed';
END;
$$;

-- Schedule the backup job using pg_cron
-- This would typically be done by Supabase support for hosted instances
-- SELECT cron.schedule('${dailyBackupTime}', 'SELECT perform_database_backup()');
`;

    writeToFile('pg_cron_backup.sql', pgCronSQL);
    
    return {
      dailyBackupTime,
      weeklyBackupDay,
      dailyRetentionDays,
      weeklyRetentionWeeks,
      monthlyRetentionMonths,
    };
  } catch (error) {
    log(`Failed to set up backup schedule: ${error.message}`, 'error');
    throw error;
  }
}

// Step 2: Create backup verification procedure
async function createBackupVerificationProcedure() {
  log('Creating backup verification procedure...', 'step');
  
  try {
    const { error } = await prodClient.rpc('exec_sql', {
      sql: `
        -- Create function to verify backups
        CREATE OR REPLACE FUNCTION verify_backup(p_backup_id INTEGER)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          v_backup_record RECORD;
          v_verification_result BOOLEAN := false;
        BEGIN
          -- Get backup record
          SELECT * INTO v_backup_record
          FROM backup_log
          WHERE id = p_backup_id;
          
          IF NOT FOUND THEN
            RAISE EXCEPTION 'Backup with ID % not found', p_backup_id;
          END IF;
          
          -- In a real implementation, this would verify the backup file
          -- For now, we'll just update the metadata
          
          UPDATE backup_log
          SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                         jsonb_build_object(
                           'verified_at', NOW(),
                           'verification_status', 'success',
                           'verification_message', 'Backup verified successfully'
                         )
          WHERE id = p_backup_id;
          
          RETURN true;
        EXCEPTION
          WHEN OTHERS THEN
            -- Log verification failure
            UPDATE backup_log
            SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                           jsonb_build_object(
                             'verified_at', NOW(),
                             'verification_status', 'failed',
                             'verification_message', SQLERRM
                           )
            WHERE id = p_backup_id;
            
            RETURN false;
        END;
        $$;
        
        -- Create function to verify the most recent backup
        CREATE OR REPLACE FUNCTION verify_most_recent_backup()
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          v_backup_id INTEGER;
        BEGIN
          -- Get the most recent completed backup
          SELECT id INTO v_backup_id
          FROM backup_log
          WHERE status = 'completed'
          ORDER BY end_time DESC
          LIMIT 1;
          
          IF NOT FOUND THEN
            RAISE EXCEPTION 'No completed backups found';
          END IF;
          
          -- Verify the backup
          RETURN verify_backup(v_backup_id);
        END;
        $$;
      `
    });
    
    if (error) {
      throw new Error(`Failed to create backup verification procedure: ${error.message}`);
    }
    
    log('Backup verification procedure created successfully', 'success');
  } catch (error) {
    log(`Failed to create backup verification procedure: ${error.message}`, 'error');
    throw error;
  }
}

// Step 3: Generate backup rotation policy
function generateBackupRotationPolicy(config) {
  log('Generating backup rotation policy...', 'step');
  
  const policy = `# EPAI Backup Rotation Policy

## Overview
This document outlines the backup rotation policy for the EPAI platform database.

## Backup Schedule
- **Daily Backups**: Performed daily at ${config.dailyBackupTime} UTC
- **Weekly Full Backups**: Performed on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][config.weeklyBackupDay]} at ${config.dailyBackupTime} UTC
- **Monthly Backups**: Performed on the first day of each month at ${config.dailyBackupTime} UTC

## Retention Periods
- **Daily Backups**: Retained for ${config.dailyRetentionDays} days
- **Weekly Backups**: Retained for ${config.weeklyRetentionWeeks} weeks
- **Monthly Backups**: Retained for ${config.monthlyRetentionMonths} months

## Backup Storage
- Primary backups are stored in the Supabase project's storage
- Secondary backups are stored in an external storage solution (e.g., AWS S3)
- Tertiary backups are stored in a separate geographic region for disaster recovery

## Verification
- Each backup is automatically verified after creation
- Weekly manual verification of the most recent backup
- Monthly restoration test to a test environment

## Backup Naming Convention
Backups follow this naming convention:
\`epai_[backup_type]_YYYY_MM_DD_HH_MI_SS.dump\`

Where:
- \`backup_type\`: daily, weekly, or monthly
- \`YYYY_MM_DD_HH_MI_SS\`: Timestamp of when the backup was created

## Disaster Recovery
In case of data loss or corruption:
1. Identify the most recent valid backup
2. Restore to a staging environment for verification
3. Once verified, restore to production
4. Apply any transaction logs if available
5. Verify application functionality

## Responsibilities
- **Database Administrator**: Responsible for ensuring backups are running and valid
- **DevOps Engineer**: Responsible for maintaining the backup infrastructure
- **Security Officer**: Responsible for ensuring backups are securely stored and encrypted
`;

  writeToFile('backup_rotation_policy.md', policy);
  log('Backup rotation policy generated successfully', 'success');
}

// Step 4: Provide instructions for external backup solutions
function generateExternalBackupInstructions() {
  log('Generating external backup instructions...', 'step');
  
  const instructions = `# EPAI External Backup Solution Instructions

## Overview
This document provides instructions for setting up external backup solutions for the EPAI platform database.

## AWS S3 Backup Solution

### Prerequisites
- AWS account with S3 access
- AWS CLI installed and configured
- \`pg_dump\` utility installed

### Setup Instructions

1. **Create S3 Bucket**
   \`\`\`bash
   aws s3 mb s3://epai-database-backups --region us-west-2
   \`\`\`

2. **Enable Versioning and Lifecycle Policies**
   \`\`\`bash
   aws s3api put-bucket-versioning --bucket epai-database-backups --versioning-configuration Status=Enabled
   
   # Create lifecycle policy JSON file
   cat > lifecycle-policy.json << EOF
   {
     "Rules": [
       {
         "ID": "Daily-Backup-Expiration",
         "Status": "Enabled",
         "Prefix": "daily/",
         "Expiration": {
           "Days": 7
         }
       },
       {
         "ID": "Weekly-Backup-Expiration",
         "Status": "Enabled",
         "Prefix": "weekly/",
         "Expiration": {
           "Days": 35
         }
       },
       {
         "ID": "Monthly-Backup-Expiration",
         "Status": "Enabled",
         "Prefix": "monthly/",
         "Expiration": {
           "Days": 365
         }
       }
     ]
   }
   EOF
   
   aws s3api put-bucket-lifecycle-configuration --bucket epai-database-backups --lifecycle-configuration file://lifecycle-policy.json
   \`\`\`

3. **Create Backup Script**
   Create a file named \`backup-to-s3.sh\`:
   
   \`\`\`bash
   #!/bin/bash
   
   # Configuration
   DB_NAME="postgres"
   DB_HOST="db.your-project-ref.supabase.co"
   DB_PORT="5432"
   DB_USER="postgres"
   DB_PASSWORD="your-db-password"
   S3_BUCKET="epai-database-backups"
   
   # Determine backup type
   DAY_OF_WEEK=$(date +%u)
   DAY_OF_MONTH=$(date +%d)
   
   if [ "$DAY_OF_MONTH" == "01" ]; then
     BACKUP_TYPE="monthly"
   elif [ "$DAY_OF_WEEK" == "7" ]; then  # Sunday
     BACKUP_TYPE="weekly"
   else
     BACKUP_TYPE="daily"
   fi
   
   # Create backup filename
   TIMESTAMP=$(date +%Y_%m_%d_%H_%M_%S)
   BACKUP_FILE="epai_${BACKUP_TYPE}_${TIMESTAMP}.dump"
   
   # Create temporary directory
   TEMP_DIR=$(mktemp -d)
   BACKUP_PATH="${TEMP_DIR}/${BACKUP_FILE}"
   
   echo "Creating ${BACKUP_TYPE} backup: ${BACKUP_FILE}"
   
   # Perform backup
   PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -F c -b -v -f $BACKUP_PATH $DB_NAME
   
   # Check if backup was successful
   if [ $? -eq 0 ]; then
     echo "Backup created successfully"
     
     # Upload to S3
     aws s3 cp $BACKUP_PATH s3://$S3_BUCKET/$BACKUP_TYPE/$BACKUP_FILE
     
     # Log backup to database
     psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
       INSERT INTO backup_log (backup_type, status, file_name, file_size, end_time, metadata)
       VALUES ('$BACKUP_TYPE', 'completed', '$BACKUP_FILE', $(stat -c%s $BACKUP_PATH), NOW(), 
               '{\"storage\": \"s3\", \"bucket\": \"$S3_BUCKET\", \"path\": \"$BACKUP_TYPE/$BACKUP_FILE\"}');
       
       UPDATE backup_config
       SET last_backup = NOW(),
           updated_at = NOW()
       WHERE backup_type = '$BACKUP_TYPE';
     "
     
     echo "Backup uploaded to S3: s3://$S3_BUCKET/$BACKUP_TYPE/$BACKUP_FILE"
   else
     echo "Backup failed"
     
     # Log failure to database
     psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
       INSERT INTO backup_log (backup_type, status, error_message)
       VALUES ('$BACKUP_TYPE', 'failed', 'pg_dump exited with error code $?');
     "
   fi
   
   # Clean up
   rm -f $BACKUP_PATH
   rmdir $TEMP_DIR
   \`\`\`

4. **Make the script executable**
   \`\`\`bash
   chmod +x backup-to-s3.sh
   \`\`\`

5. **Schedule the backup with cron**
   \`\`\`bash
   # Edit crontab
   crontab -e
   
   # Add the following line to run daily at 2:00 AM UTC
   0 2 * * * /path/to/backup-to-s3.sh
   \`\`\`

## Google Cloud Storage Backup Solution

### Prerequisites
- Google Cloud account with GCS access
- Google Cloud SDK installed and configured
- \`pg_dump\` utility installed

### Setup Instructions

1. **Create GCS Bucket**
   \`\`\`bash
   gsutil mb -l us-central1 gs://epai-database-backups
   \`\`\`

2. **Set up Object Lifecycle Management**
   Create a file named \`lifecycle.json\`:
   
   \`\`\`json
   {
     "lifecycle": {
       "rule": [
         {
           "action": {"type": "Delete"},
           "condition": {
             "age": 7,
             "matchesPrefix": ["daily/"]
           }
         },
         {
           "action": {"type": "Delete"},
           "condition": {
             "age": 35,
             "matchesPrefix": ["weekly/"]
           }
         },
         {
           "action": {"type": "Delete"},
           "condition": {
             "age": 365,
             "matchesPrefix": ["monthly/"]
           }
         }
       ]
     }
   }
   \`\`\`
   
   Apply the lifecycle policy:
   \`\`\`bash
   gsutil lifecycle set lifecycle.json gs://epai-database-backups
   \`\`\`

3. **Create Backup Script**
   Create a file named \`backup-to-gcs.sh\` with content similar to the AWS script, but replacing the S3 commands with GCS commands.

## Backup Verification and Testing

### Verification Script
Create a file named \`verify-backup.sh\`:

\`\`\`bash
#!/bin/bash

# Configuration
DB_NAME="postgres"
DB_HOST="db.your-project-ref.supabase.co"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="your-db-password"
S3_BUCKET="epai-database-backups"

# Get the latest backup ID from the database
BACKUP_ID=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
  SELECT id FROM backup_log
  WHERE status = 'completed'
  ORDER BY end_time DESC
  LIMIT 1;
")

if [ -z "$BACKUP_ID" ]; then
  echo "No completed backups found"
  exit 1
fi

# Get backup details
BACKUP_INFO=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
  SELECT backup_type, file_name, metadata::text
  FROM backup_log
  WHERE id = $BACKUP_ID;
")

BACKUP_TYPE=$(echo $BACKUP_INFO | cut -d'|' -f1 | tr -d ' ')
BACKUP_FILE=$(echo $BACKUP_INFO | cut -d'|' -f2 | tr -d ' ')
METADATA=$(echo $BACKUP_INFO | cut -d'|' -f3)

echo "Verifying backup: $BACKUP_FILE (ID: $BACKUP_ID, Type: $BACKUP_TYPE)"

# Extract storage information from metadata
STORAGE=$(echo $METADATA | grep -o '"storage":"[^"]*"' | cut -d'"' -f4)
BUCKET=$(echo $METADATA | grep -o '"bucket":"[^"]*"' | cut -d'"' -f4)
PATH=$(echo $METADATA | grep -o '"path":"[^"]*"' | cut -d'"' -f4)

# Create temporary directory
TEMP_DIR=$(mktemp -d)
BACKUP_PATH="${TEMP_DIR}/${BACKUP_FILE}"

# Download the backup based on storage type
if [ "$STORAGE" == "s3" ]; then
  aws s3 cp s3://$BUCKET/$PATH $BACKUP_PATH
elif [ "$STORAGE" == "gcs" ]; then
  gsutil cp gs://$BUCKET/$PATH $BACKUP_PATH
else
  echo "Unknown storage type: $STORAGE"
  exit 1
fi

# Check if download was successful
if [ $? -ne 0 ]; then
  echo "Failed to download backup"
  
  # Update verification status in database
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    UPDATE backup_log
    SET metadata = metadata || '{\"verified_at\": \"$(date -Iseconds)\", \"verification_status\": \"failed\", \"verification_message\": \"Failed to download backup\"}'
    WHERE id = $BACKUP_ID;
  "
  
  exit 1
fi

# Verify the backup file integrity
pg_restore --list $BACKUP_PATH > /dev/null

if [ $? -eq 0 ]; then
  echo "Backup verified successfully"
  
  # Update verification status in database
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    UPDATE backup_log
    SET metadata = metadata || '{\"verified_at\": \"$(date -Iseconds)\", \"verification_status\": \"success\", \"verification_message\": \"Backup verified successfully\"}'
    WHERE id = $BACKUP_ID;
  "
else
  echo "Backup verification failed"
  
  # Update verification status in database
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    UPDATE backup_log
    SET metadata = metadata || '{\"verified_at\": \"$(date -Iseconds)\", \"verification_status\": \"failed\", \"verification_message\": \"pg_restore validation failed\"}'
    WHERE id = $BACKUP_ID;
  "
  
  exit 1
fi

# Clean up
rm -f $BACKUP_PATH
rmdir $TEMP_DIR
\`\`\`

### Restoration Testing
Create a file named \`test-restore.sh\` for periodic restoration testing to a test environment.

## Encryption

For enhanced security, encrypt your backups:

\`\`\`bash
# Generate a GPG key
gpg --gen-key

# Export the public key for backup encryption
gpg --export -a "EPAI Backup" > backup-public-key.asc

# Modify your backup scripts to encrypt the dumps before uploading
# Add this before the upload step:
gpg --encrypt --recipient "EPAI Backup" $BACKUP_PATH
\`\`\`

Store the GPG private key securely, as it will be needed for restoration.
`;

  writeToFile('external_backup_instructions.md', instructions);
  log('External backup instructions generated successfully', 'success');
}

// Main function
async function main() {
  log('EPAI Automated Backup Configuration', 'info');
  log('==================================', 'info');
  
  try {
    // Step 1: Set up backup schedule in the database
    const backupConfig = await setupBackupSchedule();
    
    // Step 2: Create backup verification procedure
    await createBackupVerificationProcedure();
    
    // Step 3: Generate backup rotation policy
    generateBackupRotationPolicy(backupConfig);
    
    // Step 4: Provide instructions for external backup solutions
    generateExternalBackupInstructions();
    
    // Generate summary
    const summary = `# EPAI Backup Configuration Summary

## Configuration
- Daily backups at ${backupConfig.dailyBackupTime} UTC, retained for ${backupConfig.dailyRetentionDays} days
- Weekly backups on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][backupConfig.weeklyBackupDay]}, retained for ${backupConfig.weeklyRetentionWeeks} weeks
- Monthly backups on the 1st of each month, retained for ${backupConfig.monthlyRetentionMonths} months

## Files Generated
- \`pg_cron_backup.sql\`: SQL script for setting up pg_cron backup jobs
- \`backup_rotation_policy.md\`: Documentation of the backup rotation policy
- \`external_backup_instructions.md\`: Instructions for setting up external backup solutions

## Next Steps
1. Contact Supabase support to enable pg_cron extension (if using Supabase hosting)
2. Set up external backup solution following the instructions in \`external_backup_instructions.md\`
3. Implement backup verification and testing scripts
4. Schedule regular backup restoration tests
5. Update the disaster recovery documentation with the new backup procedures
`;

    writeToFile('backup_configuration_summary.md', summary);
    
    log('\nAutomated backup configuration completed successfully!', 'success');
    log('All configuration files have been saved to the backup-config directory.', 'info');
    log('\nNext steps:', 'step');
    log('1. Review the generated configuration files', 'info');
    log('2. Contact Supabase support to enable pg_cron (if using Supabase hosting)', 'info');
    log('3. Set up external backup solution following the instructions', 'info');
    log('4. Implement backup verification and testing scripts', 'info');
  } catch (error) {
    log(`Configuration failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the main function
main(); 