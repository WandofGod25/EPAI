# Embedded Predictive Analytics Integrator (EPAI)

EPAI is a platform that enables businesses to embed AI-powered predictive analytics into their applications with minimal effort.

## Features

- **Easy Integration**: Add predictive insights to your application with just a few lines of code
- **Flexible Data Ingestion**: Support for various event types to feed your predictive models
- **Beautiful UI Components**: Pre-built components that seamlessly blend into your application
- **Comprehensive Admin Panel**: Manage API keys, view logs, and monitor usage statistics
- **Secure by Design**: Built with security best practices from the ground up

## Project Structure

This project is organized as a monorepo using pnpm workspaces:

- `packages/admin-panel`: React application for the partner admin panel
- `packages/insight-sdk`: SDK for embedding insights into partner applications
- `supabase/functions`: Edge Functions for the backend API
- `supabase/migrations`: Database migrations for the Supabase PostgreSQL database
- `docs`: Documentation for the platform
- `scripts`: Utility scripts for development and deployment

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase CLI
- Docker (for local Supabase development)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/epai.git
cd epai
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the local Supabase instance:

```bash
supabase start
```

4. Set up environment variables:

```bash
cp packages/admin-panel/.env.example packages/admin-panel/.env
# Edit the .env file with your local Supabase credentials
```

5. Start the development server:

```bash
pnpm dev
```

## Development

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @epai/admin-panel test
```

### Building for Production

```bash
# Build all packages
pnpm build

# Build a specific package
pnpm --filter @epai/admin-panel build
```

### Deploying Edge Functions

```bash
cd supabase
supabase functions deploy
```

## Documentation

- [API Documentation](./supabase/openapi.yaml): OpenAPI specification for the API
- [Integration Guide](./docs/integration-guide.md): Guide for integrating EPAI into your application
- [Contributing](./CONTRIBUTING.md): Guidelines for contributing to the project

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 