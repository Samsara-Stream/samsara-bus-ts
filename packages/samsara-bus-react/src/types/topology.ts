import { Observable } from 'rxjs';

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
