# Samsara Bus TypeScript

A multi-topic RxJS-based message/event bus for TypeScript.

SamsaraBus is a powerful message bus implementation for TypeScript applications, built on top of RxJS. It enables decoupled communication between different parts of your application through typed topics, with support for transformation, correlation, and stream injection.

This package is part of the [Samsara Bus TypeScript monorepo](https://github.com/Samsara-Stream/samsara-bus-ts).

## Features

- **Type-safe Topics:** Register topics with specific message types and stream behaviors
- **Flexible Stream Types:** Choose between Subject, BehaviorSubject, or ReplaySubject for each topic
- **Topic Connections:** Connect topics with transformation functions
- **Stream Injection:** Inject external streams into topics
- **Message Correlation:** Track related messages across different topics
- **Type Enforcement:** Enforces message types at compile-time and runtime
- **Flexible Architecture:** Use `DefaultSamsaraBus` for local scopes or `GlobalSamsaraBus` singleton for application-wide messaging

## Getting Started

Add the package to your package.json:

```bash
npm install samsara-bus-ts rxjs
```

## Usage

### Architecture Options

SamsaraBus provides three ways to use the message bus:

1. **SamsaraBus Interface**: The abstract interface that defines all message bus operations
2. **DefaultSamsaraBus**: A concrete implementation for local scope usage
3. **GlobalSamsaraBus**: A singleton implementation for application-wide messaging

Choose the implementation that best fits your use case:

```typescript
import { DefaultSamsaraBus, GlobalSamsaraBus } from 'samsara-bus-ts';

// For local scope usage
const localBus = new DefaultSamsaraBus();

// For application-wide singleton usage
const globalBus = GlobalSamsaraBus.getInstance(); // Same instance throughout your app
```

### Creating a Bus and Registering Topics

```typescript
import { DefaultSamsaraBus, TopicType } from 'samsara-bus-ts';

async function main() {
  // Create the bus with DefaultSamsaraBus
  const bus = new DefaultSamsaraBus();
  
  // Register topics with different types
  bus.registerTopic<string>('stringTopic', TopicType.PublishSubject);
  bus.registerTopic<number>('numberTopic', TopicType.BehaviorSubject);
  bus.registerTopic<Record<string, unknown>>('jsonTopic', TopicType.ReplaySubject, 5);
}
```

### Using the Global Singleton

```typescript
import { GlobalSamsaraBus } from 'samsara-bus-ts';

function someFunction() {
  // Get the singleton instance
  const bus = GlobalSamsaraBus.getInstance();
  
  // Use it as you would a normal bus
  bus.emit<string>('globalTopic', 'This message is available app-wide');
}

function anotherFunction() {
  // Get the same singleton instance
  const bus = GlobalSamsaraBus.getInstance();
  
  // Listen to messages from anywhere in the app
  bus.getStream<string>('globalTopic').subscribe(message => {
    console.log('Received:', message);
  });
}
```

### Subscribing to Topics

```typescript
// Subscribe to a topic
const subscription = bus.getStream<string>('stringTopic').subscribe(
  message => {
    console.log('Message:', message);
  }
);

// Don't forget to unsubscribe when done
subscription.unsubscribe();
```

### Emitting Messages

```typescript
// Emit a message (returns auto-generated correlation ID)
const correlationId1 = bus.emit<string>('stringTopic', 'Hello, world!');

// Emit with custom correlation ID
const correlationId2 = bus.emit<string>('stringTopic', 'Custom message', 'my-correlation-id');
```

### Connecting Topics

```typescript
// Connect topics with transformation
bus.connectTopics<string, number>(
  'stringTopic',
  'numberTopic',
  message => message.length, // Map string to its length
);

// Now when you emit to stringTopic, it will also emit to numberTopic
bus.emit<string>('stringTopic', 'This will be converted to length 25');
```

### Injecting External Streams

```typescript
import { Subject } from 'rxjs';

// Create an external stream
const controller = new Subject<Date>();

// Inject it into a topic with transformation
bus.injectStream<Date, Record<string, unknown>>(
  'jsonTopic',
  controller.asObservable(),
  datetime => ({
    timestamp: datetime.toISOString(),
    type: 'timestamp'
  })
);

// Now when you emit to the controller, it emits to the topic
controller.next(new Date());
```

### Cleanup

```typescript
// Close the bus when done
await bus.close();
```

## Complete Example

See the [example](examples/samsara-bus-example.ts) for a complete demonstration of all features.

## Additional Information

SamsaraBus is designed to provide a flexible and type-safe way to implement the publish-subscribe pattern in TypeScript applications. It is particularly useful for:

- Decoupling components in complex applications
- Event-driven architectures
- Reactive programming patterns
- Cross-component communication
- Message transformation and correlation

For more details about RxJS, see the [RxJS documentation](https://rxjs.dev/).

## Contributing

### Preparation

Make sure you install dependencies and run the tests:

```bash
npm install
npm test
```

### Development Workflow

```bash
# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run in development mode
npm run dev
```

#### Code Quality Checks

The project uses ESLint and Prettier for code quality:

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

### Debugging Tips

- Use `npm run build` to compile TypeScript
- Use `npm run dev` for watch mode during development
- Check the `dist/` folder for compiled output
- Use `npm test` to run the complete test suite

### Getting Help

- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/Samsara-Stream/samsara-bus-ts/issues)
- **Discussions**: Join conversations in [GitHub Discussions](https://github.com/Samsara-Stream/samsara-bus-ts/discussions)
- **Documentation**: Check individual package READMEs for detailed API documentation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on top of [RxJS](https://rxjs.dev/) for reactive programming support
- Inspired by the [Samsara Bus Dart](https://github.com/Samsara-Stream/samsara-bus-dart) library
- Uses npm workspaces for monorepo management
