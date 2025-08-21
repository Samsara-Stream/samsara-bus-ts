# Chat Example

This example demonstrates the fluent topology API for `samsara-bus-react`.

## Features Demonstrated

- **Type-safe processor definitions** with `defineProcessor`
- **Fluent topology builder** with typed parameters
- **Real-time stream processing** with multiple combiners
- **Parameter injection** for reusable topologies
- **SKIP sentinel** for typed filtering
- **Status tracking** with loading/success/error states

## Key Components

### Processors
- `roomMessages` - Filters messages by room ID
- `currentRoom` - Finds the current room by ID  
- `enrichMessages` - Combines messages with user status and room info

### Topology
The `ChatRoomEnriched` topology demonstrates:
- Parameter definition with validation
- Topic binding to message bus
- Processor composition with `withLatestFrom` combiner
- Explicit output specification

### React Integration
The `useSamsaraTopology` hook provides:
- Typed data/error/status results
- Parameter validation
- Automatic subscription management

## Running the Example

```bash
cd examples/chat
npm install
npm run dev
```

The application will show two chat rooms with real-time message enrichment, demonstrating how the new fluent API provides better type safety and composability.
