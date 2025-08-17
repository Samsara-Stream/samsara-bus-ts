/**
 * A multi-topic RxJS-based message/event bus for TypeScript.
 * 
 * This library provides a message bus implementation with support for:
 * - Registering topics with specific message types and stream behaviors
 * - Type-safe message emission and consumption
 * - Connecting topics with mapping functions
 * - Injecting external streams into topics
 * - Message correlation across topics
 */

export { SamsaraBus } from './samsara-bus';
export { DefaultSamsaraBus } from './default-samsara-bus';
export { GlobalSamsaraBus } from './global-samsara-bus';
export { Topic, TopicType } from './topic';
export { MessageEnvelope } from './models';
