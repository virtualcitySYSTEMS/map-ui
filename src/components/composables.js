import { computed, nextTick, ref, watch } from 'vue';

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

/**
 * @param {import("vue").ComputedRef<HTMLElement|undefined>} parent
 * @param {import("vue").ComputedRef<string|undefined>} tooltip
 * @param {import("vue").ComputedRef<string|undefined>} title
 * @returns {import("vue").ComputedRef<string>}
 */
export function createEllipseTooltip(parent, tooltip, title) {
  const offsetWidth = ref(0);
  const scrollWidth = ref(0);

  watch([parent, title], async () => {
    const elem = parent.value;
    if (elem) {
      await nextTick(() => {
        offsetWidth.value = elem.offsetWidth;
        scrollWidth.value = elem.scrollWidth;
      });
    } else {
      offsetWidth.value = 0;
      scrollWidth.value = 0;
    }
  });

  return computed(() => {
    if (tooltip.value) {
      return tooltip.value;
    }
    if (title.value && offsetWidth.value < scrollWidth.value) {
      return title.value;
    }
    return '';
  });
}
