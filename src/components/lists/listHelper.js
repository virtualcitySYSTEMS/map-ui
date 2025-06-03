import { computed, isReactive, reactive, ref, shallowRef, watch } from 'vue';
import { getLogger } from '@vcsuite/logger';

/**
 * @param {import("vue").Ref<import("./VcsListItemComponent.vue").VcsListItem[]>} items
 * @param {import("vue").ShallowRef<import("./VcsListItemComponent.vue").VcsListItem[]>} selected
 * @param {(event: 'update:modelValue', value: import("./VcsListItemComponent.vue").VcsListItem[]) => void} emit
 * @returns {Array<import("../../actions/actionHelper.js").VcsAction>}
 */
export function createSelectionActions(items, selected, emit) {
  const selectAllAction = reactive({
    name: 'list.selectAll',
    tooltip: 'list.selectAll',
    disabled: computed(() => items.value.length - selected.value.length < 1),
    callback() {
      const currentSelection = [...selected.value];
      selected.value = items.value.filter((item) => !item.disabled);

      selected.value.forEach((item) => {
        if (item.selectionChanged && !currentSelection.includes(item)) {
          item.selectionChanged(true);
        }
      });
      emit('update:modelValue', selected.value);
    },
  });

  const clearSelectionAction = reactive({
    name: 'list.clearSelection',
    tooltip: 'list.clearSelection',
    disabled: computed(() => selected.value.length < 1),
    callback() {
      [...selected.value].forEach((item) => {
        if (item.selectionChanged) {
          item.selectionChanged(false);
        }
      });
      selected.value = [];
      emit('update:modelValue', selected.value);
    },
  });

  return [selectAllAction, clearSelectionAction];
}

/**
 * @typedef {Object & {
 * selectable?: boolean,
 * singleSelect?: boolean,
 * selectFunction?: (item: import("vue").UnwrapNestedRefs<import("./VcsListItemComponent.vue").VcsListItem>, event: PointerEvent) => void,
 * modelValue?: Array<import("./VcsListItemComponent.vue").VcsListItem> }
 * } SelectableListProps
 * @property {boolean?} selectable
 * @property {boolean?} singleSelect
 * @property {(item: import("vue").UnwrapNestedRefs<import("./VcsListItemComponent.vue").VcsListItem>, event: PointerEvent) => void} selectFunction
 * @property {Array<import("./VcsListItemComponent.vue").VcsListItem>?} modelValue
 */

/**
 * @typedef {{
 *   selected: import("vue").ShallowRef<Array<import("./VcsListItemComponent.vue").VcsListItem>>,
 *   select: (item: import("vue").UnwrapNestedRefs<import("./VcsListItemComponent.vue").VcsListItem>, event: PointerEvent) => void,
 *   selectionActions:Array<import("../../actions/actionHelper.js").VcsAction>
 * }} SelectableListSetup
 */

/**
 * Function setting up selection logic for lists. Use only in setup function of components!
 * This requires VcsListItems with unique keys (name property).
 * @param {Object & SelectableListProps} props
 * @param {import("vue").ComputedRef<Array<import("./VcsListItemComponent.vue").VcsListItem>>} renderingItems
 * @param {(event: 'update:modelValue', value: import("./VcsListItemComponent.vue").VcsListItem[]) => void} emit
 * @returns {SelectableListSetup}
 */
export function setupSelectableList(props, renderingItems, emit) {
  /** @type {import("vue").ShallowRef<Array<import("./VcsListItemComponent.vue").VcsListItem>>} */
  const selected = shallowRef([]);

  watch(
    props,
    () => {
      if (selected.value !== props.modelValue) {
        selected.value = props.modelValue;
      }
      if (props.singleSelect && selected.value.length > 1) {
        selected.value
          .filter((i, index) => index && i.selectionChanged)
          .forEach((i) => i.selectionChanged(false));
        selected.value = [selected.value[0]];
        emit('update:modelValue', selected);
      }
      if (!props.selectable && selected.value.length > 0) {
        selected.value
          .filter((i) => i.selectionChanged)
          .forEach((i) => i.selectionChanged(false));
        selected.value = [];
        emit('update:modelValue', selected);
      }
    },
    { immediate: true, deep: false },
  );

  const selectionActions = createSelectionActions(
    renderingItems,
    selected,
    emit,
  );

  let firstSelected;

  return {
    selected,
    select:
      props.selectFunction ||
      ((item, event) => {
        if (!props.selectable || item.disabled) {
          return;
        }
        if (!isReactive(item)) {
          throw new Error('Trying to select an unreactive item');
        }
        if (Array.isArray(item.clickedCallbacks)) {
          item.clickedCallbacks.forEach((cb) => cb(event));
        }
        if (props.singleSelect) {
          if (selected.value[0] === item) {
            item.selectionChanged?.(false);
            selected.value = [];
            firstSelected = null;
          } else {
            selected.value[0]?.selectionChanged?.(false);
            item.selectionChanged?.(true);
            selected.value = [item];
            firstSelected = item;
          }
        } else if (event.shiftKey) {
          let firstIndex = 0;
          if (firstSelected) {
            firstIndex = renderingItems.value.indexOf(firstSelected);
          }
          const currentIndex = renderingItems.value.indexOf(item);
          if (firstIndex > -1 && currentIndex > -1) {
            const currentSelection = [...selected.value];
            selected.value = renderingItems.value.slice(
              Math.min(firstIndex, currentIndex),
              Math.max(firstIndex, currentIndex) + 1,
            );
            currentSelection.forEach((oldItem) => {
              if (
                oldItem.selectionChanged &&
                !selected.value.includes(oldItem)
              ) {
                oldItem.selectionChanged(false);
              }
            });
            selected.value.forEach((newItem) => {
              if (
                newItem.selectionChanged &&
                !currentSelection.includes(newItem)
              ) {
                newItem.selectionChanged(true);
              }
            });
          } else {
            selected.value
              .filter((i) => i !== item && i.selectionChanged)
              .forEach((i) => i.selectionChanged(false));
            selected.value = [];
            firstSelected = null;
          }
        } else if (selected.value.includes(item)) {
          if (event.ctrlKey) {
            item.selectionChanged?.(false);
            selected.value = selected.value.filter((i) => i !== item);
          } else if (selected.value.length > 1) {
            selected.value
              .filter((i) => i !== item && i.selectionChanged)
              .forEach((i) => {
                i.selectionChanged(false);
              });
            selected.value = [item];
            firstSelected = item;
          } else {
            item.selectionChanged?.(false);
            selected.value = [];
            firstSelected = null;
          }
        } else if (event.ctrlKey) {
          item.selectionChanged?.(true);
          selected.value = [...selected.value, item];
          if (selected.value.length === 1) {
            firstSelected = item;
          }
        } else {
          selected.value
            .filter((i) => i !== item && i.selectionChanged)
            .forEach((i) => i.selectionChanged(false));
          item.selectionChanged?.(true);
          selected.value = [item];
          firstSelected = item;
        }

        emit('update:modelValue', selected.value);
      }),
    selectionActions,
  };
}

/**
 * @typedef {{
 *   hovering: import("vue").Ref<number|undefined>,
 *   dragging: import("vue").Ref<number|undefined>,
 *   isDraggable: import("vue").ComputedRef<boolean>,
 *   borderBottom: (index: number) => boolean,
 *   borderTop: (index: number) => boolean,
 *   dragStart: (
 *     e: MouseEvent,
 *     item: import('./VcsListItemComponent.vue').VcsListItem,
 *     index: number,
 *   ) => void;
 *   dragOver: (e: MouseEvent, index: number) => void;
 *   dragLeave: (e: MouseEvent) => void;
 *   dragEnd: (e: MouseEvent) => void;
 *   drop: (e: MouseEvent, targetIndex: number) => void;
 * }} DraggableListSetup
 */

/**
 * Function setting up drag logic for lists. Use only in setup function of components!
 * This requires VcsListItems with unique keys (name property).
 * @param {Object & { draggable: boolean }} props
 * @param {import("vue").Ref<string>} query
 * @param {(event: 'itemMoved', value: import("./dragHelper.js").ItemMovedEvent) => void} emit
 * @returns {DraggableListSetup}
 * @deprecated This function is deprecated and will be removed in version 7. Use setupDraggableListOrTree from dragHelper.js instead.
 */
export function setupDraggableList(props, query, emit) {
  getLogger('listHelper.js').deprecate(
    'setupDraggableList',
    'Use setupDraggableListOrTree instead.',
  );

  /** @type {import("vue").Ref<number|undefined>} */
  const hovering = ref(undefined);
  /** @type {import("vue").Ref<number|undefined>} */
  const dragging = ref(undefined);

  /**
   * @param {number} index
   * @returns {boolean}
   */
  function borderBottom(index) {
    return (
      dragging.value !== undefined &&
      dragging.value < index &&
      index === hovering.value
    );
  }

  /**
   * @param {number} index
   * @returns {boolean}
   */
  function borderTop(index) {
    return (
      dragging.value !== undefined &&
      dragging.value > index &&
      index === hovering.value
    );
  }

  /**
   * @type {import("./VcsListItemComponent.vue").VcsListItem|null}
   */
  let draggedItem = null;

  /**
   * @type {import("vue").ComputedRef<boolean>}
   */
  const isDraggable = computed(() => {
    return !query.value && props.draggable;
  });

  /**
   * @param {MouseEvent} e
   * @param {number} targetIndex
   */
  function drop(e, targetIndex) {
    if (isDraggable.value) {
      if (draggedItem !== null && targetIndex !== undefined) {
        emit('itemMoved', { item: draggedItem, targetIndex });
      }
      draggedItem = null;
      dragging.value = undefined;
      hovering.value = undefined;
    }
  }

  /**
   * @param {MouseEvent} e
   * @param {import("./VcsListItemComponent.vue").VcsListItem} item
   * @param {number} index
   */
  function dragStart(e, item, index) {
    e.stopPropagation();
    if (isDraggable.value) {
      dragging.value = index;
      draggedItem = item;
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  /**
   * @param {MouseEvent} e
   * @param {number} index
   */
  function dragOver(e, index) {
    e.stopPropagation();
    e.preventDefault();
    if (isDraggable.value) {
      hovering.value = index;
    }
  }

  /**
   * @param {MouseEvent} e
   */
  function dragLeave(e) {
    e.stopPropagation();
    e.preventDefault();
    hovering.value = undefined;
  }

  /**
   * @param {MouseEvent} e
   */
  function dragEnd(e) {
    e.stopPropagation();
    dragging.value = undefined;
    hovering.value = undefined;
  }

  return {
    hovering,
    dragging,
    isDraggable,
    borderBottom,
    borderTop,
    dragStart,
    dragOver,
    dragLeave,
    dragEnd,
    drop,
  };
}
