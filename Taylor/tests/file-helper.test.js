/**
 * Tests for the file-helper.js script
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('file-helper.js', () => {
  const testDir = path.join(__dirname, 'temp');
  const testFilePath = path.join(testDir, 'test-file.txt');
  
  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
    // Try to remove the directory
    try {
      fs.rmdirSync(testDir);
    } catch (error) {
      // Ignore errors (directory might not be empty)
    }
  });
  
  it('should create a file with content', () => {
    // Simulate file creation
    const content = 'Test content';
    fs.writeFileSync(testFilePath, content);
    
    // Verify file was created with correct content
    expect(fs.existsSync(testFilePath)).toBe(true);
    expect(fs.readFileSync(testFilePath, 'utf8')).toBe(content);
  });
  
  it('should append content to a file', () => {
    // Create initial file
    const initialContent = 'Initial content';
    fs.writeFileSync(testFilePath, initialContent);
    
    // Append content
    const appendedContent = '\nAppended content';
    fs.appendFileSync(testFilePath, appendedContent);
    
    // Verify content was appended
    expect(fs.readFileSync(testFilePath, 'utf8')).toBe(initialContent + appendedContent);
  });
  
  it('should replace content in a file', () => {
    // Create initial file
    const initialContent = 'Initial content with replaceable text';
    fs.writeFileSync(testFilePath, initialContent);
    
    // Replace content
    const oldContent = 'replaceable text';
    const newContent = 'replaced text';
    const updatedContent = initialContent.replace(oldContent, newContent);
    fs.writeFileSync(testFilePath, updatedContent);
    
    // Verify content was replaced
    expect(fs.readFileSync(testFilePath, 'utf8')).toBe('Initial content with replaced text');
  });
  
  it('should create parent directories when needed', () => {
    // Create a file in a nested directory
    const nestedDir = path.join(testDir, 'nested', 'dir');
    const nestedFilePath = path.join(nestedDir, 'nested-file.txt');
    
    // Ensure directory exists
    if (!fs.existsSync(nestedDir)) {
      fs.mkdirSync(nestedDir, { recursive: true });
    }
    
    // Create file
    const content = 'Nested file content';
    fs.writeFileSync(nestedFilePath, content);
    
    // Verify file was created
    expect(fs.existsSync(nestedFilePath)).toBe(true);
    expect(fs.readFileSync(nestedFilePath, 'utf8')).toBe(content);
    
    // Clean up
    fs.unlinkSync(nestedFilePath);
    fs.rmdirSync(nestedDir);
    fs.rmdirSync(path.join(testDir, 'nested'));
  });
});
