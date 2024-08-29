import { computed, nextTick, onUnmounted, ref, watch } from 'vue';

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

let intersectionObserver = null;
/** @type {WeakMap<WeakKey<HTMLElement>, import("vue").ComputedRef<boolean>>} */
const observedTargets = new WeakMap();

/**
 * if the visibility of the element changes, the computed ref will be set.
 * @param {HTMLElement} elem
 * @param {import("vue").ComputedRef<boolean>} visible
 * @returns {() => void}}
 */
function registerTargetWithIntersectionObserver(elem, visible) {
  if (!intersectionObserver) {
    intersectionObserver = new IntersectionObserver((targets) => {
      targets.forEach((target) => {
        const visibilityRef = observedTargets.get(target.target);
        if (visibilityRef) {
          visibilityRef.value = target.isIntersecting;
        }
      });
    });
  }
  intersectionObserver.observe(elem);
  observedTargets.set(elem, visible);
  return () => {
    intersectionObserver.unobserve(elem);
    observedTargets.delete(elem);
  };
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
  const visible = ref(false);
  let observerListener = () => {};
  watch(visible, () => {
    if (visible.value && parent.value) {
      offsetWidth.value = parent.value.offsetWidth;
      scrollWidth.value = parent.value.scrollWidth;
    } else {
      offsetWidth.value = 0;
      scrollWidth.value = 0;
    }
  });
  watch(
    parent,
    () => {
      observerListener();
      visible.value = false;
      const elem = parent.value;
      if (elem) {
        if (elem.checkVisibility()) {
          visible.value = true;
        } else {
          observerListener = registerTargetWithIntersectionObserver(
            elem,
            visible,
          );
        }
      }
    },
    { immediate: true },
  );

  watch(title, async () => {
    if (visible.value) {
      await nextTick(() => {
        offsetWidth.value = parent.value.offsetWidth;
        scrollWidth.value = parent.value.scrollWidth;
      });
    }
  });

  onUnmounted(() => {
    observerListener();
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
