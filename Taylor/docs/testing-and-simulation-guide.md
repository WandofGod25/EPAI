# EPAI Testing and Simulation Guide

This document provides instructions for testing and simulating the EPAI (Embedded Predictive Analytics Integrator) platform in a controlled environment. It's designed to help developers and testers verify the correct functioning of all components before deployment.

## Prerequisites

Before running the tests, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/installation) (v8 or higher)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (latest version)
- [Docker](https://www.docker.com/products/docker-desktop/) (for Supabase local development)

## Environment Setup

1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/yourusername/epai.git
   cd epai
   ```

2. Configure the test environment by copying the example environment file:
   ```bash
   cp scripts/test.env.example scripts/test.env
   ```

3. Edit `scripts/test.env` with your specific configuration values.

## Available Testing Scripts

### Full Testing Suite

To run the complete testing and simulation process:

```bash
./run-simulation.sh
```

This script will:
1. Set up the test environment
2. Start Supabase local development
3. Install dependencies
4. Prepare the test database
5. Run unit, integration, and component tests
6. Run end-to-end API tests
7. Run SDK integration tests
8. Run security tests
9. Test user flows
10. Run load tests
11. Build for production
12. Simulate deployment
13. Generate a summary of test results

### Specific Tests

To run specific tests individually:

```bash
./run-specific-test.sh [test-type]
```

Available test types:
- `setup`: Set up the test environment without running tests
- `unit`: Run unit tests
- `integration`: Run integration tests
- `component`: Run React component tests
- `e2e`: Run end-to-end API tests
- `sdk`: Run SDK integration tests
- `security`: Run security tests
- `userflows`: Run user flow tests
- `load`: Run load tests
- `build`: Build for production
- `deploy-simulation`: Run deployment simulation
- `all`: Run all tests

Example:
```bash
./run-specific-test.sh security  # Run security tests only
```

## Manual Testing Procedures

### Admin Panel Testing

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Open your browser to [http://localhost:5173](http://localhost:5173)

3. Test the following features:
   - User Authentication (login/signup)
   - API Key Management
   - Available Models Display
   - Logs Viewing
   - Insights Display
   - SDK Integration Page

### SDK Embedding Testing

1. Build the SDK:
   ```bash
   cd packages/insight-sdk
   pnpm build
   ```

2. Test the SDK embedding using the test HTML file:
   ```bash
   open test-embed.html
   ```

3. Verify that insights are properly rendered in the embedded context.

## Test Data Generation

The system includes scripts for generating test data:

```bash
node scripts/setup-test-data.js
```

This will populate the database with test partners, API keys, models, logs, and insights for testing purposes.

## Continuous Integration Testing

The project includes GitHub Actions workflows for automated testing:

1. `.github/workflows/ci-cd.yml` - Runs tests on push and pull requests
2. `.github/workflows/security-scan.yml` - Runs security scanning weekly

## Test Coverage

To generate a test coverage report:

```bash
pnpm test:coverage
```

The report will be available in the `coverage` directory.

## Troubleshooting Common Issues

### Supabase Local Development Issues

If Supabase fails to start:

```bash
# Stop any running instances
supabase stop

# Reset local database
supabase db reset

# Start again
supabase start
```

### Test Database Issues

If tests fail due to missing tables or data:

```bash
# Recreate test data
node scripts/setup-test-data.js
```

### SDK Integration Issues

If SDK integration tests fail:

```bash
# Clean build artifacts
cd packages/insight-sdk
rm -rf dist
pnpm build
```

## Next Steps After Testing

Once all tests pass successfully, you can proceed with:

1. Review the pilot deployment plan (`docs/pilot-deployment-plan.md`)
2. Create partner accounts (`scripts/create-partner-account.js`)
3. Deploy to production (`scripts/deploy-to-production.js`)
4. Monitor the deployment (`monitoring/docker-compose.yml`)

## Support

If you encounter any issues during testing, please contact the development team. 