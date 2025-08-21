/**
 * Tests for the new fluent topology API
 */

import { defineProcessor, topology } from '../fluent-api';

describe('Fluent Topology API', () => {
  describe('defineProcessor', () => {
    it('should create a processor definition', () => {
      const processor = defineProcessor({
        id: 'testProcessor',
        inputs: ['input1'] as const,
        fn: (value: string) => value.toUpperCase()
      });

      expect(processor.id).toBe('testProcessor');
      expect(processor.inputs).toEqual(['input1']);
      expect(processor.fn('hello')).toBe('HELLO');
    });

    it('should support SKIP sentinel', () => {
      const processor = defineProcessor({
        id: 'filterProcessor',
        inputs: ['input1'] as const,
        fn: (value: number) => value > 5 ? value : defineProcessor.SKIP
      });

      expect(processor.fn(10)).toBe(10);
      expect(processor.fn(3)).toBe(defineProcessor.SKIP);
    });

    it('should support combiner option', () => {
      const processor = defineProcessor({
        id: 'combineProcessor',
        inputs: ['input1', 'input2'] as const,
        combiner: 'withLatestFrom',
        fn: (a: number, b: number) => a + b
      });

      expect(processor.combiner).toBe('withLatestFrom');
      expect(processor.fn(5, 3)).toBe(8);
    });
  });

  describe('topology builder', () => {
    it('should build a simple topology', () => {
      const simpleProcessor = defineProcessor({
        id: 'simple',
        inputs: ['input'] as const,
        fn: (value: string) => value.toLowerCase()
      });

      const topologyInstance = topology('TestTopology')
        .param('testParam', (t) => t.string())
        .topic('input', 'test-topic')
        .proc(simpleProcessor)
        .output('simple')
        .build();

      expect(topologyInstance.name).toBe('TestTopology');
      expect(topologyInstance.topics).toHaveProperty('input');
      expect(topologyInstance.processors).toHaveProperty('simple');
      expect(topologyInstance.outputNode).toBe('simple');
      expect(topologyInstance.paramTypes).toHaveProperty('testParam');
    });

    it('should support multiple processors', () => {
      const processor1 = defineProcessor({
        id: 'proc1',
        inputs: ['topic1'] as const,
        fn: (value: number) => value * 2
      });

      const processor2 = defineProcessor({
        id: 'proc2',
        inputs: ['proc1'] as const,
        fn: (value: number) => value + 1
      });

      const topologyInstance = topology('ChainTopology')
        .topic('topic1', 'input-topic')
        .proc(processor1)
        .proc(processor2)
        .output('proc2')
        .build();

      expect(Object.keys(topologyInstance.processors)).toHaveLength(2);
      expect(topologyInstance.processors.proc1).toBeDefined();
      expect(topologyInstance.processors.proc2).toBeDefined();
    });

    it('should validate required output', () => {
      expect(() => {
        topology('IncompleteTopology')
          .topic('input', 'test-topic')
          .build();
      }).toThrow('Output node must be specified before building topology');
    });
  });

  describe('type validators', () => {
    it('should create string validator', () => {
      const topologyInstance = topology('StringValidation')
        .param('stringParam', (t) => t.string())
        .topic('input', 'test-topic')
        .output('input')
        .build();

      const validator = topologyInstance.paramTypes.stringParam.validator;
      expect(validator('hello')).toBe(true);
      expect(validator(123)).toBe(false);
      expect(validator(null)).toBe(false);
    });

    it('should create number validator', () => {
      const topologyInstance = topology('NumberValidation')
        .param('numberParam', (t) => t.number())
        .topic('input', 'test-topic')
        .output('input')
        .build();

      const validator = topologyInstance.paramTypes.numberParam.validator;
      expect(validator(123)).toBe(true);
      expect(validator('123')).toBe(false);
      expect(validator(NaN)).toBe(false);
    });

    it('should create boolean validator', () => {
      const topologyInstance = topology('BooleanValidation')
        .param('boolParam', (t) => t.boolean())
        .topic('input', 'test-topic')
        .output('input')
        .build();

      const validator = topologyInstance.paramTypes.boolParam.validator;
      expect(validator(true)).toBe(true);
      expect(validator(false)).toBe(true);
      expect(validator('true')).toBe(false);
      expect(validator(1)).toBe(false);
    });

    it('should create object validator', () => {
      const topologyInstance = topology('ObjectValidation')
        .param('objParam', (t) => t.object())
        .topic('input', 'test-topic')
        .output('input')
        .build();

      const validator = topologyInstance.paramTypes.objParam.validator;
      expect(validator({})).toBe(true);
      expect(validator({ key: 'value' })).toBe(true);
      expect(validator([])).toBe(false);
      expect(validator(null)).toBe(false);
      expect(validator('object')).toBe(false);
    });

    it('should create array validator', () => {
      const topologyInstance = topology('ArrayValidation')
        .param('arrayParam', (t) => t.array())
        .topic('input', 'test-topic')
        .output('input')
        .build();

      const validator = topologyInstance.paramTypes.arrayParam.validator;
      expect(validator([])).toBe(true);
      expect(validator([1, 2, 3])).toBe(true);
      expect(validator({})).toBe(false);
      expect(validator('array')).toBe(false);
    });
  });
});
