# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-08-05

### Added
- Initial release of samsara-bus-ts
- Core message bus functionality with TypeScript support
- Type-safe topic registration and message emission
- Support for PublishSubject, BehaviorSubject, and ReplaySubject
- Topic connections with transformation functions
- External stream injection capabilities
- Message correlation tracking
- DefaultSamsaraBus implementation for local scope usage
- GlobalSamsaraBus singleton implementation for application-wide messaging
- Comprehensive test suite with Jest
- Complete examples demonstrating all features
- Full API documentation

### Features
- **Type-safe Topics**: Register topics with specific message types and stream behaviors
- **Flexible Stream Types**: Choose between Subject, BehaviorSubject, or ReplaySubject
- **Topic Connections**: Connect topics with transformation functions
- **Stream Injection**: Inject external streams into topics
- **Message Correlation**: Track related messages across different topics
- **Global & Local Bus Options**: Use singleton or local instances as needed
- **Built on RxJS**: Leverages the power of reactive programming with RxJS

### Dependencies
- RxJS ^7.8.0 for reactive programming support
- UUID ^9.0.0 for correlation ID generation
