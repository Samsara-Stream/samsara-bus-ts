import { useState, useEffect, useMemo } from 'react';
import { Observable, combineLatest, EMPTY } from 'rxjs';
import { useSamsaraBus } from '../context/samsara-bus-context';
import { TopologyDefinition, TopologyNode, StreamProcessorNode, TopicSourceNode } from '../types/topology';

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

        if (processorNode.inputs.length === 1) {
          const inputStream = processNode(processorNode.inputs[0]);
          stream = processorNode.processor(inputStream);
        } else {
          const inputStreams = processorNode.inputs.map(inputId => processNode(inputId));
          const combinedInput = combineLatest(inputStreams);
          stream = processorNode.processor(combinedInput);
        }
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
