import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if .env file exists
const envPath = path.join(__dirname, 'packages/admin-panel/.env');
console.log(`Checking for .env file at: ${envPath}`);

if (fs.existsSync(envPath)) {
  console.log('.env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('ENV file content (hiding keys):');
  const sanitizedContent = envContent
    .split('\n')
    .map(line => {
      if (line.includes('KEY')) {
        const parts = line.split('=');
        if (parts.length > 1) {
          return `${parts[0]}=***HIDDEN***`;
        }
      }
      return line;
    })
    .join('\n');
  console.log(sanitizedContent);
} else {
  console.log('.env file does not exist');
  
  // Create the .env file with default values
  console.log('Creating default .env file...');
  const defaultEnvContent = `VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
VITE_API_BASE_URL=http://127.0.0.1:54321/functions/v1`;
  
  // Create directory if it doesn't exist
  const envDir = path.dirname(envPath);
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }
  
  fs.writeFileSync(envPath, defaultEnvContent);
  console.log('Default .env file created');
} 