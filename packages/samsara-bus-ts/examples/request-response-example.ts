import { Subject } from 'rxjs';
import { filter, first, timeout } from 'rxjs/operators';
import { DefaultSamsaraBus, TopicType } from '../src';

/**
 * This example demonstrates how to implement a request-response pattern
 * using the basic samsara-bus-ts functionality, as a preview of what
 * the future samsara-bus-exchange-ts package will provide automatically.
 */

interface RequestMessage<T = unknown> {
  correlationId: string;
  operation: string;
  params: T;
}

interface ResponseMessage<T = unknown> {
  correlationId: string;
  result?: T;
  error?: string;
}

class SimpleExchangeClient {
  constructor(
    private bus: DefaultSamsaraBus,
    private requestTopic: string,
    private responseTopic: string
  ) {}

  async request<TRequest, TResponse>(
    operation: string,
    params: TRequest,
    timeoutMs = 5000
  ): Promise<TResponse> {
    const correlationId = `req_${Date.now()}_${Math.random()}`;

    // Listen for the response
    const responsePromise = this.bus
      .getStream<ResponseMessage<TResponse>>(this.responseTopic)
      .pipe(
        filter(response => response.correlationId === correlationId),
        timeout(timeoutMs),
        first()
      )
      .toPromise();

    // Send the request
    const request: RequestMessage<TRequest> = {
      correlationId,
      operation,
      params,
    };

    this.bus.emit(this.requestTopic, request);

    const response = await responsePromise;
    if (!response) {
      throw new Error('No response received');
    }

    if (response.error) {
      throw new Error(response.error);
    }

    return response.result as TResponse;
  }
}

class SimpleExchangeService {
  private handlers = new Map<string, (params: unknown) => Promise<unknown>>();

  constructor(
    private bus: DefaultSamsaraBus,
    private requestTopic: string,
    private responseTopic: string
  ) {}

  registerHandler<TRequest, TResponse>(
    operation: string,
    handler: (params: TRequest) => Promise<TResponse>
  ): void {
    this.handlers.set(operation, handler as (params: unknown) => Promise<unknown>);
  }

  start(): void {
    this.bus.getStream<RequestMessage>(this.requestTopic).subscribe(async request => {
      try {
        const handler = this.handlers.get(request.operation);
        if (!handler) {
          const errorResponse: ResponseMessage = {
            correlationId: request.correlationId,
            error: `Unknown operation: ${request.operation}`,
          };
          this.bus.emit(this.responseTopic, errorResponse);
          return;
        }

        const result = await handler(request.params);
        const response: ResponseMessage = {
          correlationId: request.correlationId,
          result,
        };
        this.bus.emit(this.responseTopic, response);
      } catch (error) {
        const errorResponse: ResponseMessage = {
          correlationId: request.correlationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        this.bus.emit(this.responseTopic, errorResponse);
      }
    });
  }
}

// Calculator service implementation
interface CalculatorParams {
  a: number;
  b: number;
}

async function calculatorExample(): Promise<void> {
  console.log('=== Calculator Request-Response Example ===');

  const bus = new DefaultSamsaraBus();

  // Register topics for request-response
  bus.registerTopic<RequestMessage>('calculator.request', TopicType.PublishSubject);
  bus.registerTopic<ResponseMessage>('calculator.response', TopicType.PublishSubject);

  // Create and configure the service
  const service = new SimpleExchangeService(bus, 'calculator.request', 'calculator.response');

  // Register operation handlers
  service.registerHandler<CalculatorParams, number>('add', async ({ a, b }) => {
    console.log(`Computing ${a} + ${b}`);
    return a + b;
  });

  service.registerHandler<CalculatorParams, number>('subtract', async ({ a, b }) => {
    console.log(`Computing ${a} - ${b}`);
    return a - b;
  });

  service.registerHandler<CalculatorParams, number>('multiply', async ({ a, b }) => {
    console.log(`Computing ${a} * ${b}`);
    return a * b;
  });

  service.registerHandler<CalculatorParams, number>('divide', async ({ a, b }) => {
    console.log(`Computing ${a} / ${b}`);
    if (b === 0) {
      throw new Error('Division by zero is not allowed');
    }
    return a / b;
  });

  // Start the service
  service.start();

  // Create a client
  const client = new SimpleExchangeClient(bus, 'calculator.request', 'calculator.response');

  try {
    // Perform some calculations
    console.log('\n--- Performing calculations ---');

    const sum = await client.request<CalculatorParams, number>('add', { a: 10, b: 5 });
    console.log(`Result: 10 + 5 = ${sum}`);

    const difference = await client.request<CalculatorParams, number>('subtract', { a: 10, b: 3 });
    console.log(`Result: 10 - 3 = ${difference}`);

    const product = await client.request<CalculatorParams, number>('multiply', { a: 4, b: 7 });
    console.log(`Result: 4 * 7 = ${product}`);

    const quotient = await client.request<CalculatorParams, number>('divide', { a: 15, b: 3 });
    console.log(`Result: 15 / 3 = ${quotient}`);

    // Test error handling
    console.log('\n--- Testing error handling ---');
    try {
      await client.request<CalculatorParams, number>('divide', { a: 10, b: 0 });
    } catch (error) {
      console.log(`Caught expected error: ${error}`);
    }

    // Test unknown operation
    try {
      await client.request('unknown', {});
    } catch (error) {
      console.log(`Caught expected error: ${error}`);
    }

    // Test concurrent requests
    console.log('\n--- Testing concurrent requests ---');
    const concurrentRequests = [
      client.request<CalculatorParams, number>('add', { a: 1, b: 1 }),
      client.request<CalculatorParams, number>('multiply', { a: 2, b: 3 }),
      client.request<CalculatorParams, number>('subtract', { a: 10, b: 4 }),
    ];

    const results = await Promise.all(concurrentRequests);
    console.log(`Concurrent results: ${results.join(', ')}`);

  } finally {
    await bus.close();
    console.log('Calculator example completed.\n');
  }
}

async function main(): Promise<void> {
  await calculatorExample();
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
