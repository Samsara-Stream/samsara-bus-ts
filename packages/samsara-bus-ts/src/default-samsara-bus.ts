import { Observable, Subscription } from 'rxjs';
import { SamsaraBus } from './samsara-bus';
import { Topic, TopicType } from './topic';

/**
 * Default implementation of the SamsaraBus interface.
 */
export class DefaultSamsaraBus extends SamsaraBus {
  /** Map of topic name to topic instance */
  private readonly _topics = new Map<string, Topic<unknown>>();

  /** List of topic connections */
  private readonly _connections: Subscription[] = [];

  /**
   * Registers a new topic with the specified name, data type, and topic type.
   */
  registerTopic<T>(
    name: string,
    type: TopicType,
    replayBufferSize?: number
  ): Topic<T> {
    if (this._topics.has(name)) {
      throw new Error(`Topic with name "${name}" already exists`);
    }

    const topic = new Topic<T>(name, type, replayBufferSize);
    this._topics.set(name, topic as Topic<unknown>);
    return topic;
  }

  /**
   * Gets an existing topic by name, ensuring it has the expected type.
   */
  getTopic<T>(name: string): Topic<T> {
    const topic = this._topics.get(name);
    if (!topic) {
      throw new Error(`Topic with name "${name}" does not exist`);
    }

    return topic as Topic<T>;
  }

  /**
   * Emits a message to the specified topic.
   * 
   * Returns the correlation ID used for the message, either the provided one
   * or a newly generated UUID if none was specified.
   */
  emit<T>(topicName: string, message: T, correlationId?: string): string {
    const topic = this.getTopic<T>(topicName);
    return topic.emit(message, correlationId);
  }

  /**
   * Gets the stream of messages for the specified topic.
   */
  getStream<T>(topicName: string): Observable<T> {
    const topic = this.getTopic<T>(topicName);
    return topic.getStream();
  }

  /**
   * Connects two topics, mapping messages from the source to the destination.
   */
  connectTopics<S, D>(
    sourceTopic: string,
    destinationTopic: string,
    mapper: (message: S) => D
  ): void {
    const sourceStream = this.getStream<S>(sourceTopic);
    const destinationTopicInstance = this.getTopic<D>(destinationTopic);

    const subscription = sourceStream.subscribe({
      next: (message: S) => {
        const mappedMessage = mapper(message);
        destinationTopicInstance.emit(mappedMessage);
      },
      error: (err: Error) => {
        console.error(`Error in topic connection from ${sourceTopic} to ${destinationTopic}:`, err);
      },
    });

    this._connections.push(subscription);
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
    const topic = this.getTopic<T>(topicName);
    topic.injectStream(source, mapper, correlationIdProvider);
  }

  /**
   * Closes all topics and releases resources.
   */
  async close(): Promise<void> {
    // Cancel all topic connections
    this._connections.forEach(sub => sub.unsubscribe());
    this._connections.length = 0;

    // Close all topics
    this._topics.forEach(topic => topic.close());
    this._topics.clear();
  }
}
