import type { ComputedRef, Slots, WritableComputedRef } from 'vue';
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';

/**
 * returns a computed which is true, if the provided attributes contain one or more
 * padding classes
 * @param attrs all the Attributes of the component
 */
export function usePadding(
  attrs: Record<string, unknown>,
): ComputedRef<boolean> {
  return computed(() => {
    if (attrs.class) {
      const classes = (attrs.class as string).split(' ');
      return classes.some((c) => {
        return /^p[tblrsexyac]-.*/.test(c);
      });
    }
    return false;
  });
}

/**
 * returns only the slotNames which are not excluded as a computed.
 */
export function getForwardSlots(
  slots: Slots,
  exclude: string[] = [],
): string[] {
  return Object.keys(slots).filter((slotName) => !exclude.includes(slotName));
}

let intersectionObserver: IntersectionObserver | null = null;
const observedTargets = new WeakMap<
  HTMLElement,
  WritableComputedRef<boolean>
>();

/**
 * if the visibility of the element changes, the computed ref will be set.
 */
function registerTargetWithIntersectionObserver(
  elem: HTMLElement,
  visible: WritableComputedRef<boolean>,
): () => void {
  if (!intersectionObserver) {
    intersectionObserver = new IntersectionObserver((targets) => {
      targets.forEach((target) => {
        const visibilityRef = observedTargets.get(target.target as HTMLElement);
        if (visibilityRef) {
          visibilityRef.value = target.isIntersecting;
        }
      });
    });
  }
  intersectionObserver.observe(elem);
  observedTargets.set(elem, visible);
  return (): void => {
    intersectionObserver?.unobserve(elem);
    observedTargets.delete(elem);
  };
}

export function createEllipseTooltip(
  parent: ComputedRef<HTMLElement | undefined>,
  tooltip: ComputedRef<string | undefined>,
  title: ComputedRef<string | undefined>,
): ComputedRef<string> {
  const offsetWidth = ref(0);
  const scrollWidth = ref(0);
  const visibleValue = ref(false);
  const visible = computed({
    get: () => visibleValue.value,
    set: (value) => {
      visibleValue.value = value;
    },
  });
  let observerListener = (): void => {};
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
        offsetWidth.value = parent.value?.offsetWidth ?? 0;
        scrollWidth.value = parent.value?.scrollWidth ?? 0;
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

let componentIdCounter = 0;

/**
 * Returns a globally unique vcs component id string
 */
export function useComponentId(): string {
  componentIdCounter += 1;
  return `vcs-${componentIdCounter}`;
}
