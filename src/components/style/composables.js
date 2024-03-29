import { computed } from 'vue';

/**
 * Computes a color object from a color array.
 * @param {function():Array<number>} colorGetter Getter that returns an array containing rgba values.
 * @returns {import("vue").ComputedRef<{r: number, g: number, b: number, a: number}>} An object with rgba keys.
 */
export function useColorObject(colorGetter) {
  return computed(() => {
    const rgbaArray = colorGetter();
    if (rgbaArray) {
      return {
        r: rgbaArray[0],
        g: rgbaArray[1],
        b: rgbaArray[2],
        a: rgbaArray[3],
      };
    } else {
      return { r: 255, g: 255, b: 255, a: 0 };
    }
  });
}

/**
 * Checks if a value is in a value range.
 * @param {number} value Value checked to see if it is in the allowed range.
 * @param {number[]} range Min and max value
 * @returns {boolean} If value is between min and max.
 */
export function between(value, range) {
  return value >= range[0] && value <= range[1];
}

/**
 * Creates a computed property with a getter and a setter for a specific object property/key of the value prop. If the value prop is an object, this composable allows to pass this computed to an v-model of a sub component. The getter returns the value of the key or, if it is undefined, a default value. The setter merges the passed value with the other object properties of the value prop and emits the whole object as a input event.
 * @param {function():T} modelObject Getter for the property that is modelled by the component and should be updated with input event, usually this is the 'value' prop.
 * @param {K} key The key of the modelObject that should be return on get and updated on set.
 * @param {U} defaultValue Default value for the key of the modelObject.
 * @param {function(string, ...unknown[]):void} emit The emit function of the component context that is using this composable.
 * @param {Array<number>} [range] The allowed range of numbers.
 * @param {boolean} [isRequired] If value is required.
 * @returns {import("vue").WritableComputedRef<T[K]>} The value to the key param if the getter is called.
 * @template {Object} T
 * @template {string} K
 * @template U
 */
export function useSelectedKey(
  modelObject,
  key,
  defaultValue,
  emit,
  range,
  isRequired,
) {
  return computed({
    get() {
      if (modelObject()?.[key] === undefined && isRequired) {
        return defaultValue;
      }
      return modelObject()?.[key];
    },
    set(value) {
      if (
        ((value === null || value === undefined) && isRequired) ||
        (value !== null &&
          value !== undefined &&
          range &&
          !between(value, range))
      ) {
        return;
      }
      const newModelObject = structuredClone(modelObject());
      // is needed to get e.g. from square shape to x by setting radius2 from 0 to undefined
      const newValue = value === '' ? undefined : value;
      emit('input', Object.assign(newModelObject, { [key]: newValue }));
    },
  });
}

/**
 * Creates a string from a color object.
 * @param {{r: number, g: number, b: number, a: number}} rgbaObject An object with rgba keys.
 * @returns {string} A string looking like this: rgba(0,0,0,0).
 */
export function rgbaObjectToString(rgbaObject) {
  return `rgba(${Object.values(rgbaObject).toString()})`;
}
