/**
 * Test Data Retention and Purging Policies
 * 
 * This script tests the data retention and purging functionality implemented in the
 * 20240801000000_add_data_retention.sql migration.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { format } from 'date-fns';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key (required for admin operations)
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get data retention summary
 */
async function getDataRetentionSummary() {
  try {
    const { data, error } = await supabase.rpc('get_data_retention_summary');
    
    if (error) throw error;
    
    console.log('\n=== Data Retention Summary ===');
    console.table(data);
    
    return data;
  } catch (error) {
    console.error('Error getting data retention summary:', error.message);
    return null;
  }
}

/**
 * Run the data purging function
 */
async function purgeExpiredData() {
  try {
    const { data, error } = await supabase.rpc('purge_expired_data');
    
    if (error) throw error;
    
    console.log(`\n=== Data Purging Results ===`);
    console.log(`Purged ${data} records based on retention policies`);
    
    return data;
  } catch (error) {
    console.error('Error purging expired data:', error.message);
    return null;
  }
}

/**
 * Get recent deletion audit records
 */
async function getDeletionAuditRecords(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('data_deletion_audit')
      .select('*')
      .order('deleted_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    console.log('\n=== Recent Deletion Audit Records ===');
    
    if (data.length === 0) {
      console.log('No deletion audit records found');
    } else {
      data.forEach(record => {
        console.log(`[${format(new Date(record.deleted_at), 'yyyy-MM-dd HH:mm:ss')}] ${record.deletion_type} - ${record.table_name} - ${record.record_id} - ${record.reason || 'No reason provided'}`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error getting deletion audit records:', error.message);
    return null;
  }
}

/**
 * Update retention policy for a table
 */
async function updateRetentionPolicy(tableName, retentionDays) {
  try {
    const { data, error } = await supabase
      .from('data_retention_config')
      .update({ retention_days: retentionDays, updated_at: new Date() })
      .eq('table_name', tableName)
      .select();
    
    if (error) throw error;
    
    console.log(`\n=== Retention Policy Updated ===`);
    console.log(`Table: ${tableName}`);
    console.log(`New retention period: ${retentionDays} days`);
    
    return data;
  } catch (error) {
    console.error(`Error updating retention policy for ${tableName}:`, error.message);
    return null;
  }
}

/**
 * Test GDPR data deletion for a partner
 */
async function testGdprDeletion(partnerId) {
  try {
    const { data, error } = await supabase.rpc('delete_partner_data', {
      p_partner_id: partnerId,
      p_reason: 'GDPR test deletion',
      p_delete_account: false
    });
    
    if (error) throw error;
    
    console.log('\n=== GDPR Deletion Test Results ===');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error testing GDPR deletion:', error.message);
    return null;
  }
}

/**
 * Test data anonymization for a partner
 */
async function testDataAnonymization(partnerId) {
  try {
    const { data, error } = await supabase.rpc('anonymize_partner_data', {
      p_partner_id: partnerId,
      p_reason: 'CCPA anonymization test'
    });
    
    if (error) throw error;
    
    console.log('\n=== Data Anonymization Test Results ===');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error testing data anonymization:', error.message);
    return null;
  }
}

/**
 * Main function to run the tests
 */
async function main() {
  console.log('=== Testing Data Retention and Purging Policies ===');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  // Get current retention policies and data summary
  await getDataRetentionSummary();
  
  // Run the purging function
  await purgeExpiredData();
  
  // Check the deletion audit records
  await getDeletionAuditRecords();
  
  // If command line arguments are provided for testing GDPR deletion
  if (process.argv.length > 2 && process.argv[2] === '--test-gdpr') {
    const partnerId = process.argv[3];
    if (partnerId) {
      await testGdprDeletion(partnerId);
    } else {
      console.error('Partner ID is required for GDPR deletion test');
    }
  }
  
  // If command line arguments are provided for testing data anonymization
  if (process.argv.length > 2 && process.argv[2] === '--test-anonymize') {
    const partnerId = process.argv[3];
    if (partnerId) {
      await testDataAnonymization(partnerId);
    } else {
      console.error('Partner ID is required for data anonymization test');
    }
  }
  
  // If command line arguments are provided for updating retention policy
  if (process.argv.length > 2 && process.argv[2] === '--update-policy') {
    const tableName = process.argv[3];
    const retentionDays = parseInt(process.argv[4], 10);
    
    if (tableName && !isNaN(retentionDays)) {
      await updateRetentionPolicy(tableName, retentionDays);
      await getDataRetentionSummary();
    } else {
      console.error('Table name and retention days are required for updating retention policy');
    }
  }
}

// Run the main function
main()
  .catch(error => {
    console.error('Unhandled error:', error);
  })
  .finally(() => {
    process.exit(0);
  }); 