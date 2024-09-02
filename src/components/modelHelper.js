import { computed, ref, toRaw, watch } from 'vue';
import deepEqual from 'fast-deep-equal';
import { getLogger } from '@vcsuite/logger';

/**
 * Can only be used in setup of Vue components!
 * Provides a computed model for atomic properties.
 * getter returns the internal value
 * setter updates internal value and emits the update event
 * simplified based on https://github.com/vuetifyjs/vuetify/blob/master/packages/vuetify/src/composables/proxiedModel.ts
 * @param {{ [k in P]: string extends P ? unknown : T }} props
 * @param {P} prop
 * @param {(event: string extends P ? P : `update:${P}`, value: T) => void} emit
 * @returns {import("vue").Ref<import("vue").UnwrapRef<T>>}
 * @template T
 * @template  {string} [P=string]
 */
export function useProxiedAtomicModel(props, prop, emit) {
  const internal = ref(props[prop]);

  // Watch for changes in prop (reassignment) and update internal
  watch(
    () => props[prop],
    (newValue) => {
      internal.value = newValue;
    },
  );

  return computed({
    get() {
      return internal.value;
    },
    set(newValue) {
      if (internal.value !== newValue) {
        internal.value = newValue;
        emit(`update:${prop}`, newValue);
      }
    },
  });
}

/**
 * Can only be used in setup of Vue components!
 * Provides a ref model for complex properties.
 * Watches changes on the provided prop and updates the internal ref
 * Watches changes on the internal ref and emits the change, if prop has not already been updated
 * @param {{ [k in P]: string extends P ? unknown : T }} props
 * @param {P} prop
 * @param {(event: string extends P ? P : `update:${P}`, value: T) => void} emit
 * @returns {import("vue").Ref<import("vue").UnwrapRef<T>>}
 * @template T
 * @template {string} [P=string]
 */
export function useProxiedComplexModel(props, prop, emit) {
  const internal = ref(structuredClone(toRaw(props[prop])));

  // Watch for changes in prop (reassignment) and update internal
  watch(
    () => props[prop],
    (internalValue) => {
      const newValue = toRaw(internalValue);
      if (deepEqual(internal.value, newValue)) {
        return;
      }
      try {
        internal.value = structuredClone(newValue);
      } catch (e) {
        getLogger('modelHelper').error(
          'Failed to update internal value. You may have a provided a deeply nested ref, which caused',
          e,
        );
      }
    },
    {
      deep: true,
      immediate: true,
    },
  );

  // Watch for changes in internal (key updates and reassign) and emit to update prop
  // if prop is already equal internal, do not emit
  watch(
    internal,
    (internalValue) => {
      const newValue = toRaw(internalValue);
      const value = toRaw(props[prop]);
      if (deepEqual(value, newValue)) {
        return;
      }
      try {
        emit(`update:${prop}`, structuredClone(newValue));
      } catch (e) {
        getLogger('modelHelper').error(
          'Failed to emit value. You may have a provided a deeply nested ref, which caused',
          e,
        );
      }
    },
    {
      deep: true,
    },
  );

  return internal;
}

/**
 * Helper function that returns a modelValue for VcsCheckbox depending on the availability of a specific property within a model object
 * Getter returns true, if property is available, otherwise false.
 * Setter applies provided defaultValue on the model object, if checked (true) and undefined, if unchecked (false)
 * @param {import("vue").Ref<Object>} localValue The model object, e.g. provided by `useProxiedComplexModel` or a local ref object.
 * @param {string} key The key of the localValue that should be return on get and updated on set.
 * @param {D} defaultValue  The default value that is set on checked (true)
 * @returns {import('vue').WritableComputedRef<boolean>}
 * @template D
 */
export function useModelHasProperty(localValue, key, defaultValue) {
  const model = () => localValue.value;
  return computed({
    get() {
      return model()[key] !== undefined;
    },
    set(value) {
      const v = value ? defaultValue : undefined;
      if (localValue.value[key] !== v) {
        localValue.value[key] = v;
      }
    },
  });
}
