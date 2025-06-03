import { ref, computed } from 'vue';

/**
 * @enum {number}
 */
export const InsertMode = {
  BEFORE: -1,
  INTO: 0,
  AFTER: 1,
};

/**
 * @typedef { Object &
 *   (import('./VcsTreeNode.vue').VcsTreeNodeItem | import('./VcsListItemComponent.vue').VcsListItem)
 * } VcsDraggableItem
 */

/**
 * @typedef {{
 *  item: VcsDraggableItem,
 *  targetItem: VcsDraggableItem,
 *  targetIndex: number,
 *  position?: InsertMode
 * }} ItemMovedEvent
 * @property {VcsDraggableItem} item
 * @property {VcsDraggableItem} targetItem
 * @property {number} targetIndex @deprecated targetIndex is deprecated and will be removed on next mayor release. Use targetItem instead.
 * @property {InsertMode?} position
 */

/**
 * @typedef {{
 * dragging: import("vue").Ref<boolean>,
 *   isDraggable: import("vue").ComputedRef<boolean>,
 *   dragStart: (
 *     e: MouseEvent,
 *     item: VcsDraggableItem
 *   ) => void;
 *   dragOver: (
 *     e: MouseEvent,
 *     item: VcsDraggableItem,
 *     dropTarget: HTMLElement,
 *     dropTargetZones?: DropZones,
 *     isOpen?: boolean,
 *   ) => void;
 *   dragLeave: (e: MouseEvent) => void;
 *   dragEnd: (e: MouseEvent) => void;
 *   drop: (
 *     e: MouseEvent,
 *     item: VcsDraggableItem
 *   ) => void;
 * }} DraggableListOrTreeSetup
 */

/**
 * Defines the allowed drop zones for an item.
 * True allows all zones (3 for trees, 2 for lists), false prohibits dropping on the item.
 * Used for styling the item.
 * @typedef {{
 *   before:boolean,
 *   after:boolean,
 *   into?:boolean
 * }|boolean} DropZones
 * @property {boolean} before - allow insert before target
 * @property {boolean} after - allow insert after target
 * @property {boolean?} into - allow insert into target. Only available for tree, not for list!
 */

/**
 * A function defining the drop zones of a target item.
 * Provides item and targetItem to implement corresponding conditions.
 * Returns the allowed DropZones of the targetItem.
 * @typedef {(item: VcsDraggableItem,targetItem: VcsDraggableItem) => DropZones} DropTargetZonesFunction
 */

/**
 * Function setting up drag logic for lists or trees. Use only in setup function of components!
 * This requires items (VcsListItem or VcsTreeNode) with unique keys (name property).
 * @param {Object & { items: Array<VcsDraggableItem>, draggable: boolean, dropTargetZones?: DropTargetZonesFunction }} props
 * @param {import("vue").Ref<string>} query
 * @param {(event: 'itemMoved', value: ItemMovedEvent) => void} emit
 * @returns {DraggableListOrTreeSetup}
 */
export function setupDraggableListOrTree(props, query, emit) {
  const dragging = ref(false);
  /**
   * @type {VcsDraggableItem|null}
   */
  let draggedItem = null;
  /**
   *
   * @type {InsertMode|null}
   */
  let dropPosition = null;

  /**
   * @type {import("vue").ComputedRef<boolean>}
   */
  const isDraggable = computed(() => {
    return !query.value && props.draggable;
  });

  /**
   *
   * @param {HTMLElement} target
   */
  function clearDropTargetClasses(target) {
    target.classList.remove(
      'drop-target-before',
      'drop-target-after',
      'drop-target-into',
      'no-drop-allowed',
    );
  }

  /**
   * Add css classes to visualize drop targets on tue current dragover item
   * @param {MouseEvent} e
   * @param {HTMLElement} dropTarget
   * @param {DropZones} dropTargetZones
   * @param {boolean} isOpen
   */
  function addDropTargetClasses(e, dropTarget, dropTargetZones, isOpen) {
    const isAfterAllowed =
      dropTargetZones === true ||
      (typeof dropTargetZones === 'object' && dropTargetZones?.after !== false);
    const isBeforeAllowed =
      dropTargetZones === true ||
      (typeof dropTargetZones === 'object' &&
        dropTargetZones?.before !== false);
    const isIntoAllowed =
      dropTargetZones === true || dropTargetZones.into === true;

    const denominator = isIntoAllowed ? 4 : 2;
    const rect = dropTarget.getBoundingClientRect();
    const threshold = rect.height / denominator;
    const relativeY = e.clientY - rect.top;
    const { currentTarget } = /** @type {{ currentTarget: HTMLElement }} */ (e);

    e.dataTransfer.dropEffect = 'move';
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
    } else if (dropTargetZones === true || dropTargetZones.into === true) {
      dropPosition = InsertMode.INTO;
      currentTarget.classList.add('drop-target-into');
      e.dataTransfer.dropEffect = 'copy';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  }

  /**
   * @param {MouseEvent} e
   * @param {VcsDraggableItem} item
   */
  function drop(e, item) {
    if (isDraggable.value) {
      if (draggedItem && item && draggedItem !== item) {
        emit('itemMoved', {
          item: draggedItem,
          targetItem: item,
          position: dropPosition,
        });
      }
      draggedItem = null;
      dropPosition = null;
      dragging.value = false;
      clearDropTargetClasses(e.currentTarget);
    }
  }

  /**
   * @param {MouseEvent} e
   * @param {VcsDraggableItem} item
   */
  function dragStart(e, item) {
    e.stopPropagation();
    if (isDraggable.value) {
      draggedItem = item;
      e.dataTransfer.effectAllowed = 'all';
      dragging.value = true;
    }
  }

  /**
   * @param {MouseEvent} e
   * @param {VcsDraggableItem} item
   * @param {HTMLElement} dropTarget
   * @param {DropZones} [dropTargetZones=true]
   * @param {boolean} [isOpen=false]
   */
  function dragOver(
    e,
    item,
    dropTarget,
    dropTargetZones = true,
    isOpen = false,
  ) {
    e.stopPropagation();
    e.preventDefault();
    if (
      !isDraggable.value ||
      !dragging.value ||
      draggedItem?.name === item.name
    ) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    clearDropTargetClasses(e.currentTarget);
    addDropTargetClasses(
      e,
      dropTarget,
      props.dropTargetZones
        ? props.dropTargetZones(draggedItem, item)
        : dropTargetZones,
      isOpen,
    );
  }

  /**
   * @param {MouseEvent} e
   */
  function dragLeave(e) {
    e.stopPropagation();
    e.preventDefault();
    dropPosition = null;
    clearDropTargetClasses(e.currentTarget);
  }

  /**
   * @param {MouseEvent} e
   */
  function dragEnd(e) {
    e.stopPropagation();
    dropPosition = null;
    dragging.value = false;
  }

  return {
    dragging,
    isDraggable,
    dragStart,
    dragOver,
    dragLeave,
    dragEnd,
    drop,
  };
}

/**
 * Recursively searches for an item in a nested array and performs a splice operation
 * @param {Array<VcsDraggableItem>} array - The array to search in
 * @param {VcsDraggableItem} item - The item to find
 * @param {number} deleteCount - Number of items to delete
 * @param {InsertMode?} insertPosition - Default is inserting before provided item. Other options are after and into.
 * @param {...VcsDraggableItem} itemsToInsert - Items to insert
 * @returns {Array<VcsDraggableItem>|undefined} - The removed items or undefined if not found
 */
function findAndSplice(
  array,
  item,
  deleteCount,
  insertPosition,
  ...itemsToInsert
) {
  const index = array.findIndex((i) => i === item);

  if (index !== -1) {
    if (insertPosition === InsertMode.AFTER) {
      return array.splice(
        index + InsertMode.AFTER,
        deleteCount,
        ...itemsToInsert,
      );
    } else if (insertPosition === InsertMode.INTO) {
      array[index].children = array[index].children || [];
      array[index].children.push(...itemsToInsert);
      return array;
    }
    // delete or insert before
    return array.splice(index, deleteCount, ...itemsToInsert);
  }

  // Item not found at current level, search in children
  for (let i = 0; i < array.length; i++) {
    const node = array[i];
    if (node.children && node.children.length > 0) {
      const result = findAndSplice(
        node.children,
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
 * @param {Array<VcsDraggableItem>} items
 * @param {ItemMovedEvent} event
 */
export function moveDraggableItems(items, { item, targetItem, position }) {
  findAndSplice(items, item, 1);
  findAndSplice(items, targetItem, 0, position, item);
}
