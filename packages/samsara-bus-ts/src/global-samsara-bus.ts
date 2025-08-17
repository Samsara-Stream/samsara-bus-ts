import { Observable } from 'rxjs';
import { SamsaraBus } from './samsara-bus';
import { DefaultSamsaraBus } from './default-samsara-bus';
import { Topic, TopicType } from './topic';

/**
 * A global singleton implementation of SamsaraBus that delegates all calls
 * to an internal DefaultSamsaraBus instance.
 */
export class GlobalSamsaraBus extends SamsaraBus {
  /** Singleton instance */
  private static _instance: GlobalSamsaraBus;

  /** Internal implementation that handles the actual work */
  private readonly _implementation: DefaultSamsaraBus;

  /**
   * Private constructor for singleton
   */
  private constructor() {
    super();
    this._implementation = new DefaultSamsaraBus();
  }

  /**
   * Factory method to return the singleton instance
   */
  static getInstance(): GlobalSamsaraBus {
    if (!GlobalSamsaraBus._instance) {
      GlobalSamsaraBus._instance = new GlobalSamsaraBus();
    }
    return GlobalSamsaraBus._instance;
  }

  /**
   * Registers a new topic with the specified name, data type, and topic type.
   */
  registerTopic<T>(
    name: string,
    type: TopicType,
    replayBufferSize?: number
  ): Topic<T> {
    return this._implementation.registerTopic<T>(name, type, replayBufferSize);
  }

  /**
   * Gets an existing topic by name, ensuring it has the expected type.
   */
  getTopic<T>(name: string): Topic<T> {
    return this._implementation.getTopic<T>(name);
  }

  /**
   * Emits a message to the specified topic.
   * 
   * Returns the correlation ID used for the message, either the provided one
   * or a newly generated UUID if none was specified.
   */
  emit<T>(topicName: string, message: T, correlationId?: string): string {
    return this._implementation.emit<T>(topicName, message, correlationId);
  }

  /**
   * Gets the stream of messages for the specified topic.
   */
  getStream<T>(topicName: string): Observable<T> {
    return this._implementation.getStream<T>(topicName);
  }

  /**
   * Connects two topics, mapping messages from the source to the destination.
   */
  connectTopics<S, D>(
    sourceTopic: string,
    destinationTopic: string,
    mapper: (message: S) => D
  ): void {
    this._implementation.connectTopics<S, D>(sourceTopic, destinationTopic, mapper);
  }

  /**
   * Injects an external stream into a topic.
   */
  injectStream<S, T>(
    topicName: string,
    source: Observable<S>,
    mapper: (value: S) => T,
    correlationIdProvider?: () => string
  ): void {
    this._implementation.injectStream<S, T>(
      topicName,
      source,
      mapper,
      correlationIdProvider
    );
  }

  /**
   * Closes all topics and releases resources.
   */
  async close(): Promise<void> {
    await this._implementation.close();
  }
}
