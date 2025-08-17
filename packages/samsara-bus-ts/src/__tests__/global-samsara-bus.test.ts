import { GlobalSamsaraBus, TopicType } from '../index';

describe('GlobalSamsaraBus', () => {
  let bus: GlobalSamsaraBus;

  beforeEach(() => {
    bus = GlobalSamsaraBus.getInstance();
  });

  afterEach(async () => {
    await bus.close();
  });

  it('should return the same instance', () => {
    const bus1 = GlobalSamsaraBus.getInstance();
    const bus2 = GlobalSamsaraBus.getInstance();
    
    expect(bus1).toBe(bus2);
  });

  it('should work as a normal bus', async () => {
    bus.registerTopic<string>('global-test', TopicType.PublishSubject);

    const messages: string[] = [];
    const subscription = bus.getStream<string>('global-test').subscribe(message => {
      messages.push(message);
    });

    bus.emit<string>('global-test', 'Global message');

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(messages).toEqual(['Global message']);
    subscription.unsubscribe();
  });

  it('should share state across instances', async () => {
    const bus1 = GlobalSamsaraBus.getInstance();
    const bus2 = GlobalSamsaraBus.getInstance();

    bus1.registerTopic<string>('shared', TopicType.PublishSubject);

    const messages: string[] = [];
    const subscription = bus2.getStream<string>('shared').subscribe(message => {
      messages.push(message);
    });

    bus1.emit<string>('shared', 'From bus1');
    bus2.emit<string>('shared', 'From bus2');

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(messages).toEqual(['From bus1', 'From bus2']);
    subscription.unsubscribe();
  });
});
