import { 
  TopologyBuilder, 
  TopologyInstance, 
  ProcessorDefinition, 
  TopicDefinition, 
  ParameterDefinition,
  TypeValidator 
} from './types';

class TopologyBuilderImpl implements TopologyBuilder {
  
  constructor(
    private readonly topologyName: string,
    private readonly params: Record<string, ParameterDefinition> = {},
    private readonly topics: Record<string, TopicDefinition> = {},
    private readonly processors: Record<string, ProcessorDefinition> = {},
    private readonly outputNode?: string
  ) {}

  param<T>(name: string, validator: (t: TypeValidator) => (value: any) => value is T): TopologyBuilder {
    const typeValidator = createTypeValidator();
    const validatorFn = validator(typeValidator);
    
    return new TopologyBuilderImpl(
      this.topologyName,
      { ...this.params, [name]: { name, validator: validatorFn } },
      this.topics,
      this.processors,
      this.outputNode
    );
  }
  
  topic<T>(name: string, topicName: string): TopologyBuilder {
    return new TopologyBuilderImpl(
      this.topologyName,
      this.params,
      { ...this.topics, [name]: { name, topicName } },
      this.processors,
      this.outputNode
    );
  }
  
  proc(processor: ProcessorDefinition): TopologyBuilder {
    return new TopologyBuilderImpl(
      this.topologyName,
      this.params,
      this.topics,
      { ...this.processors, [processor.id]: processor },
      this.outputNode
    );
  }
  
  output(nodeId: string): TopologyBuilder {
    return new TopologyBuilderImpl(
      this.topologyName,
      this.params,
      this.topics,
      this.processors,
      nodeId
    );
  }
  
  build(): TopologyInstance {
    if (!this.outputNode) {
      throw new Error('Output node must be specified before building topology');
    }

    return {
      name: this.topologyName,
      paramTypes: this.params,
      topics: this.topics,
      processors: this.processors,
      outputNode: this.outputNode
    };
  }
}

function createTypeValidator(): TypeValidator {
  return {
    string(): (value: any) => value is string {
      return (value: any): value is string => typeof value === 'string';
    },
    number(): (value: any) => value is number {
      return (value: any): value is number => typeof value === 'number' && !isNaN(value);
    },
    boolean(): (value: any) => value is boolean {
      return (value: any): value is boolean => typeof value === 'boolean';
    },
    object<T extends Record<string, any>>(): (value: any) => value is T {
      return (value: any): value is T => 
        typeof value === 'object' && value !== null && !Array.isArray(value);
    },
    array<T>(): (value: any) => value is T[] {
      return (value: any): value is T[] => Array.isArray(value);
    }
  };
}

export function topology(name: string): TopologyBuilder {
  return new TopologyBuilderImpl(name);
}
