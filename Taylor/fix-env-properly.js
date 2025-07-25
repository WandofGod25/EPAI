import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the .env file
const envPath = path.join(__dirname, 'packages/admin-panel/.env');
console.log(`Fixing .env file at: ${envPath}`);

// Correct content for the .env file without line breaks
const correctEnvContent = `VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
VITE_API_BASE_URL=http://127.0.0.1:54321/functions/v1`;

// Create backup of the current .env file
if (fs.existsSync(envPath)) {
  const backupPath = `${envPath}.backup-${Date.now()}`;
  fs.copyFileSync(envPath, backupPath);
  console.log(`Backup created at: ${backupPath}`);
}

// Write the corrected .env file
fs.writeFileSync(envPath, correctEnvContent);
console.log('.env file has been fixed with correct values');

// Verify the file was written correctly
const verifyContent = fs.readFileSync(envPath, 'utf8');
console.log('Verifying file content:');
console.log(verifyContent); 