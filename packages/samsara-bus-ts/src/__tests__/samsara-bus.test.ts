import { Subject } from 'rxjs';
import { SamsaraBus, DefaultSamsaraBus, TopicType } from '../index';

describe('SamsaraBus', () => {
  let bus: SamsaraBus;

  beforeEach(() => {
    bus = new DefaultSamsaraBus();
  });

  afterEach(async () => {
    await bus.close();
  });

  describe('Topic registration and retrieval', () => {
    it('should register and retrieve a topic', () => {
      const topic = bus.registerTopic<string>('test', TopicType.PublishSubject);
      expect(topic).toBeDefined();
      expect(topic.name).toBe('test');

      const retrieved = bus.getTopic<string>('test');
      expect(retrieved).toBe(topic);
    });

    it('should throw when registering duplicate topic', () => {
      bus.registerTopic<string>('test', TopicType.PublishSubject);
      expect(() => bus.registerTopic<number>('test', TopicType.PublishSubject))
        .toThrow('Topic with name "test" already exists');
    });

    it('should throw when topic does not exist', () => {
      expect(() => bus.getTopic<string>('nonexistent'))
        .toThrow('Topic with name "nonexistent" does not exist');
    });
  });

  describe('Message emission and reception', () => {
    it('should emit and receive messages', async () => {
      bus.registerTopic<string>('test', TopicType.PublishSubject);

      const messages: string[] = [];
      const subscription = bus.getStream<string>('test').subscribe(message => {
        messages.push(message);
      });

      bus.emit<string>('test', 'Hello');
      bus.emit<string>('test', 'World');

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(messages).toEqual(['Hello', 'World']);
      subscription.unsubscribe();
    });

    it('should return correlation ID when emitting', () => {
      bus.registerTopic<string>('test', TopicType.PublishSubject);

      const correlationId1 = bus.emit<string>('test', 'Hello');
      const correlationId2 = bus.emit<string>('test', 'World', 'custom-id');

      expect(correlationId1).toBeDefined();
      expect(typeof correlationId1).toBe('string');
      expect(correlationId2).toBe('custom-id');
    });

    it('should work with BehaviorSubject (caches latest)', async () => {
      bus.registerTopic<number>('behavior', TopicType.BehaviorSubject);
      
      bus.emit<number>('behavior', 42);

      const messages: number[] = [];
      const subscription = bus.getStream<number>('behavior').subscribe(message => {
        if (message !== undefined) {
          messages.push(message);
        }
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      bus.emit<number>('behavior', 100);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(messages).toEqual([42, 100]);
      subscription.unsubscribe();
    });

    it('should work with ReplaySubject (replays previous messages)', async () => {
      bus.registerTopic<string>('replay', TopicType.ReplaySubject, 2);

      bus.emit<string>('replay', 'First');
      bus.emit<string>('replay', 'Second');
      bus.emit<string>('replay', 'Third');

      const messages: string[] = [];
      const subscription = bus.getStream<string>('replay').subscribe(message => {
        messages.push(message);
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should only get the last 2 messages
      expect(messages).toEqual(['Second', 'Third']);
      subscription.unsubscribe();
    });
  });

  describe('Topic connections', () => {
    it('should connect topics with transformation', async () => {
      bus.registerTopic<string>('source', TopicType.PublishSubject);
      bus.registerTopic<number>('destination', TopicType.PublishSubject);

      const destinationMessages: number[] = [];
      const subscription = bus.getStream<number>('destination').subscribe(message => {
        destinationMessages.push(message);
      });

      bus.connectTopics<string, number>('source', 'destination', str => str.length);

      bus.emit<string>('source', 'Hello');
      bus.emit<string>('source', 'World!');

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(destinationMessages).toEqual([5, 6]);
      subscription.unsubscribe();
    });
  });

  describe('Stream injection', () => {
    it('should inject external stream into topic', async () => {
      bus.registerTopic<string>('target', TopicType.PublishSubject);

      const externalSubject = new Subject<number>();
      bus.injectStream<number, string>(
        'target',
        externalSubject.asObservable(),
        num => `Number: ${num}`
      );

      const messages: string[] = [];
      const subscription = bus.getStream<string>('target').subscribe(message => {
        messages.push(message);
      });

      externalSubject.next(42);
      externalSubject.next(100);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(messages).toEqual(['Number: 42', 'Number: 100']);
      
      subscription.unsubscribe();
      externalSubject.complete();
    });
  });

  describe('Resource cleanup', () => {
    it('should close all topics when bus is closed', async () => {
      const topic1 = bus.registerTopic<string>('topic1', TopicType.PublishSubject);
      const topic2 = bus.registerTopic<number>('topic2', TopicType.PublishSubject);

      // Mock the close method to verify it's called
      const topic1CloseSpy = jest.spyOn(topic1, 'close');
      const topic2CloseSpy = jest.spyOn(topic2, 'close');

      await bus.close();

      expect(topic1CloseSpy).toHaveBeenCalled();
      expect(topic2CloseSpy).toHaveBeenCalled();
    });
  });
});
