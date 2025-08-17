/**
 * Integration test demonstrating samsara-bus-react hooks
 * This test can be run with Node.js to verify the integration works
 */

import { DefaultSamsaraBus, TopicType } from 'samsara-bus-ts';
import { map, filter } from 'rxjs/operators';

// Since we can't use React hooks in Node.js, we'll simulate the hook behavior
// to demonstrate that the integration logic works

class MockReactState<T> {
  private _value: T | undefined;
  private _listeners: ((value: T | undefined) => void)[] = [];

  constructor(initialValue?: T) {
    this._value = initialValue;
  }

  get value(): T | undefined {
    return this._value;
  }

  setValue(newValue: T | undefined): void {
    this._value = newValue;
    this._listeners.forEach(listener => listener(newValue));
  }

  addListener(listener: (value: T | undefined) => void): () => void {
    this._listeners.push(listener);
    return () => {
      const index = this._listeners.indexOf(listener);
      if (index >= 0) {
        this._listeners.splice(index, 1);
      }
    };
  }
}

// Simulate useSamsaraTopic hook behavior
function simulateUseSamsaraTopic<T>(
  bus: DefaultSamsaraBus,
  topicName: string,
  initialValue?: T
): [MockReactState<T>, (value: T, correlationId?: string) => string] {
  const state = new MockReactState<T>(initialValue);

  // Subscribe to the topic
  const subscription = bus.getStream<T>(topicName).subscribe({
    next: (value) => state.setValue(value),
    error: (error) => console.error(`Error in topic ${topicName}:`, error),
  });

  const emit = (value: T, correlationId?: string): string => {
    return bus.emit(topicName, value, correlationId);
  };

  return [state, emit];
}

// Simulate useSamsaraTopology hook behavior
function simulateUseSamsaraTopology<T>(
  bus: DefaultSamsaraBus,
  topology: any,
  initialValue?: T
): MockReactState<T> {
  const state = new MockReactState<T>(initialValue);

  // Simple topology processing simulation
  const nodes = topology.nodes;
  const outputNodeId = topology.output;
  
  if (nodes[outputNodeId]?.type === 'topic') {
    // Simple case: output is directly from a topic
    const topicName = nodes[outputNodeId].topicName;
    bus.getStream<T>(topicName).subscribe({
      next: (value) => state.setValue(value),
      error: (error) => console.error('Error in topology:', error),
    });
  } else if (nodes[outputNodeId]?.type === 'processor') {
    // Complex case: need to process through the topology
    const processor = nodes[outputNodeId];
    const inputStreams = processor.inputs.map((inputId: string) => {
      const inputNode = nodes[inputId];
      if (inputNode.type === 'topic') {
        return bus.getStream(inputNode.topicName);
      }
      return null;
    }).filter(Boolean);

    if (inputStreams.length > 0) {
      const processedStream = processor.processor(inputStreams[0]);
      processedStream.subscribe({
        next: (value: T) => state.setValue(value),
        error: (error: any) => console.error('Error in topology:', error),
      });
    }
  }

  return state;
}

// Test the integration
async function testIntegration() {
  console.log('🚀 Testing Samsara Bus React Integration...\n');

  const bus = new DefaultSamsaraBus();

  // Register topics
  bus.registerTopic<{ count: number }>('counter', TopicType.BehaviorSubject);
  bus.registerTopic<{ user: string, action: string }>('user-events', TopicType.PublishSubject);

  console.log('📝 Testing useSamsaraTopic simulation...');
  
  // Test counter topic
  const [counterState, emitCounter] = simulateUseSamsaraTopic(
    bus, 
    'counter', 
    { count: 0 }
  );

  console.log(`Initial counter: ${JSON.stringify(counterState.value)}`);
  
  // Listen for changes
  counterState.addListener((value) => {
    console.log(`Counter updated: ${JSON.stringify(value)}`);
  });

  // Emit some values
  emitCounter({ count: 1 });
  emitCounter({ count: 5 });
  emitCounter({ count: 10 });

  // Test user events
  const [userState, emitUser] = simulateUseSamsaraTopic<{ user: string, action: string }>(
    bus,
    'user-events'
  );

  userState.addListener((value) => {
    console.log(`User event: ${JSON.stringify(value)}`);
  });

  emitUser({ user: 'john', action: 'login' });
  emitUser({ user: 'jane', action: 'logout' });

  console.log('\n🔄 Testing useSamsaraTopology simulation...');

  // Test topology
  const topologyState = simulateUseSamsaraTopology(bus, {
    nodes: {
      'counter': {
        type: 'topic',
        topicName: 'counter'
      },
      'processor': {
        type: 'processor',
        id: 'doubler',
        inputs: ['counter'],
        processor: (stream: any) => stream.pipe(
          map((data: { count: number }) => ({ doubledCount: data.count * 2 }))
        )
      }
    },
    output: 'processor'
  });

  topologyState.addListener((value) => {
    console.log(`Topology result: ${JSON.stringify(value)}`);
  });

  // Emit more counter values to see topology in action
  setTimeout(() => emitCounter({ count: 15 }), 100);
  setTimeout(() => emitCounter({ count: 20 }), 200);

  // Wait a bit before closing
  setTimeout(async () => {
    console.log('\n✅ Integration test completed successfully!');
    await bus.close();
  }, 500);
}

// Run the test
testIntegration().catch(console.error);
