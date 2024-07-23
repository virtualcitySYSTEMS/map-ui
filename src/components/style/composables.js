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
 * Creates a string from a color object.
 * @param {{r: number, g: number, b: number, a: number}} rgbaObject An object with rgba keys.
 * @returns {string} A string looking like this: rgba(0,0,0,0).
 */
export function rgbaObjectToString(rgbaObject) {
  return `rgba(${Object.values(rgbaObject).toString()})`;
}
