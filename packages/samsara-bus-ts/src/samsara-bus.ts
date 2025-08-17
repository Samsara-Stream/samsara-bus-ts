import { Observable } from 'rxjs';
import { Topic, TopicType } from './topic';

/**
 * The main message bus interface that manages multiple topics.
 */
export abstract class SamsaraBus {
  /**
   * Registers a new topic with the specified name, data type, and topic type.
   */
  abstract registerTopic<T>(
    name: string,
    type: TopicType,
    replayBufferSize?: number
  ): Topic<T>;

  /**
   * Gets an existing topic by name, ensuring it has the expected type.
   */
  abstract getTopic<T>(name: string): Topic<T>;

  /**
   * Emits a message to the specified topic.
   * 
   * Returns the correlation ID used for the message, either the provided one
   * or a newly generated UUID if none was specified.
   */
  abstract emit<T>(topicName: string, message: T, correlationId?: string): string;

  /**
   * Gets the stream of messages for the specified topic.
   */
  abstract getStream<T>(topicName: string): Observable<T>;

  /**
   * Connects two topics, mapping messages from the source to the destination.
   */
  abstract connectTopics<S, D>(
    sourceTopic: string,
    destinationTopic: string,
    mapper: (message: S) => D
  ): void;

  /**
   * Injects an external stream into a topic.
   */
  abstract injectStream<S, T>(
    topicName: string,
    source: Observable<S>,
    mapper: (value: S) => T,
    correlationIdProvider?: () => string
  ): void;

  /**
   * Closes all topics and releases resources.
   */
  abstract close(): Promise<void>;
}
