#!/usr/bin/env node

/**
 * EPAI Pilot Partner Setup
 * 
 * This script creates initial pilot partner accounts in the database,
 * including user accounts and API keys.
 * 
 * Usage: node scripts/create-pilot-partners.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

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

// Pilot partner data
const pilotPartners = [
  {
    name: 'EventFlow Inc.',
    email: 'admin@eventflow.example',
    password: 'EventFlow2024!',
    description: 'Event management platform pilot partner',
  },
  {
    name: 'DataInsights Corp.',
    email: 'admin@datainsights.example',
    password: 'DataInsights2024!',
    description: 'Analytics dashboard provider pilot partner',
  },
  {
    name: 'SalesBoost Ltd.',
    email: 'admin@salesboost.example',
    password: 'SalesBoost2024!',
    description: 'CRM enhancement pilot partner',
  }
];

/**
 * Generate an API key in the format "epai_live_XXXXXXXXXXXXXXXXXXXX"
 */
function generateApiKey() {
  const randomPart = uuidv4().replace(/-/g, '').substring(0, 24);
  return `epai_live_${randomPart}`;
}

/**
 * Create a pilot partner account
 */
async function createPilotPartner(partner) {
  console.log(chalk.blue(`Creating pilot partner: ${partner.name}`));
  
  try {
    // 1. Create user account
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: partner.email,
      password: partner.password,
      email_confirm: true,
    });
    
    if (userError) {
      console.error(chalk.red(`Error creating user for ${partner.name}:`), userError.message);
      return null;
    }
    
    console.log(chalk.green(`✓ User account created for ${partner.email}`));
    
    // 2. Verify partner record was created by the trigger
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();
    
    if (partnerError || !partnerData) {
      console.error(chalk.red(`Error finding partner record for ${partner.name}:`), 
        partnerError ? partnerError.message : 'No partner record found');
        
      // Create partner record manually if trigger failed
      const { data: newPartnerData, error: newPartnerError } = await supabase
        .from('partners')
        .insert({
          name: partner.name,
          user_id: userData.user.id,
          description: partner.description
        })
        .select()
        .single();
        
      if (newPartnerError) {
        console.error(chalk.red(`Error creating partner record for ${partner.name}:`), newPartnerError.message);
        return null;
      }
      
      console.log(chalk.green(`✓ Manually created partner record for ${partner.name}`));
      return { user: userData.user, partner: newPartnerData };
    }
    
    console.log(chalk.green(`✓ Partner record exists for ${partner.name}`));
    
    // 3. Update partner with additional information
    const { error: updateError } = await supabase
      .from('partners')
      .update({
        name: partner.name,
        description: partner.description
      })
      .eq('id', partnerData.id);
      
    if (updateError) {
      console.error(chalk.red(`Error updating partner data for ${partner.name}:`), updateError.message);
    } else {
      console.log(chalk.green(`✓ Updated partner data for ${partner.name}`));
    }
    
    // 4. Verify API key was created by the trigger
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('partner_id', partnerData.id)
      .maybeSingle();
      
    if (apiKeyError || !apiKeyData) {
      // Create API key manually if not found
      const apiKey = generateApiKey();
      const hashedKey = await bcrypt.hash(apiKey, 10);
      
      const { data: newKeyData, error: newKeyError } = await supabase
        .from('api_keys')
        .insert({
          partner_id: partnerData.id,
          hashed_key: hashedKey,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiration
          created_by: 'pilot-setup-script'
        })
        .select()
        .single();
        
      if (newKeyError) {
        console.error(chalk.red(`Error creating API key for ${partner.name}:`), newKeyError.message);
      } else {
        console.log(chalk.green(`✓ Created new API key for ${partner.name}`));
        
        // Store the API key in the partner info document
        return { 
          user: userData.user, 
          partner: partnerData,
          apiKey: apiKey
        };
      }
    } else {
      console.log(chalk.green(`✓ API key exists for ${partner.name}`));
    }
    
    return { user: userData.user, partner: partnerData };
    
  } catch (error) {
    console.error(chalk.red(`Unexpected error creating pilot partner ${partner.name}:`), error.message);
    return null;
  }
}

/**
 * Main function to create all pilot partners
 */
async function main() {
  console.log(chalk.blue('=== EPAI Pilot Partner Setup ==='));
  console.log(chalk.blue('Creating pilot partner accounts...'));
  
  // Create directory for partner info if it doesn't exist
  const partnerInfoDir = path.join(process.cwd(), 'pilot-partners');
  if (!fs.existsSync(partnerInfoDir)) {
    fs.mkdirSync(partnerInfoDir, { recursive: true });
  }
  
  // Create all pilot partners
  const results = [];
  for (const partner of pilotPartners) {
    const result = await createPilotPartner(partner);
    if (result) {
      results.push({
        name: partner.name,
        email: partner.email,
        password: partner.password,
        userId: result.user.id,
        partnerId: result.partner.id,
        apiKey: result.apiKey || '(managed by system)'
      });
    }
  }
  
  // Write results to file
  if (results.length > 0) {
    const outputPath = path.join(partnerInfoDir, 'pilot-partner-credentials.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(chalk.green(`✓ Created ${results.length} pilot partner(s)`));
    console.log(chalk.blue(`Partner credentials saved to: ${outputPath}`));
  } else {
    console.log(chalk.red('No pilot partners were created successfully'));
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 