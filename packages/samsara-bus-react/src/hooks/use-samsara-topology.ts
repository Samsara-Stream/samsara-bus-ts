import { useState, useEffect, useMemo } from 'react';
import { Observable, combineLatest, EMPTY, zip, merge } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { useSamsaraBus } from '../context/samsara-bus-context';
import { TopologyDefinition, TopologyNode, StreamProcessorNode, TopicSourceNode, TopologyCombiner } from '../types/topology';

export interface UseSamsaraTopologyOptions {
  initialValue?: any;
}

export function useSamsaraTopology<T>(
  topology: TopologyDefinition,
  options: UseSamsaraTopologyOptions = {}
): T | undefined {
  const bus = useSamsaraBus();
  const [state, setState] = useState<T | undefined>(options.initialValue);

  const processedStream = useMemo(() => {
    const nodeStreams = new Map<string, Observable<any>>();
    const processedNodes = new Set<string>();

    const combineInputs = (inputs: Observable<any>[], combiner?: TopologyCombiner): Observable<any> => {
      if (inputs.length === 0) return EMPTY;
      if (inputs.length === 1) return inputs[0];

      if (typeof combiner === 'function') {
        return combiner(inputs);
      }

      switch (combiner) {
        case 'zip':
          return zip(...inputs);
        case 'merge':
          return merge(...inputs);
        case 'withLatestFrom':
          return inputs[0].pipe(withLatestFrom(...inputs.slice(1)));
        case 'combineLatest':
        default:
          return combineLatest(inputs);
      }
    };

    const processNode = (nodeId: string): Observable<any> => {
      if (nodeStreams.has(nodeId)) {
        return nodeStreams.get(nodeId)!;
      }

      const node = topology.nodes[nodeId];
      if (!node) {
        console.error(`Node ${nodeId} not found in topology`);
        return EMPTY;
      }

      let stream: Observable<any>;

      if (node.type === 'topic') {
        const topicNode = node as TopicSourceNode;
        stream = bus.getStream(topicNode.topicName);
      } else if (node.type === 'processor') {
        const processorNode = node as StreamProcessorNode;
        
        if (processorNode.inputs.length === 0) {
          console.error(`Processor node ${nodeId} has no inputs`);
          return EMPTY;
        }

  const inputStreams = processorNode.inputs.map(inputId => processNode(inputId));
  const combinedInput = combineInputs(inputStreams, processorNode.combiner);
  stream = processorNode.processor(combinedInput);
      } else {
        console.error(`Unknown node type for node ${nodeId}`);
        return EMPTY;
      }

      nodeStreams.set(nodeId, stream);
      processedNodes.add(nodeId);
      return stream;
    };

    return processNode(topology.output);
  }, [topology, bus]);

  useEffect(() => {
    const subscription = processedStream.subscribe({
      next: (value: T) => setState(value),
      error: (error: any) => console.error('Error in topology stream:', error),
    });

    return () => subscription.unsubscribe();
  }, [processedStream]);

  return state;
}
