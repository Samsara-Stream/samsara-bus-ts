import { ProcessorDefinition, SKIP, TopologyCombiner } from './types';

export interface DefineProcessorOptions<
  TInputs extends readonly string[] = readonly string[],
  TOutput = any,
  TParams = any
> {
  id: string;
  inputs: TInputs;
  combiner?: TopologyCombiner;
  fn: (...args: any[]) => TOutput | typeof SKIP;
}

export function defineProcessor<
  TInputs extends readonly string[],
  TOutput,
  TParams = any
>(
  options: DefineProcessorOptions<TInputs, TOutput, TParams>
): ProcessorDefinition<TInputs, TOutput, TParams> {
  return {
    id: options.id,
    inputs: options.inputs,
    combiner: options.combiner,
    fn: options.fn
  };
}

defineProcessor.SKIP = SKIP;
