# Samsara Bus React

React hooks for samsara-bus-ts with a fluent, TypeScript-first API for defining stream processing topologies.

## Installation

```bash
npm install samsara-bus-react
```

## Prerequisites

- React >=16.8.0 (for hooks support)
- samsara-bus-ts ^1.0.0
- rxjs ^7.8.0

## Quick Start

### Basic Setup

```typescript
import React from 'react';
import { DefaultSamsaraBus, TopicType } from 'samsara-bus-ts';
import { SamsaraBusProvider } from 'samsara-bus-react';

const bus = new DefaultSamsaraBus();
bus.registerTopic<{ count: number }>('counter', TopicType.BehaviorSubject);

function App() {
  return (
    <SamsaraBusProvider bus={bus}>
      <CounterComponent />
    </SamsaraBusProvider>
  );
}
```

### Simple Topic Usage

```typescript
import { useSamsaraTopic } from 'samsara-bus-react';

function CounterComponent() {
  const [counter, emitCounter] = useSamsaraTopic<{ count: number }>('counter', {
    initialValue: { count: 0 }
  });

  return (
    <div>
      <p>Count: {counter?.count || 0}</p>
      <button onClick={() => emitCounter({ count: (counter?.count || 0) + 1 })}>
        Increment
      </button>
    </div>
  );
}
```

## Fluent Topology API

The fluent API provides a TypeScript-first way to define stream processing topologies with better type safety, reusability, and maintainability.

### 1. Define Pure Processors

Create reusable, type-safe processors:

```typescript
import { defineProcessor } from 'samsara-bus-react';

// Filter messages by room
const roomMessages = defineProcessor({
  id: 'roomMessages',
  inputs: ['messages'] as const,
  fn: (msg: ChatMessage, params: { roomId: string }) =>
    msg.room === params.roomId ? msg : defineProcessor.SKIP
});

// Enrich messages with user status
const enrichMessages = defineProcessor({
  id: 'enrichMessages',
  inputs: ['roomMessages', 'userStatus', 'currentRoom'] as const,
  combiner: 'withLatestFrom',
  fn: (message: ChatMessage, user: UserStatus, room: ChatRoom) => ({
    message,
    isUserOnline: user?.user === message.user && user?.online,
    userCount: room?.participants?.length ?? 0
  })
});
```

**Key Features:**
- **Typed inputs/outputs** - No `any` types
- **Optional `combiner`** at the processor level (`combineLatest`, `withLatestFrom`, `zip`, `merge`, or custom function)
- **Access to params** for graph parameterization
- **`SKIP` sentinel** to express typed filters without RxJS boilerplate

### 2. Build Topologies with Fluent API

```typescript
import { topology } from 'samsara-bus-react';

const ChatRoomEnriched = topology('ChatRoomEnriched')
  .param('roomId', (t) => t.string())          // Typed parameters
  .topic('messages', 'chat-messages')          // Topic bindings
  .topic('userStatus', 'user-status')
  .topic('rooms', 'chat-rooms')
  .proc(roomMessages)                          // Add processors
  .proc(currentRoom)
  .proc(enrichMessages)
  .output('enrichMessages')                    // Specify output
  .build();
```

**Key Features:**
- **Typed parameters** with validation
- **Topic binding** with string topic names
- **Processor composition** using defined processors
- **Explicit output** specification

### 3. Use in React Components

```typescript
import { useSamsaraTopology } from 'samsara-bus-react';

function ChatRoomComponent({ roomId }: { roomId: string }) {
  const { data, error, status } = useSamsaraTopology<EnrichedMessage>(
    ChatRoomEnriched, 
    { roomId }
  );

  if (status === 'loading') return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data yet...</div>;

  return (
    <div>
      <h3>Room: {roomId}</h3>
      <p>Users: {data.userCount}</p>
      <p>User {data.message.user} is {data.isUserOnline ? 'online' : 'offline'}</p>
      <p>Message: {data.message.text}</p>
    </div>
  );
}
```

**Key Features:**
- **Fully typed** data, error, and status
- **Parameter injection** is explicit and type-safe
- **Status tracking** with loading/success/error states

## Advanced Features

### RxJS Operators Support

You can still use RxJS operators directly when needed:

```typescript
import { map, filter, debounceTime } from 'rxjs/operators';

const debouncedMessages = defineProcessor({
  id: 'debouncedMessages',
  inputs: ['messages'] as const,
  fn: (messageStream) => 
    messageStream.pipe(
      filter((msg: ChatMessage) => msg.text.length > 0),
      debounceTime(300),
      map((msg: ChatMessage) => ({ ...msg, processed: true }))
    )
});
```

### Parameter Types

The fluent builder supports typed parameters with validation:

```typescript
const MyTopology = topology('MyTopology')
  .param('userId', (t) => t.string())
  .param('maxItems', (t) => t.number())
  .param('config', (t) => t.object<{ feature: boolean }>())
  .param('tags', (t) => t.array<string>())
  // ... rest of topology
  .build();
```

### Stream Combiners

Specify how multiple inputs are combined:

- `'combineLatest'` (default) - Emits when any input changes
- `'withLatestFrom'` - Emits when first input changes, with latest from others
- `'zip'` - Emits when all inputs have new values
- `'merge'` - Emits from any input stream
- Custom function: `(inputs: Observable<any>[]) => Observable<any>`

## API Reference

### Core Functions

#### `defineProcessor(options)`
Creates a reusable processor definition.

**Options:**
- `id: string` - Unique processor identifier
- `inputs: readonly string[]` - Array of input node IDs
- `combiner?: TopologyCombiner` - How to combine multiple inputs
- `fn: (...args) => result | SKIP` - Processing function

#### `topology(name)`
Creates a new topology builder.

**Methods:**
- `.param(name, validator)` - Add typed parameter
- `.topic(name, topicName)` - Bind to bus topic
- `.proc(processor)` - Add processor
- `.output(nodeId)` - Set output node
- `.build()` - Create topology instance

#### `useSamsaraTopology(topology, params)`
React hook for consuming topologies.

**Returns:**
- `data: T | undefined` - Current topology output
- `error: Error | undefined` - Any processing errors
- `status: 'idle' | 'loading' | 'success' | 'error'` - Processing status

### Hooks

#### `useSamsaraTopic(topicName, options?)`
Connect React state to a bus topic.

**Returns:** `[data, emit]` tuple

#### `useSamsaraBus()`
Get the current bus instance from context.

## Examples

- **[Chat Example](./examples/chat/)** - Real-time chat with fluent topology API
- **[React Example](./examples/react-example.tsx)** - Basic usage patterns  
- **[Advanced Usage](./examples/advanced-usage.tsx)** - Complex stream processing scenarios
- **[Dashboard Example](./examples/dashboard/)** - Real-time dashboard

## Running Examples

To run the chat example:

```bash
cd packages/samsara-bus-react/examples/chat
npm install
npm run dev
```

## Best Practices

1. **Topic Registration**: Register topics in your bus before using them in components
2. **Error Handling**: The hooks provide error states, consider implementing error boundaries
3. **Performance**: Topology definitions are memoized automatically
4. **Type Safety**: Always provide TypeScript types for your data
5. **Processor Reusability**: Design processors to be pure and reusable across topologies
6. **Parameter Validation**: Use the built-in type validators for robust parameter checking

## Benefits

- ✅ **Type Safety** - Full TypeScript support with no `any` types
- ✅ **Reusability** - Processors can be reused across different topologies
- ✅ **Composability** - Build complex topologies from simple, testable pieces
- ✅ **Maintainability** - Clear separation between pure processing logic and topology structure
- ✅ **Developer Experience** - Fluent API with autocomplete and type checking
- ✅ **Performance** - Built-in memoization and efficient stream management

## Migration from Legacy API

If you're using the old object literal API, it's deprecated but still works. We recommend migrating to the new fluent API for better type safety and developer experience.

### Before
```typescript
const topology = {
  nodes: {
    'messages': { type: 'topic', topicName: 'chat-messages' },
    'processor': {
      type: 'processor',
      inputs: ['messages'],
      processor: (stream) => stream.pipe(filter(msg => msg.room === 'general'))
    }
  },
  output: 'processor'
};

const data = useSamsaraTopology(topology);
```

### After
```typescript
const roomMessages = defineProcessor({
  id: 'roomMessages',
  inputs: ['messages'] as const,
  fn: (msg: ChatMessage, params: { roomId: string }) =>
    msg.room === params.roomId ? msg : defineProcessor.SKIP
});

const ChatTopology = topology('ChatTopology')
  .param('roomId', (t) => t.string())
  .topic('messages', 'chat-messages')
  .proc(roomMessages)
  .output('roomMessages')
  .build();

const { data, error, status } = useSamsaraTopology(ChatTopology, { roomId: 'general' });
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to the main repository.

## License

MIT

## New Fluent Topology API 🎉

The new fluent API provides a TypeScript-first way to define stream processing topologies with better type safety, reusability, and maintainability.

### 1. Define Pure Processors

Create reusable, type-safe processors:

```typescript
import { defineProcessor } from 'samsara-bus-react';

// Filter messages by room
const roomMessages = defineProcessor({
  id: 'roomMessages',
  inputs: ['messages'] as const,
  fn: (msg: ChatMessage, params: { roomId: string }) =>
    msg.room === params.roomId ? msg : defineProcessor.SKIP
});

// Enrich messages with user status
const enrichMessages = defineProcessor({
  id: 'enrichMessages',
  inputs: ['roomMessages', 'userStatus', 'currentRoom'] as const,
  combiner: 'withLatestFrom',
  fn: (message: ChatMessage, user: UserStatus, room: ChatRoom) => ({
    message,
    isUserOnline: user?.user === message.user && user?.online,
    userCount: room?.participants?.length ?? 0
  })
});
```

### 2. Build Topologies with Fluent API

```typescript
import { topology } from 'samsara-bus-react';

const ChatRoomEnriched = topology('ChatRoomEnriched')
  .param('roomId', (t) => t.string())          // Typed parameters
  .topic('messages', 'chat-messages')          // Topic bindings
  .topic('userStatus', 'user-status')
  .topic('rooms', 'chat-rooms')
  .proc(roomMessages)                          // Add processors
  .proc(currentRoom)
  .proc(enrichMessages)
  .output('enrichMessages')                    // Specify output
  .build();
```

### 3. Use in React Components

```typescript
import { useTopology } from 'samsara-bus-react';

function ChatRoomComponent({ roomId }: { roomId: string }) {
  const { data, error, status } = useTopology<EnrichedMessage>(
    ChatRoomEnriched, 
    { roomId }
  );

  if (status === 'loading') return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Room: {roomId}</h3>
      <p>Users: {data?.userCount}</p>
      <p>{data?.message.user}: {data?.message.text}</p>
    </div>
  );
}
```

### Key Benefits

- ✅ **Type Safety** - Full TypeScript support, no `any` types
- ✅ **Reusability** - Processors can be reused across topologies
- ✅ **Composability** - Build complex topologies from simple pieces
- ✅ **Parameter Injection** - Type-safe parameterization
- ✅ **Better DX** - Autocomplete, type checking, refactoring support

### Advanced Features

#### RxJS Operators Support
```typescript
import { map, filter, debounceTime } from 'rxjs/operators';

const debouncedMessages = defineProcessor({
  id: 'debouncedMessages',
  inputs: ['messages'] as const,
  fn: (messageStream) => 
    messageStream.pipe(
      filter((msg: ChatMessage) => msg.text.length > 0),
      debounceTime(300),
      map((msg: ChatMessage) => ({ ...msg, processed: true }))
    )
});
```

#### Stream Combiners
- `'combineLatest'` (default) - Emits when any input changes
- `'withLatestFrom'` - Emits when first input changes
- `'zip'` - Emits when all inputs have new values  
- `'merge'` - Emits from any input stream
- Custom function: `(inputs: Observable<any>[]) => Observable<any>`

## Legacy API

### Using Stream Processing with `useSamsaraTopology`

The original object-literal API is still supported:

```typescript
import React from 'react';
import { useSamsaraTopology } from 'samsara-bus-react';
import { map } from 'rxjs/operators';

function DashboardComponent() {
  const result = useSamsaraTopology({
    nodes: {
      'userTopic': {
        type: 'topic',
        topicName: 'user-events'
      },
      'processor1': {
        type: 'processor',
        id: 'combineUserMetrics',
        inputs: ['userTopic'],
        processor: (stream) => stream.pipe(
          map((userEvent) => ({
            user: userEvent,
            timestamp: new Date()
          }))
        )
      }
    },
    output: 'processor1'
  });

  return <div>{JSON.stringify(result)}</div>;
}
```
      }
    },
    output: 'processor1'
  }, { initialValue: null });

  return (
    <div>
      <h2>Dashboard</h2>
      {result && (
        <div>
          <p>User: {JSON.stringify(result.user)}</p>
          <p>Metrics: {JSON.stringify(result.metrics)}</p>
          <p>Updated: {result.timestamp}</p>
        </div>
      )}
    </div>
  );
}
```

## API Reference

### `useSamsaraTopic<T>(topicName: string, options?: UseSamsaraTopicOptions)`

Connects a React state to a message bus topic.

**Parameters:**
- `topicName`: The name of the topic to subscribe to
- `options`: Optional configuration
  - `initialValue`: Initial state value
  - `emitInitialValue`: Whether to emit the initial value (default: false)

**Returns:**
- `[state, emit]`: A tuple containing the current state and an emit function

### `useSamsaraTopology<T>(topology: TopologyDefinition, options?: UseSamsaraTopologyOptions)`

Processes multiple topics through a stream processing pipeline.

**Parameters:**
- `topology`: The topology definition describing the processing pipeline
- `options`: Optional configuration
  - `initialValue`: Initial state value

**Returns:**
- The current processed result

### Combining multiple inputs (custom combiner)

When a processor node has multiple `inputs`, inputs are combined using RxJS. The default combiner is `combineLatest`.

You can customize this per processor with the optional `combiner` field:

- `'combineLatest'` (default)
- `'zip'`
- `'merge'`
- `'withLatestFrom'` (emit on first input, pair with latest of others)
- custom function `(inputs: Observable[]) => Observable`

Example (using `withLatestFrom`):

```ts
const topology = {
  nodes: {
    roomMessages: { type: 'topic', topicName: 'chat-messages' },
    userStatus: { type: 'topic', topicName: 'user-status' },
    currentRoom: { type: 'topic', topicName: 'chat-rooms' },
    enricher: {
      type: 'processor',
      id: 'enrichMessages',
      inputs: ['roomMessages', 'userStatus', 'currentRoom'],
      combiner: 'withLatestFrom',
      processor: (s$) => s$.pipe(
        map(([message, user, room]) => ({ message, user, room }))
      )
    }
  },
  output: 'enricher'
};
```

or to use a custom function:

```ts
// ...existing code...
import { combineLatest, debounceTime, map as rxMap, withLatestFrom as rxWithLatestFrom } from 'rxjs';
// ...existing code...
      'enricher': {
        type: 'processor',
        id: 'enrichMessages',
        inputs: ['roomMessages', 'userStatus', 'currentRoom'],
        combiner: (inputs$) => {
          const [msg$, user$, room$] = inputs$;
          return msg$.pipe(
            debounceTime(20),
            rxWithLatestFrom(user$, room$)
          );
        },
        processor: (s$) => s$.pipe(
          map(([message, userStatus, room]: [ChatMessage, UserStatus, ChatRoom]) => ({
            message,
            isUserOnline: userStatus?.user === message.user && userStatus?.online,
            userCount: room?.participants?.length || 0
          }))
        )
      }
// ...existing code...
```

### Topology Definition

A topology consists of nodes and defines the output:

```typescript
interface TopologyDefinition {
  nodes: Record<string, TopologyNode>;
  output: string; // ID of the output node
}

type TopologyNode = TopicSourceNode | StreamProcessorNode;

interface TopicSourceNode {
  type: 'topic';
  topicName: string;
}

interface StreamProcessorNode {
  type: 'processor';
  id: string;
  processor: (input: Observable) => Observable;
  inputs: string[]; // IDs of input nodes
}
```

## Examples

Two full Vite examples are included:

- Chat app: packages/samsara-bus-react/examples/chat
- Dashboard: packages/samsara-bus-react/examples/dashboard

Quick start for either example:

```bash
npm install
cd packages/samsara-bus-react/examples/<chat|dashboard>
npm run dev
```

Both examples alias the local packages for instant iteration without publishing.
The chat example demonstrates `withLatestFrom` as a custom combiner; the dashboard uses `zip`.

## Examples

- **[Fluent Chat Example](./examples/fluent-chat/)** - Real-time chat with the new fluent API
- **[React Example](./examples/react-example.tsx)** - Basic usage patterns  
- **[Advanced Usage](./examples/advanced-usage.tsx)** - Complex stream processing scenarios
- **[Chat Example](./examples/chat/)** - Legacy API chat application
- **[Dashboard Example](./examples/dashboard/)** - Real-time dashboard

## Documentation

- **[Fluent API Guide](./FLUENT_API.md)** - Comprehensive guide to the new TypeScript-first API
- **[Examples Directory](./examples/)** - Working code examples for all features

## Running Examples

To run the fluent chat example:

```bash
cd packages/samsara-bus-react/examples/fluent-chat
npm install
npm run dev
```

## Best Practices

1. **Topic Registration**: Make sure topics are registered in your bus before using them in components
2. **Error Handling**: The hooks automatically log errors, but consider implementing your own error boundaries
3. **Performance**: Use `useMemo` for complex topology definitions to prevent unnecessary re-computations
4. **Type Safety**: Always provide TypeScript types for your topic data
5. **Processor Reusability**: Design processors to be pure and reusable across different topologies
6. **Parameter Validation**: Use the built-in type validators for robust parameter checking

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to the main repository.

## License

MIT
