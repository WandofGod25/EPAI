# EPAI Testing and Simulation Environment

This README provides an overview of the testing and simulation environment for the EPAI (Embedded Predictive Analytics Integrator) platform.

## Overview

The EPAI platform is ready for pilot deployment, with all planned features successfully implemented and comprehensive security enhancements in place. To ensure everything works as expected, we've created a robust testing and simulation environment.

## Testing Scripts

We've created two main scripts for testing the platform:

1. **Full Testing Suite (`run-simulation.sh`)**: Runs all tests in sequence to verify the entire system.
2. **Specific Test Runner (`run-specific-test.sh`)**: Allows running individual test types for targeted testing.

## Available Tests

The testing environment includes:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test the interaction between different parts of the system
- **Component Tests**: Test React components in the admin panel
- **End-to-End Tests**: Test complete API workflows from start to finish
- **SDK Integration Tests**: Test the SDK embedding in different frontend frameworks
- **Security Tests**: Verify security measures are working properly
- **User Flow Tests**: Test user journeys through the application
- **Load Tests**: Verify the system's performance under load
- **Build Tests**: Ensure the production build process works correctly
- **Deployment Simulation**: Simulate the deployment process without actually deploying

## Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Supabase CLI
- Docker

### Setting Up

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/epai.git
   cd epai
   ```

2. Set up the test environment:
   ```bash
   ./run-specific-test.sh setup
   ```

### Running Tests

Run all tests:
```bash
./run-simulation.sh
```

Or run specific tests:
```bash
./run-specific-test.sh unit       # Run unit tests
./run-specific-test.sh security   # Run security tests
```

## Test Results

Test results are saved in the `test-results` directory for review.

## Documentation

For detailed information on testing and simulation, refer to:
- [Testing and Simulation Guide](docs/testing-and-simulation-guide.md)
- [Pilot Deployment Plan](docs/pilot-deployment-plan.md)
- [Integration Guide](docs/integration-guide.md)

## Next Steps

After successful testing:

1. Review the [Pilot Deployment Plan](docs/pilot-deployment-plan.md)
2. Create partner accounts using `scripts/create-partner-account.js`
3. Deploy to production using `scripts/deploy-to-production.js`
4. Monitor the deployment using the monitoring stack

## Testing Status

| Test Type | Status | Notes |
|-----------|--------|-------|
| Unit Tests | Ready | Basic file helper tests available |
| Integration Tests | Ready | Tests for database interactions |
| Component Tests | Ready | Tests for React components |
| End-to-End Tests | Ready | Tests for API workflows |
| SDK Integration | Ready | Tests for SDK embedding |
| Security Tests | Ready | Enhanced security tests |
| User Flow Tests | Ready | Tests for user journeys |
| Load Tests | Ready | Tests for system performance |
| Build Tests | Ready | Tests for production build |
| Deployment Simulation | Ready | Simulates deployment process |

## Support

If you encounter any issues during testing, please contact the development team. 