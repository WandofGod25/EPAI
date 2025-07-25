#!/usr/bin/env node

/**
 * EPAI Partner Account Creation Script
 * 
 * This script creates partner accounts for pilot testing.
 * It creates a Supabase user, inserts a partner record, and
 * generates an API key for the partner.
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'scripts/.env') });

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://rxeqkrfldtywkhnxcoys.supabase.co',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  outputDir: path.resolve(process.cwd(), 'partner-onboarding'),
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Log formatted messages
 */
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

/**
 * Create Supabase client
 */
function createSupabaseClient() {
  if (!CONFIG.supabaseServiceKey) {
    log('SUPABASE_SERVICE_ROLE_KEY is not set in .env', 'error');
    process.exit(1);
  }

  return createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceKey);
}

/**
 * Prompt for input
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Create partner account
 */
async function createPartnerAccount() {
  try {
    const supabase = createSupabaseClient();
    
    // Get partner details
    log('Creating new partner account...', 'step');
    const companyName = await prompt('Company Name: ');
    const email = await prompt('Email: ');
    const password = await prompt('Password: ');
    const industry = await prompt('Industry: ');
    const contactName = await prompt('Contact Name: ');
    
    // Create user
    log('Creating Supabase user...', 'step');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification for pilot
    });
    
    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`);
    }
    
    const userId = userData.user.id;
    log(`User created with ID: ${userId}`, 'success');
    
    // Create partner record manually (in case trigger doesn't work)
    log('Creating partner record...', 'step');
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .insert({
        user_id: userId,
        company_name: companyName,
        industry,
        contact_name: contactName,
        contact_email: email,
        status: 'active',
        tier: 'pilot'
      })
      .select()
      .single();
    
    if (partnerError) {
      throw new Error(`Failed to create partner record: ${partnerError.message}`);
    }
    
    const partnerId = partnerData.id;
    log(`Partner record created with ID: ${partnerId}`, 'success');
    
    // Generate API key
    log('Generating API key...', 'step');
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .rpc('regenerate_api_key_for_partner_admin', { p_partner_id: partnerId });
    
    if (apiKeyError) {
      throw new Error(`Failed to generate API key: ${apiKeyError.message}`);
    }
    
    const apiKey = apiKeyData[0];
    log(`API key generated: ${apiKey.substring(0, 8)}...`, 'success');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    // Save partner details to file
    const outputFile = path.join(CONFIG.outputDir, `partner-${partnerId}.json`);
    const partnerDetails = {
      partnerId,
      userId,
      companyName,
      email,
      industry,
      contactName,
      apiKey,
      createdAt: new Date().toISOString(),
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(partnerDetails, null, 2));
    log(`Partner details saved to: ${outputFile}`, 'success');
    
    // Generate welcome email content
    const welcomeEmailFile = path.join(CONFIG.outputDir, `welcome-email-${partnerId}.md`);
    const welcomeEmail = `# Welcome to the EPAI Pilot Program

Dear ${contactName},

Thank you for joining the EPAI Pilot Program. We're excited to have you on board!

## Your Account Details

- **Company**: ${companyName}
- **Email**: ${email}
- **API Key**: \`${apiKey}\`

## Getting Started

1. Log in to the Admin Panel at: ${CONFIG.supabaseUrl.replace('https://', 'https://app.')}
2. Visit the Settings page to view your API key
3. Follow our Integration Guide at: ${CONFIG.supabaseUrl.replace('https://', 'https://app.')}/docs/integration-guide

## Support

During the pilot, you have access to dedicated support:

- Email: pilot-support@epai.example.com
- Slack Channel: #epai-pilot-support
- Office Hours: Every Tuesday and Thursday, 2-4pm ET

We look forward to your feedback!

Best regards,
The EPAI Team
`;
    
    fs.writeFileSync(welcomeEmailFile, welcomeEmail);
    log(`Welcome email template saved to: ${welcomeEmailFile}`, 'success');
    
    return partnerDetails;
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  log('EPAI Partner Account Creation Script', 'info');
  log('===================================', 'info');
  
  try {
    // Create partner account
    const partnerDetails = await createPartnerAccount();
    
    log('\nPartner account created successfully!', 'success');
    log(`Partner ID: ${partnerDetails.partnerId}`, 'info');
    log(`User ID: ${partnerDetails.userId}`, 'info');
    log(`Company: ${partnerDetails.companyName}`, 'info');
    log(`Email: ${partnerDetails.email}`, 'info');
    log(`API Key: ${partnerDetails.apiKey.substring(0, 8)}...`, 'info');
    
    log('\nNext steps:', 'info');
    log('1. Send the welcome email to the partner', 'info');
    log('2. Schedule an onboarding session', 'info');
    log('3. Assist with initial SDK integration', 'info');
  } catch (error) {
    log(`Failed to create partner account: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the main function
main(); 