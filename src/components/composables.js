import { computed } from 'vue';

/**
 * returns a computed which is true, if the provided attributes contain one or more
 * padding classes
 * @param {Object} attrs all the Attributes of the component
 * @returns {import("vue").ComputedRef<boolean>}
 */
export function usePadding(attrs) {
  return computed(() => {
    if (attrs.class) {
      const classes = attrs.class.split(' ');
      return classes.some((c) => {
        return /^p[tblrsexyac]-.*/.test(c);
      });
    }
    return false;
  });
}

/**
 * returns only the slotNames which are not excluded as a computed.
 * @param {import("vue").Slots} slots
 * @param {Array<string>} exclude
 * @returns {import("vue").ComputedRef<Array<string>>}
 */
export function useForwardSlots(slots, exclude = []) {
  return computed(() => {
    return Object.keys(slots).filter((slotName) => !exclude.includes(slotName));
  });
}
