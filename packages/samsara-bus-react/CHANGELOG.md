# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-08-21

### Added
- **BREAKING**: New fluent topology API with TypeScript-first design
- `defineProcessor` function for creating reusable, type-safe processors
- `topology` fluent builder for declarative topology construction
- `useTopology` hook (aliased as `useSamsaraTopology`) with enhanced error handling and status tracking
- Typed parameter system with runtime validation
- `SKIP` sentinel for type-safe filtering without RxJS boilerplate
- Support for all RxJS combiners (`combineLatest`, `withLatestFrom`, `zip`, `merge`, custom functions)
- Enhanced chat example demonstrating the new fluent API
- Comprehensive documentation integrated into README.md

### Changed
- **BREAKING**: `useSamsaraTopology` now returns `{data, error, status}` instead of just data
- **BREAKING**: `useSamsaraTopology` now expects `TopologyInstance` (from fluent builder) instead of object literals
- Reorganized source code structure for better maintainability
- Updated all examples to use the new fluent API
- Consolidated type definitions into single `types.ts` file

### Deprecated
- Legacy object literal topology definitions (still supported but deprecated)
- Old chat example replaced with fluent API version

### Benefits
- ✅ **Type Safety**: Full TypeScript support with no `any` types
- ✅ **Reusability**: Processors can be reused across different topologies
- ✅ **Composability**: Build complex topologies from simple, testable pieces
- ✅ **Maintainability**: Clear separation between pure processing logic and topology structure
- ✅ **Developer Experience**: Fluent API with autocomplete and type checking
- ✅ **Performance**: Built-in memoization and efficient stream management

## [1.0.0] - 2025-08-17

### Added
- Initial release of samsara-bus-react
- `useSamsaraTopic` hook for connecting React state to message bus topics
- `useSamsaraTopology` hook for complex stream processing pipelines
- `SamsaraBusProvider` context provider for bus instance management
- TypeScript support with full type definitions
- Comprehensive documentation and examples
- Support for multiple topic types (PublishSubject, BehaviorSubject, ReplaySubject)
- Complex topology definitions with multiple processing nodes
- Stream processing using RxJS operators
