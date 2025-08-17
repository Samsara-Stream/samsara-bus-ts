import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { DefaultSamsaraBus, TopicType } from 'samsara-bus-ts';
import { SamsaraBusProvider } from '../context/samsara-bus-context';
import { useSamsaraTopic } from '../hooks/use-samsara-topic';

describe('useSamsaraTopic', () => {
  let bus: DefaultSamsaraBus;

  beforeEach(() => {
    bus = new DefaultSamsaraBus();
  });

  afterEach(async () => {
    await bus.close();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SamsaraBusProvider bus={bus}>{children}</SamsaraBusProvider>
  );

  it('should subscribe to topic and update state', async () => {
    const topicName = 'test-topic';
    bus.registerTopic<string>(topicName, TopicType.PublishSubject);

    const { result } = renderHook(() => useSamsaraTopic<string>(topicName), {
      wrapper,
    });

    expect(result.current[0]).toBeUndefined();

    act(() => {
      bus.emit(topicName, 'hello world');
    });

    // Wait for the subscription to update
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current[0]).toBe('hello world');
  });

  it('should emit messages to topic', async () => {
    const topicName = 'test-topic-emit';
    bus.registerTopic<number>(topicName, TopicType.PublishSubject);

    const { result } = renderHook(() => useSamsaraTopic<number>(topicName), {
      wrapper,
    });

    let receivedValue: number | undefined;
    bus.getStream<number>(topicName).subscribe(value => {
      receivedValue = value;
    });

    act(() => {
      result.current[1](42);
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(receivedValue).toBe(42);
  });

  it('should use initial value', () => {
    const topicName = 'test-topic-initial';
    bus.registerTopic<string>(topicName, TopicType.PublishSubject);

    const { result } = renderHook(
      () => useSamsaraTopic<string>(topicName, { initialValue: 'initial' }),
      { wrapper }
    );

    expect(result.current[0]).toBe('initial');
  });
});
