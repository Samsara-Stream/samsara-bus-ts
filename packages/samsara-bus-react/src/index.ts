export { useSamsaraTopic } from './hooks/use-samsara-topic';
export { useSamsaraTopology } from './hooks/use-samsara-topology';
export { SamsaraBusProvider, useSamsaraBus } from './context/samsara-bus-context';

// Main API - fluent topology definitions
export { defineProcessor, topology, useTopology } from './fluent-api';
export type { 
  ProcessorDefinition, 
  TopologyBuilder, 
  TopologyInstance, 
  UseTopologyResult,
  TopologyCombiner,
  TypeValidator
} from './types';

// Legacy types for backwards compatibility
export type { 
  TopologyDefinition, 
  TopologyNode, 
  StreamProcessorNode, 
  TopicSourceNode 
} from './types';
