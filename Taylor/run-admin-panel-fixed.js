import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the admin panel directory
const adminPanelDir = path.join(__dirname, 'packages/admin-panel');

// Create a temporary .env file with correct values
const envContent = `VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
VITE_API_BASE_URL=http://127.0.0.1:54321/functions/v1`;

const envPath = path.join(adminPanelDir, '.env');
console.log(`Creating .env file at: ${envPath}`);

try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('Successfully created .env file with correct values');
} catch (error) {
  console.error(`Error creating .env file: ${error.message}`);
  process.exit(1);
}

// Run the admin panel with the new environment variables
console.log('Starting admin panel...');
const npmProcess = spawn('npm', ['run', 'dev'], {
  cwd: adminPanelDir,
  env: {
    ...process.env,
    VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    VITE_SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
    VITE_API_BASE_URL: 'http://127.0.0.1:54321/functions/v1'
  },
  stdio: 'inherit'
});

npmProcess.on('error', (error) => {
  console.error(`Error starting admin panel: ${error.message}`);
  process.exit(1);
});

npmProcess.on('exit', (code) => {
  console.log(`Admin panel process exited with code ${code}`);
});

console.log('Admin panel should be running at http://localhost:5174');
console.log('Use Ctrl+C to stop the admin panel'); 