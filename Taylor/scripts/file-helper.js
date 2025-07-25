#!/usr/bin/env node

/**
 * EPAI File Helper
 * 
 * This script provides reliable file operations for the EPAI platform.
 * It can:
 * 1. Create files with content
 * 2. Append content to files
 * 3. Replace content in files
 * 
 * Usage:
 * node scripts/file-helper.js create <file> <content>
 * node scripts/file-helper.js append <file> <content>
 * node scripts/file-helper.js replace <file> <oldContent> <newContent>
 */

import fs from 'fs';
import path from 'path';

// Main function
function main() {
  const command = process.argv[2];
  const filePath = process.argv[3];
  
  if (!command || !filePath) {
    console.error('Error: Missing required arguments');
    console.error('Usage: node file-helper.js <command> <file> [content]');
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'create':
        const createContent = process.argv[4] || '';
        createFile(filePath, createContent);
        break;
      case 'append':
        const appendContent = process.argv[4] || '';
        appendToFile(filePath, appendContent);
        break;
      case 'replace':
        const oldContent = process.argv[4] || '';
        const newContent = process.argv[5] || '';
        replaceInFile(filePath, oldContent, newContent);
        break;
      case 'read':
        readFile(filePath);
        break;
      default:
        console.error(`Error: Unknown command "${command}"`);
        console.error('Valid commands: create, append, replace, read');
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Create a file with content
function createFile(filePath, content) {
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`File created: ${filePath}`);
}

// Append content to a file
function appendToFile(filePath, content) {
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Create file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '');
  }
  
  fs.appendFileSync(filePath, content);
  console.log(`Content appended to: ${filePath}`);
}

// Replace content in a file
function replaceInFile(filePath, oldContent, newContent) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File does not exist: ${filePath}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const newFileContent = content.replace(oldContent, newContent);
  
  fs.writeFileSync(filePath, newFileContent);
  console.log(`Content replaced in: ${filePath}`);
}

// Read a file
function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File does not exist: ${filePath}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(content);
}

// Run the main function
main();
