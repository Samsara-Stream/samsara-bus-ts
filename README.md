# Samsara Bus TypeScript

A comprehensive RxJS-based message/event bus ecosystem for TypeScript applications, providing type-safe communication patterns, exchange mechanisms, and code generation tools.

## Overview

Samsara Bus TypeScript is a monorepo containing a suite of packages that work together to provide a powerful, flexible, and type-safe messaging system for TypeScript applications. Built on top of RxJS, it enables decoupled communication between different parts of your application through various patterns including publish-subscribe, request-response, and more.

## Packages

This monorepo contains packages equivalent to the Dart version:

### 📦 [samsara-bus-ts](./packages/samsara-bus-ts/)

The core message bus implementation that provides:

- **Type-safe Topics**: Register topics with specific message types and stream behaviors
- **Flexible Stream Types**: Choose between Subject, BehaviorSubject, or ReplaySubject
- **Topic Connections**: Connect topics with transformation functions
- **Stream Injection**: Inject external streams into topics
- **Message Correlation**: Track related messages across different topics
- **Global & Local Bus Options**: Use singleton or local instances as needed

### ⚛️ [samsara-bus-react](./packages/samsara-bus-react/)

React integration for the core bus, providing:

- **SamsaraBusProvider**: Context provider to share a bus across components
- **useSamsaraTopic**: Hook to subscribe/emit to a topic as React state
- **useSamsaraTopology**: Hook to build RxJS processing pipelines as state
- **Vite examples**: Chat and Dashboard apps under `packages/samsara-bus-react/examples`

## Getting Started

For detailed usage instructions, see the individual package READMEs. Here's a quick overview:

1. **Basic messaging**: Start with `samsara-bus-ts` for publish-subscribe patterns
2. **Request-response**: Add `samsara-bus-exchange-ts` for RPC-style communication
3. **Code generation**: Use `samsara-bus-generator-ts` to eliminate boilerplate

## Use Cases

Samsara Bus TypeScript is particularly useful for:

- **Decoupling components** in complex applications
- **Event-driven architectures**
- **Reactive programming patterns**
- **Cross-component communication**
- **Message transformation and correlation**
- **Microservice-style communication** within monoliths
- **Plugin architectures** with type-safe interfaces

## Contributing

### Development Workflow

This project uses npm workspaces for monorepo management:

```bash
# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Run tests for all packages
npm run test

# Lint all packages
npm run lint

# Format code
npm run format
```

#### Code Quality Checks

The project uses ESLint and Prettier for code quality:

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

### Getting Help

- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Join conversations in GitHub Discussions
- **Documentation**: Check individual package READMEs for detailed API documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built on top of [RxJS](https://rxjs.dev/) for reactive programming support
- Inspired by the [Samsara Bus Dart](https://github.com/Samsara-Stream/samsara-bus-dart) library
- Uses npm workspaces for monorepo management
