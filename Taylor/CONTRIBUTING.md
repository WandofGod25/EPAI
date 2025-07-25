# Contributing to EPAI

Thank you for considering contributing to EPAI! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

- **Check if the bug has already been reported** by searching on GitHub under [Issues](https://github.com/yourusername/epai/issues).
- If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/yourusername/epai/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

- **Check if the enhancement has already been suggested** by searching on GitHub under [Issues](https://github.com/yourusername/epai/issues).
- If you're unable to find an open issue for your enhancement, [open a new one](https://github.com/yourusername/epai/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **mockup** if applicable.

### Pull Requests

1. **Fork the repository** and create your branch from `main`.
2. **Install dependencies** using `pnpm install`.
3. **Make your changes** and add tests if applicable.
4. **Run tests** to ensure they pass.
5. **Update documentation** if necessary.
6. **Submit a pull request** with a clear description of the changes.

## Development Workflow

### Setting Up Development Environment

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

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @epai/admin-panel test
```

### Code Style

- We use ESLint and Prettier for code style and formatting.
- Run `pnpm lint` to check for linting issues.
- Run `pnpm format` to automatically format code.

## Project Structure

- `packages/admin-panel`: React application for the partner admin panel
- `packages/insight-sdk`: SDK for embedding insights into partner applications
- `supabase/functions`: Edge Functions for the backend API
- `supabase/migrations`: Database migrations for the Supabase PostgreSQL database
- `docs`: Documentation for the platform
- `scripts`: Utility scripts for development and deployment

## Adding New Features

1. **Discuss first**: Open an issue to discuss the feature before implementing it.
2. **Follow the architecture**: Make sure your implementation follows the project's architecture.
3. **Add tests**: Write tests for your feature.
4. **Update documentation**: Update the documentation to reflect your changes.

## Database Changes

1. Create a new migration file in `supabase/migrations`.
2. Test the migration locally.
3. Document the changes in the migration file.

## Edge Functions

1. Create a new Edge Function in `supabase/functions`.
2. Follow the existing patterns for error handling, authentication, and CORS.
3. Add tests for the new function.

## Releasing

1. Update the version number in the relevant `package.json` files.
2. Update the CHANGELOG.md file.
3. Create a new release on GitHub.

## Questions?

If you have any questions, please feel free to open an issue or contact the maintainers. 