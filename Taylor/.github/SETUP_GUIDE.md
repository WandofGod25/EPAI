# GitHub Actions Setup Guide

This guide explains how to set up the GitHub Actions workflow for the EPAI project.

## Required Secrets

The following secrets need to be configured in your GitHub repository settings:

### Supabase Secrets

- `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
- `SUPABASE_DB_PASSWORD_STAGING`: Database password for staging environment
- `SUPABASE_DB_PASSWORD_PRODUCTION`: Database password for production environment

### Firebase Secrets

- `FIREBASE_SERVICE_ACCOUNT_STAGING`: Firebase service account JSON for staging
- `FIREBASE_SERVICE_ACCOUNT_PRODUCTION`: Firebase service account JSON for production

## Environment Variables

Create the following environment files in your repository:

### For Local Development

Create `.env` file in `packages/admin-panel/`:

```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
VITE_API_BASE_URL=http://localhost:54321/functions/v1
```

### For CI/CD

For GitHub Actions, add the following environment variables to your workflow:

```yaml
env:
  VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  NODE_ENV: test
```

## Setting Up Tests

Ensure that the test environment is properly configured:

1. Make sure `jest.setup.js` is properly linked in `jest.config.js`
2. Create a `.env.test` file for test-specific environment variables
3. Add mock implementations for Supabase functions in tests

## Troubleshooting

### Context Access Warnings

If you see "Context access warnings" in GitHub Actions, it's likely due to missing environment variables. Make sure all required environment variables are set in the workflow file.

### Test Failures

If tests are failing in CI but passing locally, check:

1. Environment differences between local and CI
2. Mock implementations for external services
3. Path aliases and module resolution 