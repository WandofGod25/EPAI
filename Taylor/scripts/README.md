# EPAI Security Testing Scripts

This directory contains scripts for security testing and preparation for the Embedded Predictive Analytics Integrator (EPAI) platform.

## Overview

These scripts are designed to help with:
1. Setting up test data for security testing
2. Testing security features of the platform
3. Configuring security settings
4. Applying security migrations

## Scripts

### Security Testing

- `test-security.js` - Comprehensive script to test various security features:
  - Rate limiting
  - API key authentication
  - Security headers
  - SQL injection protection
  - XSS protection

### Test Data Management

- `create-minimal-test-data.js` - Creates minimal test data (partners and security events)
- `create-security-events.js` - Creates security events for testing
- `create-test-data-final.js` - Creates comprehensive test data for all tables
- `setup-test-data.js` - Initial script for setting up test data

### Database Schema Inspection

- `check-schema.js` - Checks database schema using RPC
- `check-schema-direct.js` - Checks database schema using direct SQL
- `describe-table.js` - Describes structure of a specific table
- `simple-describe-table.js` - Simple script to describe table structure
- `simple-schema-check.js` - Simple script to check database schema

### Security Configuration

- `apply-security-migrations.js` - Applies security-related database migrations
- `configure-security-settings.js` - Configures security settings (rate limiting, data retention, API key security)

### Environment Configuration

- `test.env` - Environment variables for testing

## Usage

### Setting Up Test Data

```bash
# Create minimal test data (partners and security events)
node scripts/create-minimal-test-data.js

# Create security events only
node scripts/create-security-events.js
```

### Running Security Tests

```bash
# Run comprehensive security tests
node scripts/test-security.js
```

### Checking Database Schema

```bash
# Check database schema
node scripts/simple-schema-check.js

# Describe a specific table
node scripts/simple-describe-table.js table_name
```

### Applying Security Configuration

```bash
# Apply security migrations
node scripts/apply-security-migrations.js

# Configure security settings
node scripts/configure-security-settings.js
```

## Notes

- These scripts are designed to be run in a test environment
- Some scripts require a running Supabase instance
- The `test.env` file contains environment variables for testing
- For production deployment, use the production configuration scripts 