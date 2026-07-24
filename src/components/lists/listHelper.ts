import { computed, isReactive, reactive, shallowRef, watch } from 'vue';
import type { ComputedRef, Ref, ShallowRef, UnwrapNestedRefs } from 'vue';
import type { VcsAction } from '../../actions/actionHelper.js';
import type { VcsListItem } from './VcsListItemComponent.ts.vue';

export function createSelectionActions(
  items: Ref<VcsListItem[]>,
  selected: ShallowRef<VcsListItem[]>,
  emit: (
    event: 'update:modelValue',
    value: UnwrapNestedRefs<VcsListItem[]>,
  ) => void,
): VcsAction[] {
  const selectAllAction = reactive({
    name: 'list.selectAll',
    tooltip: 'list.selectAll',
    disabled: computed(() => items.value.length - selected.value.length < 1),
    callback(): void {
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
    callback(): void {
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

export type SelectableListProps = {
  selectable?: boolean;
  singleSelect?: boolean;
  selectFunction?: (item: VcsListItem, event: PointerEvent) => void;
  modelValue?: VcsListItem[];
};

export type SelectableListSetup = {
  selected: ShallowRef<VcsListItem[]>;
  select: (item: VcsListItem, event: PointerEvent) => void;
  selectionActions: VcsAction[];
};

export function setupSelectableList(
  props: SelectableListProps,
  renderingItems: ComputedRef<VcsListItem[]>,
  emit: (
    event: 'update:modelValue',
    value: UnwrapNestedRefs<VcsListItem[]>,
  ) => void,
): SelectableListSetup {
  const selected = shallowRef<VcsListItem[]>([]);

  watch(
    props,
    () => {
      if (selected.value !== props.modelValue) {
        selected.value = props.modelValue || [];
      }
      if (props.singleSelect && selected.value.length > 1) {
        selected.value
          .filter((i, index) => index && i.selectionChanged)
          .forEach((i) => i.selectionChanged?.(false));
        selected.value = [selected.value[0]];
        emit('update:modelValue', selected.value);
      }
      if (!props.selectable && selected.value.length > 0) {
        selected.value
          .filter((i) => i.selectionChanged)
          .forEach((i) => i.selectionChanged?.(false));
        selected.value = [];
        emit('update:modelValue', selected.value);
      }
    },
    { immediate: true, deep: false },
  );

  const selectionActions = createSelectionActions(
    renderingItems,
    selected,
    emit,
  );

  let firstSelected = selected.value.at(0);

  return {
    selected,
    select:
      props.selectFunction ||
      ((item, event): void => {
        if (!props.selectable || item.disabled) {
          return;
        }
        if (!isReactive(item)) {
          throw new Error('Trying to select an unreactive item');
        }
        if (Array.isArray(item.clickedCallbacks)) {
          item.clickedCallbacks.forEach((cb) => {
            cb(event);
          });
        }
        if (props.singleSelect) {
          if (selected.value[0] === item) {
            item.selectionChanged?.(false);
            selected.value = [];
            firstSelected = undefined;
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
              .forEach((i) => i.selectionChanged?.(false));
            selected.value = [];
            firstSelected = undefined;
          }
        } else if (selected.value.includes(item)) {
          if (event.ctrlKey) {
            item.selectionChanged?.(false);
            selected.value = selected.value.filter((i) => i !== item);
          } else if (selected.value.length > 1) {
            selected.value
              .filter((i) => i !== item && i.selectionChanged)
              .forEach((i) => {
                i.selectionChanged?.(false);
              });
            selected.value = [item];
            firstSelected = item;
          } else {
            item.selectionChanged?.(false);
            selected.value = [];
            firstSelected = undefined;
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
            .forEach((i) => i.selectionChanged?.(false));
          item.selectionChanged?.(true);
          selected.value = [item];
          firstSelected = item;
        }

        emit('update:modelValue', selected.value);
      }),
    selectionActions,
  };
}
