import { describe, expect, it, vi, beforeEach } from 'vitest';
import { reactive, ref } from 'vue';
import { sleep } from '../../helpers.js';
import {
  useProxiedAtomicModel,
  useProxiedComplexModel,
} from '../../../src/components/modelHelper.js';

describe('modelHelper', () => {
  describe('atomics', () => {
    let props;
    let modelValue;
    let emitSpy;
    let localValue;

    beforeEach(() => {
      modelValue = ref('foo');
      props = reactive({
        modelValue,
      });
      emitSpy = vi.fn();
      localValue = useProxiedAtomicModel(props, 'modelValue', emitSpy);
    });

    it('should update internal value (localValue), when props are mutated externally', async () => {
      modelValue.value = 'baz';
      await sleep(0);
      expect(localValue.value).toBe(props.modelValue);
    });

    it('should update external value (props) by emitting update, when localValue is mutated', async () => {
      localValue.value = 'bar';
      await sleep(0);
      expect(emitSpy).toHaveBeenCalledWith(
        'update:modelValue',
        localValue.value,
      );
    });

    it('should not emit, when prop is already updated', async () => {
      modelValue.value = 'foo';
      localValue.value = 'foo';
      await sleep(0);
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('complex', () => {
    describe('model an array', () => {
      let props;
      let modelValue;
      let emitSpy;
      let localValue;

      beforeEach(() => {
        modelValue = reactive([1, 2, 3]);
        props = reactive({
          modelValue,
        });
        emitSpy = vi.fn();
        localValue = useProxiedComplexModel(props, 'modelValue', emitSpy);
      });

      it('should update internal value (localValue), when props are mutated externally', async () => {
        modelValue[0] = 4;
        await sleep(0);
        expect(localValue.value).to.deep.equal(modelValue);
      });

      it('should update external value (props) by emitting update, when localValue is mutated', async () => {
        localValue.value[0] = 5;
        await sleep(0);
        expect(emitSpy).toHaveBeenCalledWith(
          'update:modelValue',
          localValue.value,
        );
      });

      it('should not emit, when prop is already updated', async () => {
        modelValue[0] = 6;
        localValue.value[0] = 6;
        await sleep(0);
        expect(emitSpy).not.toHaveBeenCalled();
      });
    });

    describe('model an object', () => {
      let props;
      let modelValue;
      let emitSpy;
      let localValue;

      beforeEach(() => {
        modelValue = reactive({
          str: 'foo',
          num: 1,
        });
        props = reactive({
          modelValue,
        });
        emitSpy = vi.fn();
        localValue = useProxiedComplexModel(props, 'modelValue', emitSpy);
      });

      it('should update internal value (localValue), when props are mutated externally', async () => {
        modelValue.str = 'bar';
        modelValue.num = 2;
        await sleep(0);
        expect(localValue.value).to.deep.equal(modelValue);
      });

      it('should update external value (props) by emitting update, when localValue is mutated', async () => {
        localValue.value.str = 'b';
        await sleep(0);
        expect(emitSpy).toHaveBeenCalledWith(
          'update:modelValue',
          localValue.value,
        );
      });

      it('should not emit, when prop is already updated', async () => {
        modelValue.str = 'c';
        localValue.value.str = 'c';
        await sleep(0);
        expect(emitSpy).not.toHaveBeenCalled();
      });
    });
  });
});
