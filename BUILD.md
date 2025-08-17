# Build Instructions

This document provides instructions for building and developing the Samsara Bus TypeScript library.

## Prerequisites

- Node.js 18+ 
- npm 8+

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Samsara-Stream/samsara-bus-ts.git
   cd samsara-bus-ts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install package dependencies**
   ```bash
   cd packages/samsara-bus-ts
   npm install
   ```

## Build Commands

### Building All Packages

From the root directory:

```bash
npm run build
```

### Building Individual Packages

```bash
cd packages/samsara-bus-ts
npm run build
```

## Development Commands

### Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific package
cd packages/samsara-bus-ts
npm test

# Run tests in watch mode
npm run test:watch
```

### Development Mode (Watch)

```bash
cd packages/samsara-bus-ts
npm run dev
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

### Running Examples

```bash
cd packages/samsara-bus-ts

# Check examples for TypeScript errors
npm run check-examples

# Run all examples
npm run run-examples

# Run individual examples
npm run run-basic-example
npm run run-request-response-example

# Or run directly with ts-node
npx ts-node examples/samsara-bus-example.ts
npx ts-node examples/request-response-example.ts
```

## Project Structure

```
samsara-bus-ts/
├── packages/
│   └── samsara-bus-ts/           # Core message bus package
│       ├── src/                  # Source code
│       │   ├── __tests__/        # Test files
│       │   ├── models/           # Data models
│       │   ├── samsara-bus.ts    # Abstract interface
│       │   ├── default-samsara-bus.ts
│       │   ├── global-samsara-bus.ts
│       │   ├── topic.ts          # Topic implementation
│       │   └── index.ts          # Main export
│       ├── examples/             # Usage examples
│       ├── dist/                 # Compiled output
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── package.json                  # Root package.json
├── tsconfig.json                 # TypeScript configuration
├── jest.config.js                # Jest configuration
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc.js                # Prettier configuration
└── README.md
```

## Development Workflow

1. **Make changes** to source files in `packages/samsara-bus-ts/src/`
2. **Run tests** to ensure everything works: `npm test`
3. **Build the project** to check for compilation errors: `npm run build`
4. **Run examples** to verify functionality works as expected
5. **Format code** before committing: `npm run format`
6. **Lint code** to catch potential issues: `npm run lint`

## Testing Strategy

- **Unit tests** for all core functionality
- **Integration tests** for complex interactions
- **Example verification** to ensure real-world usage works
- **Code coverage** tracking with Jest

## Build Output

The build process generates:

- **JavaScript files** in `dist/` directory
- **Type declaration files** (`.d.ts`) for TypeScript consumers
- **Source maps** for debugging
- **Declaration maps** for IDE support

## Troubleshooting

### Common Issues

1. **TypeScript compilation errors**
   - Check `tsconfig.json` configuration
   - Ensure all dependencies are installed
   - Run `npm run clean && npm run build`

2. **Test failures**
   - Check Jest configuration in `jest.config.js`
   - Ensure test environment is properly set up
   - Run tests individually to isolate issues

3. **Import/export issues**
   - Verify `index.ts` exports all necessary components
   - Check package.json `main` and `types` fields
   - Ensure proper module resolution

### Clean Build

To perform a clean build:

```bash
# Clean all build artifacts
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild everything
npm run build
```

## Publishing

Before publishing:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite: `npm test`
4. Build successfully: `npm run build`
5. Verify examples work: run all examples

## Future Packages

This monorepo is structured to support additional packages:

- **samsara-bus-exchange-ts**: Request-response patterns with decorators
- **samsara-bus-generator-ts**: Code generation tools
- **Additional utility packages**: As needed

Each package will follow the same build patterns and development workflow.
