#!/usr/bin/env node

/**
 * Fix Environment Configuration Script
 * 
 * This script properly configures the environment for the admin panel
 * to connect to the production Supabase instance.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the admin panel directory
const adminPanelDir = path.join(__dirname, 'packages/admin-panel');

// Correct production environment content (single line per variable)
const productionEnvContent = `VITE_SUPABASE_URL=https://rxeqkrfldtywkhnxcoys.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQyMTY4OSwiZXhwIjoyMDY0OTk3Njg5fQ.0D4A99QwPrmU_ecC5KkAQl4isJ3vspSWkYjPYvnEYaU
VITE_API_BASE_URL=https://rxeqkrfldtywkhnxcoys.supabase.co/functions/v1`;

const envPath = path.join(adminPanelDir, '.env');

try {
    // Backup current .env if it exists
    if (fs.existsSync(envPath)) {
        const backupPath = path.join(adminPanelDir, '.env.broken');
        fs.copyFileSync(envPath, backupPath);
        console.log(`✅ Backed up broken .env to .env.broken`);
    }
    
    // Write correct production environment
    fs.writeFileSync(envPath, productionEnvContent);
    console.log(`✅ Fixed .env with proper production configuration`);
    console.log(`🌐 Production URL: https://rxeqkrfldtywkhnxcoys.supabase.co`);
    console.log(`📧 Test Email: ange_andre25@yahoo.com`);
    console.log(`🔑 Test Password: Taylortest`);
    console.log(`\n🚀 Environment is now properly configured!`);
    
} catch (error) {
    console.error('❌ Failed to fix environment:', error);
} 