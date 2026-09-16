import { type ComputedRef, type Ref, computed, ref } from 'vue';
import type { IndexedCollection, vcsLayerName } from '@vcmap/core';
import type { VcsListItem } from './listHelper.js';
import type { VcsTreeNodeItem } from './treeHelper.js';

export const wmsLayerName = Symbol('wmsLayerName');

export enum InsertMode {
  BEFORE = -1,
  INTO = 0,
  AFTER = 1,
}

export type VcsDraggableItem = Record<string, unknown> &
  (VcsTreeNodeItem | VcsListItem) & {
    [vcsLayerName]?: string;
    [wmsLayerName]?: string;
  };

export type ItemMovedEvent<
  T extends VcsDraggableItem | string = VcsDraggableItem,
> = { item: T; targetItem: T; position?: InsertMode };

/**
 * Defines the allowed drop zones for an item.
 * True allows all zones (3 for trees, 2 for lists), false prohibits dropping on the item.
 * Used for styling the item.
 *  */
export type DropZones =
  | {
      /** allow insert before target */
      before?: boolean;
      /** allow insert after target */
      after?: boolean;
      /** allow insert into target. Only available for tree, not for list! */
      into?: boolean;
    }
  | boolean;

type DraggableListOrTreeSetup = {
  dragging: Ref<boolean>;
  isDraggable: ComputedRef<boolean>;
  dragStart: (e: DragEvent, item: VcsDraggableItem) => void;
  dragOver: (
    e: DragEvent,
    item: VcsDraggableItem,
    dropTarget: HTMLElement,
    dropTargetZones?: DropZones,
    isOpen?: boolean,
  ) => void;
  dragEnd: (e: DragEvent) => void;
  drop: (e: DragEvent, item: VcsDraggableItem) => void;
};

/**
 * A function defining the drop zones of a target item.
 * Provides item and targetItem to implement corresponding conditions.
 * Returns the allowed DropZones of the targetItem.
 */
export type DropTargetZonesFunction = (
  item: VcsDraggableItem,
  targetItem: VcsDraggableItem,
) => DropZones;

/**
 * Function setting up drag logic for lists or trees. Use only in setup function of components!
 * This requires items (VcsListItem or VcsTreeNode) with unique keys (name property).
 */
export function setupDraggableListOrTree(
  props: Record<string, unknown> & {
    items: Array<VcsDraggableItem>;
    draggable: boolean;
    dropTargetZones?: DropTargetZonesFunction;
  },
  query: Ref<string>,
  emit: (event: 'itemMoved', value: ItemMovedEvent) => void,
): DraggableListOrTreeSetup {
  const dragging = ref(false);
  let draggedItem: VcsDraggableItem | null = null;
  let dropPosition: InsertMode | null = null;
  let lastDropTarget: HTMLElement | null = null;

  const isDraggable = computed<boolean>(() => !query.value && props.draggable);

  function clearDropTargetClasses(target: HTMLElement): void {
    target.classList.remove(
      'drop-target-before',
      'drop-target-after',
      'drop-target-into',
      'no-drop-allowed',
    );
  }

  /**
   * Add css classes to visualize drop targets on the current dragover item
   */
  function addDropTargetClasses(
    e: DragEvent,
    dropTarget: HTMLElement,
    dropTargetZones: DropZones,
    isOpen?: boolean,
  ): void {
    const isAfterAllowed =
      dropTargetZones === true ||
      (typeof dropTargetZones === 'object' &&
        (!('after' in dropTargetZones) || dropTargetZones.after));
    const isBeforeAllowed =
      dropTargetZones === true ||
      (typeof dropTargetZones === 'object' &&
        (!('before' in dropTargetZones) || dropTargetZones.before));
    const isIntoAllowed =
      dropTargetZones === true ||
      (typeof dropTargetZones === 'object' && dropTargetZones?.into === true);

    const denominator = isIntoAllowed ? 4 : 2;
    const rect = dropTarget.getBoundingClientRect();
    const threshold = rect.height / denominator;
    const relativeY = e.clientY - rect.top;
    const currentTarget = e.currentTarget as HTMLElement;

    e.dataTransfer!.dropEffect = 'move';
    if (isBeforeAllowed && relativeY < threshold) {
      dropPosition = InsertMode.BEFORE;
      currentTarget.classList.add('drop-target-before');
    } else if (
      isAfterAllowed &&
      relativeY >= (denominator - 1) * threshold &&
      !isOpen
    ) {
      dropPosition = InsertMode.AFTER;
      currentTarget.classList.add('drop-target-after');
    } else if (isIntoAllowed) {
      dropPosition = InsertMode.INTO;
      currentTarget.classList.add('drop-target-into');
      e.dataTransfer!.dropEffect = 'copy';
    } else {
      e.dataTransfer!.dropEffect = 'none';
    }
  }

  function drop(e: DragEvent, item: VcsDraggableItem): void {
    if (isDraggable.value) {
      if (draggedItem && item && draggedItem !== item) {
        emit('itemMoved', {
          item: draggedItem,
          targetItem: item,
          position: dropPosition ?? undefined,
        });
      }
      draggedItem = null;
      dropPosition = null;
      dragging.value = false;
      clearDropTargetClasses(e.currentTarget as HTMLElement);
    }
  }

  function dragStart(e: DragEvent, item: VcsDraggableItem): void {
    e.stopPropagation();
    if (isDraggable.value) {
      draggedItem = item;
      e.dataTransfer!.effectAllowed = 'all';
      dragging.value = true;
    }
  }

  function dragOver(
    e: DragEvent,
    item: VcsDraggableItem,
    dropTarget: HTMLElement,
    dropTargetZones: DropZones = true,
    isOpen = false,
  ): void {
    e.stopPropagation();
    e.preventDefault();
    if (
      (!isDraggable.value ||
        !dragging.value ||
        draggedItem?.name === item.name) &&
      e.dataTransfer
    ) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    if (lastDropTarget !== e.currentTarget) {
      if (lastDropTarget) {
        clearDropTargetClasses(lastDropTarget);
      }
      lastDropTarget = e.currentTarget as HTMLElement;
    }

    clearDropTargetClasses(e.currentTarget as HTMLElement);
    addDropTargetClasses(
      e,
      dropTarget,
      props.dropTargetZones
        ? props.dropTargetZones(draggedItem!, item)
        : dropTargetZones,
      isOpen,
    );
  }

  function dragEnd(e: DragEvent): void {
    e.stopPropagation();
    dropPosition = null;
    dragging.value = false;
    if (lastDropTarget) {
      clearDropTargetClasses(lastDropTarget);
      lastDropTarget = null;
    }
  }

  return {
    dragging,
    isDraggable,
    dragStart,
    dragOver,
    dragEnd,
    drop,
  };
}

/**
 * Recursively searches for an item in a nested array and performs a splice operation
 * @param array - The array to search in
 * @param item - The item to find
 * @param deleteCount - Number of items to delete
 * @param insertPosition - Default is inserting before provided item. Other options are after and into.
 * @param itemsToInsert - Items to insert
 * @returns The removed items or undefined if not found
 */
function findAndSplice<T extends VcsDraggableItem | string>(
  array: T[],
  item: T,
  deleteCount: number,
  insertPosition?: InsertMode,
  ...itemsToInsert: T[]
): T[] | undefined {
  const index = array.indexOf(item);

  if (index !== -1) {
    if (insertPosition === InsertMode.AFTER) {
      return array.splice(
        index + InsertMode.AFTER,
        deleteCount,
        ...itemsToInsert,
      );
    } else if (insertPosition === InsertMode.INTO) {
      // LayerSwap.vue prevents strings from being dropped into.
      (array[index] as VcsTreeNodeItem).children =
        (array[index] as VcsTreeNodeItem).children || [];
      (array[index] as VcsTreeNodeItem).children!.push(
        ...(itemsToInsert as VcsDraggableItem[]),
      );
      return array;
    }
    // delete or insert before
    return array.splice(index, deleteCount, ...itemsToInsert);
  }

  // Item not found at current level, search in children
  for (let i = 0; i < array.length; i++) {
    const node = array[i];
    if (
      (node as VcsTreeNodeItem).children &&
      (node as VcsTreeNodeItem).children!.length > 0
    ) {
      const result = findAndSplice<T>(
        (node as VcsTreeNodeItem).children as T[],
        item,
        deleteCount,
        insertPosition,
        ...itemsToInsert,
      );

      if (result !== undefined) {
        return result; // Item was found in this subtree
      }
    }
  }

  // Item not found
  return undefined;
}

/**
 * A function moving items of a nested tree. Can be used for VcsTreeView @item-moved
 * @example
 * <VcsTreeView @item-moved="moveDraggableItems(items,$event)" />
 */
export function moveDraggableItems<
  T extends VcsDraggableItem | string = VcsDraggableItem,
>(items: T[], { item, targetItem, position }: ItemMovedEvent<T>): void {
  findAndSplice<T>(items, item, 1);
  findAndSplice<T>(items, targetItem, 0, position, item);
}

/**
 * Moves an item to a new position.
 * New position is derived from a target item in the collection.
 * This ensures correct movement, if rendered list is only a subset of the collection.
 */
export function moveItem<T>(
  collection: IndexedCollection<T>,
  event: ItemMovedEvent,
): void {
  if (collection.moveTo) {
    const item = collection.getByKey(event.item.name)!;
    const target = collection.getByKey(event.targetItem.name)!;

    const itemIndex = collection.indexOf(item);
    const targetIndex = collection.indexOf(target);
    const relativePosition =
      itemIndex < targetIndex ? InsertMode.BEFORE : InsertMode.AFTER;
    const offset = relativePosition === event.position ? event.position : 0;
    collection.moveTo(item, targetIndex + offset);
  }
}
