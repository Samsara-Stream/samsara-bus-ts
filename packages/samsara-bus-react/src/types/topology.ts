import { Observable } from 'rxjs';

export interface TopicSourceNode {
  type: 'topic';
  topicName: string;
}

export interface StreamProcessorNode<TInput = any, TOutput = any> {
  type: 'processor';
  id: string;
  processor: (input: Observable<TInput>) => Observable<TOutput>;
  inputs: string[];
}

export type TopologyNode = TopicSourceNode | StreamProcessorNode;

export interface TopologyDefinition {
  nodes: Record<string, TopologyNode>;
  output: string;
}
