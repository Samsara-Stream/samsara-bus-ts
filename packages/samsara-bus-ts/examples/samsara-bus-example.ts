import { Subject } from 'rxjs';
import { DefaultSamsaraBus, GlobalSamsaraBus, TopicType } from '../src';

async function usingDefaultBus(): Promise<void> {
  // Create the bus as a DefaultSamsaraBus implementation
  const bus = new DefaultSamsaraBus();

  // Register topics with different types
  bus.registerTopic<string>('stringTopic', TopicType.PublishSubject);
  bus.registerTopic<number>('numberTopic', TopicType.BehaviorSubject);
  bus.registerTopic<Record<string, unknown>>('jsonTopic', TopicType.ReplaySubject, 5);

  // Subscribe to topics
  const stringSubscription = bus.getStream<string>('stringTopic').subscribe(
    message => console.log('String message:', message)
  );

  const numberSubscription = bus.getStream<number>('numberTopic').subscribe(
    message => console.log('Number message:', message)
  );

  const jsonSubscription = bus.getStream<Record<string, unknown>>('jsonTopic').subscribe(
    message => console.log('JSON message:', message)
  );

  // Emit messages to topics
  bus.emit<string>('stringTopic', 'Hello, world!');
  bus.emit<number>('numberTopic', 42);
  bus.emit<Record<string, unknown>>('jsonTopic', { name: 'Alice', age: 30 });

  // Connect topics with transformation
  bus.connectTopics<string, number>(
    'stringTopic',
    'numberTopic',
    message => message.length // Map string to its length
  );

  // Now when we emit to stringTopic, it will also emit to numberTopic
  const correlationId = new Date().toISOString();
  bus.emit<string>('stringTopic', 'This will be converted to length 25', correlationId);

  // Inject an external stream
  const controller = new Subject<Date>();
  bus.injectStream<Date, Record<string, unknown>>(
    'jsonTopic',
    controller.asObservable(),
    datetime => ({
      timestamp: datetime.toISOString(),
      type: 'timestamp',
    })
  );

  // Emit to the external stream
  controller.next(new Date());

  // Wait a bit for all events to be processed
  await new Promise(resolve => setTimeout(resolve, 500));

  // Clean up
  controller.complete();
  stringSubscription.unsubscribe();
  numberSubscription.unsubscribe();
  jsonSubscription.unsubscribe();
  await bus.close();
}

async function usingGlobalBus(): Promise<void> {
  // Get the singleton instance - this will be the same across your entire app
  const bus = GlobalSamsaraBus.getInstance();

  // Another reference to the same bus
  const sameBus = GlobalSamsaraBus.getInstance();
  console.log('Is the same instance?', bus === sameBus); // Should print true

  // Register a couple of topics
  bus.registerTopic<string>('globalTopic', TopicType.PublishSubject);
  bus.registerTopic<number>('counterTopic', TopicType.BehaviorSubject);

  // Subscribe to them
  const subscription1 = bus.getStream<string>('globalTopic').subscribe(
    message => console.log('Global message:', message)
  );

  const subscription2 = bus.getStream<number>('counterTopic').subscribe(
    message => console.log('Counter value:', message)
  );

  // Emit some messages
  bus.emit<string>('globalTopic', 'This is a global message');
  bus.emit<number>('counterTopic', 1);

  // Use the second reference to emit messages
  sameBus.emit<string>('globalTopic', 'Still the same bus!');
  sameBus.emit<number>('counterTopic', 2);

  // Wait a bit for all events to be processed
  await new Promise(resolve => setTimeout(resolve, 500));

  // Clean up
  subscription1.unsubscribe();
  subscription2.unsubscribe();
  await bus.close();
}

async function main(): Promise<void> {
  // Example 1: Using DefaultSamsaraBus (for local scope)
  console.log('=== Example 1: DefaultSamsaraBus ===');
  await usingDefaultBus();

  // Example 2: Using GlobalSamsaraBus (for application-wide singleton)
  console.log('\n=== Example 2: GlobalSamsaraBus ===');
  await usingGlobalBus();
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
