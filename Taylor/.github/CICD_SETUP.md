# EPAI CI/CD Setup Guide

This document provides instructions for setting up and troubleshooting the CI/CD pipeline for the Embedded Predictive Analytics Integrator (EPAI) project.

## 🔍 **Root Cause Analysis: Context Access Warnings**

The 12 "Context access might be invalid" warnings in the CI/CD pipeline are caused by **GitHub Actions trying to validate that referenced secrets will be available at runtime**, but encountering validation failures.

### **🎯 What's Happening**

1. **Missing GitHub Repository Secrets**: The workflow references secrets that are **not configured** in the GitHub repository settings
2. **Context Validation Failures**: GitHub Actions can't validate that these secrets exist or will be accessible
3. **Environment Variable Mismatch**: The workflow falls back to default values that may not be appropriate for actual deployments

### **🔗 Application Dependencies**

The application **heavily depends** on these environment variables:

#### **Frontend (React/Vite)**
- `VITE_SUPABASE_URL`: Supabase project URL for client initialization
- `VITE_SUPABASE_ANON_KEY`: Anonymous key for authentication and API calls
- `VITE_API_BASE_URL`: Base URL for Edge Function calls

#### **Backend (Supabase Edge Functions)**
- `SUPABASE_ACCESS_TOKEN`: For deploying Edge Functions
- `SUPABASE_DB_PASSWORD_STAGING/PRODUCTION`: Database passwords for different environments
- `FIREBASE_SERVICE_ACCOUNT_STAGING/PRODUCTION`: Firebase hosting deployment credentials

#### **Testing Infrastructure**
- Jest configuration uses environment variables for test setup
- Integration tests require proper Supabase connections
- Component tests need mocked environment variables

## GitHub Actions Workflow

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml` and includes the following jobs:

1. **Lint**: Checks code quality using ESLint
2. **Test**: Runs unit and integration tests
3. **Build**: Builds the Admin Panel and SDK packages
4. **Deploy to Staging**: Deploys to the staging environment when changes are pushed to the `develop` branch
5. **Deploy to Production**: Deploys to the production environment when changes are pushed to the `main` branch

## Required Repository Secrets

The workflow uses GitHub repository secrets for authentication and deployment. You must add these secrets in your repository settings to resolve the context access warnings.

### Required Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings → Secrets and variables → Actions → New repository secret**
3. Add the following secrets:

```bash
# Supabase Secrets
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
SUPABASE_DB_PASSWORD_STAGING=your_staging_db_password
SUPABASE_DB_PASSWORD_PRODUCTION=your_production_db_password

# Firebase Secrets
FIREBASE_SERVICE_ACCOUNT_STAGING=your_staging_firebase_service_account_json
FIREBASE_SERVICE_ACCOUNT_PRODUCTION=your_production_firebase_service_account_json

# Optional: Override defaults for CI/CD
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
API_BASE_URL=your_production_api_base_url
```

### How to Get These Values

1. **Supabase Access Token**: 
   - Go to Supabase Dashboard → Settings → API
   - Generate a new access token

2. **Database Passwords**:
   - Go to Supabase Dashboard → Settings → Database
   - Copy the database password for each environment

3. **Firebase Service Accounts**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key for each environment

## Workflow Permissions

The workflow requires the following permissions:

- `contents: read`: To check out the code
- `id-token: write`: For authentication with cloud providers
- `packages: write`: For pushing to GitHub Packages
- `pull-requests: write`: For commenting on PRs

These permissions are defined at the top of the workflow file.

## Secure Handling of Secrets

The workflow uses several techniques to handle secrets securely:

1. **Output Parameters**: Project IDs are defined as outputs from separate steps to avoid context access warnings
2. **Password Files**: Database passwords are stored in temporary files and passed to commands via stdin
3. **Environment Variables**: Access tokens are passed as environment variables

This approach prevents secrets from appearing in logs and avoids GitHub Actions validation warnings.

## Deployment Configuration

### Supabase Projects

The workflow is configured to deploy to the following Supabase projects:
- Staging: `epai-staging-12345`
- Production: `epai-production-67890`

If your project IDs are different, update these values in the workflow file.

### Firebase Projects

The workflow is configured to deploy to the following Firebase projects:
- Staging: `epai-staging`
- Production: `epai-production`

If your project IDs are different, update these values in the workflow file.

## 📊 **Impact Assessment**

### **Current Impact**
- ✅ **Build Process**: Works with default values
- ❌ **Deployment**: Will fail due to missing secrets
- ⚠️ **Testing**: May fail if tests require specific environment variables
- ❌ **Security**: Using development credentials in production builds

### **After Fix**
- ✅ **Build Process**: Works with proper environment variables
- ✅ **Deployment**: Will succeed with proper credentials
- ✅ **Testing**: Will work with correct test environment
- ✅ **Security**: Proper separation of development and production credentials

## Troubleshooting

### Context Access Warnings

If you see warnings like `Context access might be invalid: SOME_VARIABLE`, it means GitHub Actions is having trouble validating that the secret or variable will be available at runtime. Our workflow avoids these warnings by:

1. **Using step outputs**: We set values in one step and reference them in another using the `steps.<step-id>.outputs` context
2. **Using environment variables**: We pass secrets as environment variables where possible
3. **Using password files**: We store sensitive values in temporary files that are deleted after use

### Why These Warnings Occur

GitHub Actions performs **static analysis** of workflow files to:
1. Validate that referenced secrets exist
2. Ensure proper context usage
3. Prevent runtime failures

When it can't validate a secret reference, it shows a warning because:
- The secret might not exist
- The secret might not be accessible in the current context
- There might be a syntax error in the reference

### Deployment Failures

If deployments fail, check the following:

1. **Supabase CLI errors**: Make sure the Supabase project reference and password are correct
2. **Firebase deployment errors**: Verify that the Firebase service account JSON is valid and has the necessary permissions
3. **Build artifacts**: Ensure that the build artifacts are being correctly uploaded and downloaded between jobs

## Modifying the CI/CD Pipeline

When making changes to the CI/CD pipeline:

1. Test changes locally when possible
2. Make small, incremental changes
3. Verify that the workflow passes validation
4. Monitor the first few runs after changes to ensure everything works as expected

## 🚀 **Implementation Steps**

### **Step 1: Configure GitHub Secrets**
1. Add all required secrets to GitHub repository settings
2. Verify secret names match workflow references
3. Test secret access with a simple workflow

### **Step 2: Environment Setup**
1. Create proper `.env` files for local development
2. Update test configuration to use correct environment variables
3. Verify all components work with the new configuration

### **Step 3: Validation**
1. Run the CI/CD pipeline with a test commit
2. Verify all jobs complete successfully
3. Check that deployments work correctly
4. Confirm no more context access warnings

## Project-Specific Notes

- The Supabase CLI now uses `--password-stdin` to read passwords securely
- Firebase hosting is used for deploying the Admin Panel
- The SDK is built but not separately deployed as it's included in the Admin Panel deployment

## 📝 **Next Steps**

1. **Immediate**: Configure the missing GitHub secrets
2. **Short-term**: Verify the workflow works with proper credentials
3. **Long-term**: Set up proper environment management and secret rotation

This will resolve all 12 context access warnings and ensure the CI/CD pipeline works correctly for all environments. 