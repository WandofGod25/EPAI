#!/bin/bash

# EPAI Platform Testing and Simulation Script
# This script runs a complete testing simulation of the EPAI platform

# Terminal colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}   $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info messages
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI not found. Please install it first."
    echo "Follow instructions at: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm not found. Please install it first."
    echo "Follow instructions at: https://pnpm.io/installation"
    exit 1
fi

# 1. Environment Setup
print_header "1. Setting Up Test Environment"

# Create local environment variables
print_info "Setting up environment variables..."
if [ ! -f .env ]; then
    cp scripts/test.env .env
    print_success "Created .env file from test.env"
else
    print_info ".env file already exists"
fi

# Load environment variables
source .env
export SUPABASE_URL
export SUPABASE_SERVICE_ROLE_KEY
export SUPABASE_ANON_KEY
export TEST_API_KEY
export TEST_EMAIL
export TEST_PASSWORD
export NODE_ENV=test

print_success "Environment variables loaded"

# 2. Start Supabase Local Development
print_header "2. Starting Supabase Local Development"

print_info "Starting Supabase local development..."
supabase start

# Check if Supabase started successfully
if [ $? -ne 0 ]; then
    print_error "Failed to start Supabase"
    exit 1
fi

print_success "Supabase started successfully"

# 3. Install Dependencies
print_header "3. Installing Dependencies"

print_info "Installing project dependencies..."
pnpm install
print_success "Dependencies installed"

# 4. Prepare Test Database
print_header "4. Preparing Test Database"

print_info "Setting up test database..."
node scripts/setup-test-data.js
print_success "Test database setup complete"

# 5. Run Unit Tests
print_header "5. Running Unit Tests"

print_info "Running unit tests..."
node scripts/test-runner.js unit
print_success "Unit tests complete"

# 6. Run Integration Tests
print_header "6. Running Integration Tests"

print_info "Running integration tests..."
node scripts/test-runner.js integration
print_success "Integration tests complete"

# 7. Run Component Tests
print_header "7. Running Component Tests"

print_info "Running component tests..."
node scripts/test-runner.js component
print_success "Component tests complete"

# 8. Run End-to-End Tests
print_header "8. Running End-to-End Tests"

print_info "Running E2E API tests..."
node scripts/run-e2e-tests.js
print_success "E2E API tests complete"

# 9. Run SDK Integration Tests
print_header "9. Running SDK Integration Tests"

print_info "Running SDK integration tests..."
node scripts/run-sdk-integration-tests.js
print_success "SDK integration tests complete"

# 10. Run Security Tests
print_header "10. Running Security Tests"

print_info "Running security tests..."
node scripts/enhanced-security-test.js
print_success "Security tests complete"

# 11. Test User Flows
print_header "11. Testing User Flows"

print_info "Running user flow tests..."
node scripts/test-user-flows.js
print_success "User flow tests complete"

# 12. Run Load Tests
print_header "12. Running Load Tests"

print_info "Running load tests..."
node scripts/run-load-tests.js --light
print_success "Load tests complete"

# 13. Build for Production
print_header "13. Building for Production"

print_info "Building admin panel and SDK for production..."
NODE_ENV=production pnpm build
print_success "Production build complete"

# 14. Test Deployment Simulation
print_header "14. Testing Deployment Simulation"

print_info "Simulating deployment (dry run)..."
node scripts/deploy-to-production.js --dry-run
print_success "Deployment simulation complete"

# 15. Summary
print_header "15. Test and Simulation Summary"

print_info "All testing and simulation steps completed"
print_info "Check test results in the test-results directory"

print_header "Next Steps"
echo "1. Review the test results and address any failures"
echo "2. Run specific tests again for any failures"
echo "3. When ready for pilot deployment, follow the steps in docs/pilot-deployment-plan.md"

# Clean up
print_info "Cleaning up test environment..."
# Uncomment the line below to stop Supabase after testing
# supabase stop
print_success "Clean up complete"

print_header "EPAI Platform Testing and Simulation Complete" 