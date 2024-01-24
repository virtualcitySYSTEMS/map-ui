import { computed } from 'vue';

/**
 * Creates a computed property with a getter and a setter for a specific primitive object property/key of the modelled object. This composable allows to pass the computed to an v-model of a sub component. The getter returns the value of the key. The setter merges the passed value with the other object properties of the modelled object and emits the whole object as a input event, and only the changed props as an change event.
 * @param {function():T} modelObject Getter for the property that is modelled by the component and should be updated with input event, usually this is the 'value' prop.
 * @param {K} key The key of the modelObject that should be returned on get and updated on set.
 * @param {function(string, unknown[]):void} emit The emit function of the component context that is using this composable.
 * @returns {import('vue').WritableComputedRef<T[K]>} A computed with a getter and a setter.
 * @template {Record<string, unknown>} T
 * @template {string} K
 */
export function usePrimitiveProperty(modelObject, key, emit) {
  return computed({
    get() {
      return modelObject()[key];
    },
    set(value) {
      if (modelObject()[key] !== value) {
        const newParams = structuredClone(modelObject());
        const changedParams = { [key]: value ?? undefined };
        emit('input', Object.assign(newParams, changedParams));
        emit('propertyChange', changedParams);
      }
    },
  });
}

/**
 * Creates an object with the entries of the input array as keys and computed properties as values. These have a getter and a setter for a specific entry of the array, that is an object property/key of the modelled object. This composable allows to pass the computeds to an v-model of a sub component. The getter returns the value of the array entry. The setter first merges the passed value with the other array entries, and then with the other object properties of the modelled object and emits the whole object as a input event, and only the changed props as an change event.
 * @param {function():T} modelObject Getter for the property that is modelled by the component and should be updated with input event, usually this is the 'value' prop.
 * @param {K} key The key of the modelObject that should be returned on get and updated on set.
 * @param {function(string, unknown[]):void} emit The emit function of the component context that is using this composable.
 * @param {number} arrayLength The length of the array property.
 * @returns {import('vue').WritableComputedRef<T[K][number]>[]} An object with the provided names as keys and the corresponding computed properties with a getter and a setter.
 * @template {Object} T
 * @template {string} K
 */
export function useArrayProperty(modelObject, key, emit, arrayLength) {
  return Array(arrayLength)
    .fill()
    .map((entry, index) => {
      return computed({
        get() {
          if (modelObject()?.[key]) {
            return modelObject()[key][index];
          } else {
            return undefined;
          }
        },
        set(value) {
          const newParams = structuredClone(modelObject());
          let changedParams;
          if (!modelObject()?.[key]) {
            const newArray = Array(arrayLength).fill();
            newArray[index] = value;
            changedParams = { [key]: newArray };
          } else if (modelObject()[key][index] !== value) {
            const newArray = [...modelObject()[key]];
            newArray[index] = value;
            changedParams = { [key]: newArray };
          }

          if (changedParams) {
            emit('input', Object.assign(newParams, changedParams));
            emit('propertyChange', changedParams);
          }
        },
      });
    });
}

/**
 * Creates a computed property that returns whether a specific key of the modelled object (value prop) is undefined or not. If set to true, the provided default value is applied to the key of the modelled object.
 * @param {function():T} modelObject Getter for the property that is modelled by the component and should be updated with input event, usually this is the 'value' prop.
 * @param {K} key The key of the modelObject that should be return on get and updated on set.
 * @param {function(string, unknown[]):void} emit The emit function of the component context that is using this composable.
 * @param {D} valueDefault  The defualt value that is set when `true` is provided to the setter of the computed property.
 * @returns {import('vue').WritableComputedRef<boolean>} A computed ref with a setter and a getter.
 * @template {Object} T
 * @template {string} K
 * @template D
 */
export function useHasProperty(modelObject, key, emit, valueDefault) {
  return computed({
    get() {
      return modelObject()?.[key] !== undefined;
    },
    set(value) {
      const newParams = structuredClone(modelObject());
      let changedParams;
      if (value) {
        changedParams = { [key]: valueDefault };
      } else {
        changedParams = { [key]: undefined };
      }
      emit('input', Object.assign(newParams, changedParams));
      emit('propertyChange', changedParams);
    },
  });
}
