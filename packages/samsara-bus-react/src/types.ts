import { Observable } from 'rxjs';

export const SKIP = Symbol('SKIP');

// Legacy types for backwards compatibility
export interface TopicSourceNode {
  type: 'topic';
  topicName: string;
}

export type TopologyCombiner =
  | 'combineLatest'
  | 'zip'
  | 'merge'
  | 'withLatestFrom'
  | ((inputs: Observable<any>[]) => Observable<any>);

export interface StreamProcessorNode<TInput = any, TOutput = any> {
  type: 'processor';
  id: string;
  processor: (input: Observable<TInput>) => Observable<TOutput>;
  inputs: string[];
  combiner?: TopologyCombiner;
}

export type TopologyNode = TopicSourceNode | StreamProcessorNode;

export interface TopologyDefinition {
  nodes: Record<string, TopologyNode>;
  output: string;
}

// New fluent API types
export interface ProcessorDefinition<TInputs extends readonly string[] = readonly string[], TOutput = any, TParams = any> {
  readonly id: string;
  readonly inputs: TInputs;
  readonly combiner?: TopologyCombiner;
  readonly fn: (...args: any[]) => TOutput | typeof SKIP;
}

export interface TopicDefinition<T = any> {
  readonly name: string;
  readonly topicName: string;
}

export interface ParameterDefinition<T = any> {
  readonly name: string;
  readonly validator: (value: any) => value is T;
}

export interface TopologyBuilder {
  param<T>(name: string, validator: (t: TypeValidator) => (value: any) => value is T): TopologyBuilder;
  topic<T>(name: string, topicName: string): TopologyBuilder;
  proc(processor: ProcessorDefinition): TopologyBuilder;
  output(nodeId: string): TopologyBuilder;
  build(): TopologyInstance;
}

export interface TopologyInstance<TParams = any, TOutput = any> {
  readonly name: string;
  readonly paramTypes: Record<string, ParameterDefinition>;
  readonly topics: Record<string, TopicDefinition>;
  readonly processors: Record<string, ProcessorDefinition>;
  readonly outputNode: string;
}

export interface TypeValidator {
  string(): (value: any) => value is string;
  number(): (value: any) => value is number;
  boolean(): (value: any) => value is boolean;
  object<T extends Record<string, any>>(): (value: any) => value is T;
  array<T>(): (value: any) => value is T[];
}

export interface UseTopologyResult<T> {
  data: T | undefined;
  error: Error | undefined;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export interface TopologyExecutionContext {
  createObservable<T>(nodeId: string): Observable<T>;
  getTopicStream<T>(topicName: string): Observable<T>;
  combineInputs(inputs: Observable<any>[], combiner?: TopologyCombiner): Observable<any>;
}
