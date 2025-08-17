import { useState, useEffect } from 'react';
import { useSamsaraBus } from '../context/samsara-bus-context';

export interface UseSamsaraTopicOptions {
  initialValue?: any;
  emitInitialValue?: boolean;
}

export function useSamsaraTopic<T>(
  topicName: string,
  options: UseSamsaraTopicOptions = {}
): [T | undefined, (value: T, correlationId?: string) => string] {
  const bus = useSamsaraBus();
  const [state, setState] = useState<T | undefined>(options.initialValue);

  useEffect(() => {
    const subscription = bus.getStream<T>(topicName).subscribe({
      next: (value) => setState(value),
      error: (error) => console.error(`Error in topic ${topicName}:`, error),
    });

    return () => subscription.unsubscribe();
  }, [bus, topicName]);

  const emit = (value: T, correlationId?: string): string => {
    return bus.emit(topicName, value, correlationId);
  };

  return [state, emit];
}
