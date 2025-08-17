import { Observable, Subject, BehaviorSubject, ReplaySubject, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { MessageEnvelope } from './models';

/**
 * Types of subjects that can be used for topics
 */
export enum TopicType {
  /** Basic publish/subscribe behavior */
  PublishSubject = 'publishSubject',
  /** Caches the latest event and replays it to new subscribers */
  BehaviorSubject = 'behaviorSubject',
  /** Caches multiple events and replays them to new subscribers */
  ReplaySubject = 'replaySubject',
}

/**
 * A topic in the message bus.
 * 
 * A topic represents a stream of messages of a specific type T.
 */
export class Topic<T> {
  /** The name of the topic */
  public readonly name: string;

  /** The subject that backs this topic */
  private readonly _subject: Subject<MessageEnvelope<T>>;

  /** List of subscriptions to external streams */
  private readonly _externalSubscriptions: Subscription[] = [];

  /**
   * Creates a new topic with the given name and subject type.
   */
  constructor(name: string, type: TopicType, replayBufferSize?: number) {
    this.name = name;
    this._subject = this._createSubject<T>(type, replayBufferSize);
  }

  /**
   * Create the appropriate subject based on the topic type
   */
  private _createSubject<T>(type: TopicType, replayBufferSize?: number): Subject<MessageEnvelope<T>> {
    switch (type) {
      case TopicType.PublishSubject:
        return new Subject<MessageEnvelope<T>>();
      case TopicType.BehaviorSubject:
        return new BehaviorSubject<MessageEnvelope<T>>(
          new MessageEnvelope<T>(undefined as T, uuidv4())
        );
      case TopicType.ReplaySubject:
        return new ReplaySubject<MessageEnvelope<T>>(replayBufferSize);
      default:
        throw new Error(`Unknown topic type: ${type}`);
    }
  }

  /**
   * Emits a message to this topic.
   * 
   * Returns the correlation ID used for the message, either the provided one
   * or a newly generated UUID if none was specified.
   */
  emit(message: T, correlationId?: string): string {
    const id = correlationId ?? uuidv4();
    const envelope = new MessageEnvelope(message, id);
    this._subject.next(envelope);
    return id;
  }

  /**
   * Gets the stream of messages for this topic.
   */
  getStream(): Observable<T> {
    return this._subject.asObservable().pipe(
      // Filter out undefined messages from BehaviorSubject initialization
      map((envelope: MessageEnvelope<T>) => envelope.payload !== undefined ? envelope.payload : null as T),
      filter((payload: T | null) => payload !== null)
    ) as Observable<T>;
  }

  /**
   * Gets the raw stream with message envelopes.
   */
  getRawStream(): Observable<MessageEnvelope<T>> {
    return this._subject.asObservable();
  }

  /**
   * Injects an external stream into this topic.
   */
  injectStream<S>(
    source: Observable<S>,
    mapper: (value: S) => T,
    correlationIdProvider?: () => string
  ): void {
    const subscription = source.subscribe({
      next: (value: S) => {
        const correlationId = correlationIdProvider?.() ?? uuidv4();
        this.emit(mapper(value), correlationId);
      },
      error: (err: Error) => this._subject.error(err),
    });

    this._externalSubscriptions.push(subscription);
  }

  /**
   * Closes the topic and all external subscriptions.
   */
  close(): void {
    this._externalSubscriptions.forEach(sub => sub.unsubscribe());
    this._externalSubscriptions.length = 0;
    this._subject.complete();
  }
}
