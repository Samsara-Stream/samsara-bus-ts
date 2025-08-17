/**
 * A wrapper class for messages/events emitted through the bus.
 * 
 * This envelope contains the actual message payload and metadata like
 * a correlation ID to track related messages across different topics.
 */
export class MessageEnvelope<T> {
  /** The actual message payload */
  public readonly payload: T;

  /** Correlation ID used to track related messages across topics */
  public readonly correlationId: string;

  /** Timestamp when the message was created */
  public readonly timestamp: Date;

  /**
   * Creates a new message envelope with the given payload and correlation ID.
   */
  constructor(payload: T, correlationId: string, timestamp?: Date) {
    this.payload = payload;
    this.correlationId = correlationId;
    this.timestamp = timestamp ?? new Date();
  }

  /**
   * Creates a new message envelope with the same correlation ID but a new payload.
   */
  map<R>(mapper: (payload: T) => R): MessageEnvelope<R> {
    return new MessageEnvelope<R>(
      mapper(this.payload),
      this.correlationId,
      this.timestamp
    );
  }

  toString(): string {
    return `MessageEnvelope(payload: ${this.payload}, correlationId: ${this.correlationId}, timestamp: ${this.timestamp.toISOString()})`;
  }
}
