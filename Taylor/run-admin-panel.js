import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if .env file exists
const envPath = path.join(__dirname, 'packages/admin-panel/.env');
console.log('Checking for .env file at:', envPath);
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
}

// Run the admin panel
console.log('Starting admin panel...');
const adminPanel = spawn('pnpm', ['--filter', '@epai/admin-panel', 'dev'], {
  stdio: 'inherit',
  shell: true
});

adminPanel.on('error', (error) => {
  console.error('Failed to start admin panel:', error);
});

adminPanel.on('close', (code) => {
  console.log(`Admin panel process exited with code ${code}`);
}); 