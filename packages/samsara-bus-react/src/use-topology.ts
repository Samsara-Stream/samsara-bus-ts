import { useState, useEffect, useMemo, useRef } from 'react';
import { Observable, combineLatest, EMPTY, zip, merge, of } from 'rxjs';
import { withLatestFrom, map, filter, catchError } from 'rxjs/operators';
import { useSamsaraBus } from './context/samsara-bus-context';
import { TopologyInstance, UseTopologyResult, SKIP, TopologyExecutionContext } from './types';
import { TopologyCombiner } from './types';

// Helper function to compare parameter objects
function areParamsEqual(a: Record<string, any>, b: Record<string, any>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  
  if (aKeys.length !== bKeys.length) return false;
  
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  
  return true;
}

export function useTopology<T = any>(
  topology: TopologyInstance,
  params: Record<string, any> = {}
): UseTopologyResult<T> {
  const bus = useSamsaraBus();
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Use ref to store previous params for comparison
  const prevParamsRef = useRef<Record<string, any>>(params);
  const stableParams = useMemo(() => {
    if (areParamsEqual(prevParamsRef.current, params)) {
      return prevParamsRef.current;
    }
    prevParamsRef.current = params;
    return params;
  }, [params]);

  // Validate parameters
  const validatedParams = useMemo(() => {
    const validated: Record<string, any> = {};
    
    for (const [paramName, paramDef] of Object.entries(topology.paramTypes)) {
      const value = stableParams[paramName];
      if (value === undefined) {
        throw new Error(`Missing required parameter: ${paramName}`);
      }
      if (!paramDef.validator(value)) {
        throw new Error(`Invalid parameter ${paramName}: expected type validation to pass`);
      }
      validated[paramName] = value;
    }
    
    return validated;
  }, [topology.paramTypes, stableParams]);

  const processedStream = useMemo(() => {
    try {
      setStatus('loading');
      setError(undefined);

      const nodeStreams = new Map<string, Observable<any>>();

      const context: TopologyExecutionContext = {
        createObservable: <T>(nodeId: string): Observable<T> => {
          if (nodeStreams.has(nodeId)) {
            return nodeStreams.get(nodeId)!;
          }

          let stream: Observable<T>;

          // Handle topic nodes
          if (topology.topics[nodeId]) {
            stream = context.getTopicStream<T>(topology.topics[nodeId].topicName);
          }
          // Handle processor nodes
          else if (topology.processors[nodeId]) {
            const processor = topology.processors[nodeId];
            const inputStreams = processor.inputs.map(inputId => context.createObservable(inputId));
            const combinedInput = context.combineInputs(inputStreams, processor.combiner);
            
            stream = combinedInput.pipe(
              map((inputValues: any) => {
                // Prepare arguments for processor function
                const args = Array.isArray(inputValues) ? inputValues : [inputValues];
                args.push(validatedParams);
                
                const result = processor.fn(...args);
                return result;
              }),
              filter(result => result !== SKIP),
              catchError((err) => {
                console.warn(`Error in processor ${nodeId}:`, err);
                return EMPTY;
              })
            );
          }
          else {
            throw new Error(`Unknown node: ${nodeId}`);
          }

          nodeStreams.set(nodeId, stream);
          return stream;
        },
        
        getTopicStream: <T>(topicName: string): Observable<T> => {
          return bus.getStream<T>(topicName);
        },
        
        combineInputs: (inputs: Observable<any>[], combiner?: TopologyCombiner): Observable<any> => {
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
        }
      };

      return context.createObservable<T>(topology.outputNode);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus('error');
      return EMPTY;
    }
  }, [topology, validatedParams, bus]);

  useEffect(() => {
    const subscription = processedStream.subscribe({
      next: (value: T) => {
        setData(value);
        setStatus('success');
        setError(undefined);
      },
      error: (err: any) => {
        console.error('Error in topology stream:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
      },
    });

    return () => subscription.unsubscribe();
  }, [processedStream]);

  return { data, error, status };
}
