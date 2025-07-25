#!/bin/bash

# EPAI Platform Specific Test Runner
# This script allows running specific tests of the EPAI platform

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

# Help function
show_help() {
    echo "Usage: $0 [options] [test-name]"
    echo
    echo "Options:"
    echo "  -h, --help        Show this help message"
    echo
    echo "Available tests:"
    echo "  setup             Setup test environment"
    echo "  unit              Run unit tests"
    echo "  integration       Run integration tests"
    echo "  component         Run component tests"
    echo "  e2e               Run end-to-end API tests"
    echo "  sdk               Run SDK integration tests"
    echo "  security          Run security tests"
    echo "  userflows         Run user flow tests"
    echo "  load              Run load tests"
    echo "  build             Build for production"
    echo "  deploy-simulation Run deployment simulation"
    echo "  all               Run all tests"
    echo
    echo "Example:"
    echo "  $0 unit          Run unit tests"
    echo "  $0 security      Run security tests"
    echo "  $0 all           Run all tests"
}

# Setup test environment
setup_environment() {
    print_header "Setting Up Test Environment"

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

    # Start Supabase if not already running
    print_info "Starting Supabase local development..."
    
    if supabase status | grep -q "not running"; then
        supabase start
        if [ $? -ne 0 ]; then
            print_error "Failed to start Supabase"
            exit 1
        fi
    else
        print_info "Supabase is already running"
    fi
    
    print_success "Supabase is up and running"

    # Install dependencies
    print_info "Installing project dependencies..."
    pnpm install
    print_success "Dependencies installed"

    # Setup test data
    print_info "Setting up test database..."
    node scripts/setup-test-data.js
    print_success "Test database setup complete"
}

# Run tests based on type
run_test() {
    local test_type=$1
    
    case $test_type in
        unit)
            print_header "Running Unit Tests"
            node scripts/test-runner.js unit
            ;;
        integration)
            print_header "Running Integration Tests"
            node scripts/test-runner.js integration
            ;;
        component)
            print_header "Running Component Tests"
            node scripts/test-runner.js component
            ;;
        e2e)
            print_header "Running End-to-End API Tests"
            node scripts/run-e2e-tests.js
            ;;
        sdk)
            print_header "Running SDK Integration Tests"
            node scripts/run-sdk-integration-tests.js
            ;;
        security)
            print_header "Running Security Tests"
            node scripts/enhanced-security-test.js
            ;;
        userflows)
            print_header "Running User Flow Tests"
            node scripts/test-user-flows.js
            ;;
        load)
            print_header "Running Load Tests"
            node scripts/run-load-tests.js --light
            ;;
        build)
            print_header "Building for Production"
            NODE_ENV=production pnpm build
            ;;
        deploy-simulation)
            print_header "Testing Deployment Simulation"
            node scripts/deploy-to-production.js --dry-run
            ;;
        all)
            run_test unit
            run_test integration
            run_test component
            run_test e2e
            run_test sdk
            run_test security
            run_test userflows
            run_test load
            run_test build
            run_test deploy-simulation
            ;;
        *)
            print_error "Unknown test type: $test_type"
            show_help
            exit 1
            ;;
    esac
}

# Check command line arguments
if [ $# -eq 0 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Check if the test type is valid
test_type=$1
valid_types=("setup" "unit" "integration" "component" "e2e" "sdk" "security" "userflows" "load" "build" "deploy-simulation" "all")
valid=0

for type in "${valid_types[@]}"; do
    if [ "$test_type" = "$type" ]; then
        valid=1
        break
    fi
done

if [ $valid -eq 0 ]; then
    print_error "Invalid test type: $test_type"
    show_help
    exit 1
fi

# Always setup environment for "all" or if explicitly requested
if [ "$test_type" = "setup" ] || [ "$test_type" = "all" ]; then
    setup_environment
fi

# If test type is just "setup", exit after setup
if [ "$test_type" = "setup" ]; then
    print_header "Test Environment Setup Complete"
    exit 0
fi

# Run the specified test if not just setting up
if [ "$test_type" != "setup" ]; then
    # For all other test types, ensure environment is set up
    if [ "$test_type" != "all" ]; then
        source .env 2>/dev/null
        export SUPABASE_URL
        export SUPABASE_SERVICE_ROLE_KEY
        export SUPABASE_ANON_KEY
        export TEST_API_KEY
        export TEST_EMAIL
        export TEST_PASSWORD
        export NODE_ENV=test
    fi
    
    run_test $test_type
fi

print_header "Test Run Complete" 