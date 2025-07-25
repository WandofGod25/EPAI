#!/usr/bin/env node

/**
 * EPAI Template Generator
 * 
 * This script generates template files for the EPAI platform.
 * It provides templates for:
 * 1. Scripts
 * 2. Documentation
 * 3. Test files
 * 
 * Usage:
 * node scripts/template-generator.js script <name> <description>
 * node scripts/template-generator.js doc <name> <title>
 * node scripts/template-generator.js test <name> <description>
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const CONFIG = {
  scriptsDir: path.join(process.cwd(), 'scripts'),
  docsDir: path.join(process.cwd(), 'docs'),
  testsDir: path.join(process.cwd(), 'tests'),
};

// Main function
function main() {
  const templateType = process.argv[2];
  const name = process.argv[3];
  const description = process.argv[4] || '';
  
  if (!templateType || !name) {
    console.error('Error: Missing required arguments');
    console.error('Usage: node template-generator.js <type> <name> [description]');
    process.exit(1);
  }
  
  try {
    switch (templateType) {
      case 'script':
        generateScript(name, description);
        break;
      case 'doc':
        generateDoc(name, description);
        break;
      case 'test':
        generateTest(name, description);
        break;
      default:
        console.error(`Error: Unknown template type "${templateType}"`);
        console.error('Valid types: script, doc, test');
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Generate a script template
function generateScript(name, description) {
  const filePath = path.join(CONFIG.scriptsDir, `${name}.js`);
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.error(`Error: File already exists: ${filePath}`);
    process.exit(1);
  }
  
  // Ensure directory exists
  if (!fs.existsSync(CONFIG.scriptsDir)) {
    fs.mkdirSync(CONFIG.scriptsDir, { recursive: true });
  }
  
  const content = `#!/usr/bin/env node

/**
 * ${description || `EPAI ${name} Script`}
 * 
 * Usage:
 * node scripts/${name}.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const CONFIG = {
  // Add configuration here
};

// Helper function for logging
function log(message, type = 'info') {
  const prefix = {
    info: 'ℹ',
    success: '✓',
    error: '✗',
    warning: '⚠',
    step: '➤',
  };
  
  console.log(\`\${prefix[type]} \${message}\`);
}

// Main function
async function main() {
  log('${description || `EPAI ${name} Script`}', 'info');
  log('${'='.repeat(description ? description.length : name.length + 11)}', 'info');
  
  try {
    // Your code here
    
    log('\\nCompleted successfully!', 'success');
  } catch (error) {
    log(\`Error: \${error.message}\`, 'error');
    process.exit(1);
  }
}

// Run the main function
main();
`;
  
  fs.writeFileSync(filePath, content);
  fs.chmodSync(filePath, 0o755); // Make executable
  
  console.log(`Script template generated: ${filePath}`);
  
  // Update package.json to add a script entry
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      const scriptName = name.replace(/[-_]/g, ':');
      packageJson.scripts[scriptName] = `node scripts/${name}.js`;
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`Added script entry to package.json: ${scriptName}`);
    }
  } catch (error) {
    console.warn(`Warning: Could not update package.json: ${error.message}`);
  }
}

// Generate a documentation template
function generateDoc(name, title) {
  const filePath = path.join(CONFIG.docsDir, `${name}.md`);
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.error(`Error: File already exists: ${filePath}`);
    process.exit(1);
  }
  
  // Ensure directory exists
  if (!fs.existsSync(CONFIG.docsDir)) {
    fs.mkdirSync(CONFIG.docsDir, { recursive: true });
  }
  
  const content = `# ${title || name}

## Overview

[Brief description of the document]

## Contents

- [Section 1](#section-1)
- [Section 2](#section-2)
- [Section 3](#section-3)

## Section 1

[Content for section 1]

## Section 2

[Content for section 2]

## Section 3

[Content for section 3]
`;
  
  fs.writeFileSync(filePath, content);
  
  console.log(`Documentation template generated: ${filePath}`);
}

// Generate a test template
function generateTest(name, description) {
  const filePath = path.join(CONFIG.testsDir, `${name}.test.js`);
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.error(`Error: File already exists: ${filePath}`);
    process.exit(1);
  }
  
  // Ensure directory exists
  if (!fs.existsSync(CONFIG.testsDir)) {
    fs.mkdirSync(CONFIG.testsDir, { recursive: true });
  }
  
  const content = `/**
 * ${description || `EPAI ${name} Tests`}
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('${name}', () => {
  beforeEach(() => {
    // Setup code
  });
  
  afterEach(() => {
    // Cleanup code
  });
  
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });
  
  // Add more tests here
});
`;
  
  fs.writeFileSync(filePath, content);
  
  console.log(`Test template generated: ${filePath}`);
}

// Run the main function
main();
