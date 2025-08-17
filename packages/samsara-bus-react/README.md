# Samsara Bus React

React hooks for samsara-bus-ts - RxJS-based message/event bus integration.

## Installation

```bash
npm install samsara-bus-react
```

## Prerequisites

This package requires:
- React >=16.8.0 (for hooks support)
- samsara-bus-ts ^1.0.0
- rxjs ^7.8.0

## Usage

### 1. Setup the Provider

First, wrap your app with the `SamsaraBusProvider`:

```typescript
import React from 'react';
import { DefaultSamsaraBus } from 'samsara-bus-ts';
import { SamsaraBusProvider } from 'samsara-bus-react';

const bus = new DefaultSamsaraBus();

function App() {
  return (
    <SamsaraBusProvider bus={bus}>
      <YourComponents />
    </SamsaraBusProvider>
  );
}
```

### 2. Using Topics with `useSamsaraTopic`

The `useSamsaraTopic` hook connects a React state to a topic in the message bus:

```typescript
import React from 'react';
import { useSamsaraTopic } from 'samsara-bus-react';

interface CounterState {
  count: number;
}

function CounterComponent() {
  const [counter, emitCounter] = useSamsaraTopic<CounterState>('counter-topic', {
    initialValue: { count: 0 }
  });

  const increment = () => {
    emitCounter({ count: (counter?.count || 0) + 1 });
  };

  return (
    <div>
      <p>Count: {counter?.count || 0}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

### 3. Using Stream Processing with `useSamsaraTopology`

The `useSamsaraTopology` hook allows you to define complex stream processing pipelines:

```typescript
import React from 'react';
import { useSamsaraTopology } from 'samsara-bus-react';
import { map, combineLatest } from 'rxjs/operators';

function DashboardComponent() {
  const result = useSamsaraTopology({
    nodes: {
      'userTopic': {
        type: 'topic',
        topicName: 'user-events'
      },
      'metricsTopic': {
        type: 'topic', 
        topicName: 'metrics-events'
      },
      'processor1': {
        type: 'processor',
        id: 'combineUserMetrics',
        inputs: ['userTopic', 'metricsTopic'],
        processor: (combinedStream) => combinedStream.pipe(
          map(([userEvent, metricsEvent]) => ({
            user: userEvent,
            metrics: metricsEvent,
            timestamp: new Date()
          }))
        )
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

## Best Practices

1. **Topic Registration**: Make sure topics are registered in your bus before using them in components
2. **Error Handling**: The hooks automatically log errors, but consider implementing your own error boundaries
3. **Performance**: Use `useMemo` for complex topology definitions to prevent unnecessary re-computations
4. **Type Safety**: Always provide TypeScript types for your topic data

## License

MIT
