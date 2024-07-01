import { computed, ref, toRaw, watch } from 'vue';
import deepEqual from 'fast-deep-equal';

/**
 * Can only be used in setup of Vue components!
 * Provides a computed model for atomic properties.
 * getter returns the internal value
 * setter updates internal value and emits the update event
 * simplified based on https://github.com/vuetifyjs/vuetify/blob/master/packages/vuetify/src/composables/proxiedModel.ts
 * @param {Object} props
 * @param {string} prop
 * @param {(event: string, value: T) => void} emit
 * @returns {import("vue").Ref<import("vue").UnwrapRef<T>>}
 * @template T
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
 * @param {Object} props
 * @param {string} prop
 * @param {(event: string, value: T) => void} emit
 * @returns {import("vue").Ref<import("vue").UnwrapRef<T>>}
 * @template T
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
      internal.value = structuredClone(newValue);
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
      emit(`update:${prop}`, structuredClone(newValue));
    },
    {
      deep: true,
    },
  );

  return internal;
}
