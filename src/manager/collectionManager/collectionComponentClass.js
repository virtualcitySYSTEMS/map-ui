import { IndexedCollection, isOverrideCollection } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import { v4 as uuidv4 } from 'uuid';
import { computed, ref, watch } from 'vue';
import { parseBoolean, parseNumber } from '@vcsuite/parsers';
import { validateAction } from '../../components/lists/VcsActionList.vue';
import { sortByWeight } from '../buttonManager.js';
import {
  createListItemBulkAction,
  createListItemDeleteAction,
  createListItemRenameAction,
} from '../../actions/listActions.js';
import { sortByOwner } from '../navbarManager.js';

/**
 * @typedef {Object} CollectionComponentUiOptions
 * @property {string} [id]
 * @property {string} [title]
 * @property {boolean} [draggable=false] - only supported for IndexedCollections
 * @property {boolean} [renamable=false] - adds actions to rename items from list. Sets a default titleChanged callback on all list items, which can be overwritten in the mapping function, if necessary.
 * @property {boolean} [removable=false] - adds actions to remove items from list. Also adds a header action to delete selected, if selectable is set to true.
 * @property {boolean} [selectable=false]
 * @property {boolean} [singleSelect=false]
 * @property {number} [overflowCount=2] - number of header action buttons rendered until overflow
 * @property {number} [limit=10] - limit number of items in rendered list (more items are rendered in extra window)
 */

/**
 * @typedef {CollectionComponentUiOptions & {
 *   collection: import("@vcmap/core").Collection<T>
 * }} CollectionComponentClassOptions
 * @template {Object} T
 */

/**
 * @typedef {import("../../components/lists/VcsList.vue").VcsListItem & {
 *   actions: Array<import("../../actions/actionHelper.js").VcsAction & { weight?: number }>,
 *   clickedCallbacks: Array<function(PointerEvent):void>,
 *   destroy: function():void|undefined
 *   destroyFunctions: Array<function():void>
 * }} CollectionComponentListItem
 */

/**
 * @param {CollectionComponentListItem} listItem
 */
function destroyListItem(listItem) {
  listItem.destroyFunctions.forEach((cb) => cb());
  listItem.destroy?.();
}

/**
 * Renames the title of an item for VcsObject based items.
 * @param {import("@vcmap/core").VcsObject} item
 * @param {import("../../components/lists/VcsList").VcsListItem} listItem
 * @param {string} newTitle
 */
function titleChanged(item, listItem, newTitle) {
  if (!item.properties) {
    item.properties = {};
  }
  item.properties.title = newTitle;
  listItem.title = newTitle;
}

/**
 * Manages one collection and creates a mirrored items array with ListItems.
 * Listens to all collection events and synchronizes changes to the items array.
 * The Collection Items will be transformed and filtered with the given itemMappings and itemFilter functions
 * @class
 * @template {Object|import("@vcmap/core").VcsObject} T
 */
class CollectionComponentClass {
  /**
   * @param {CollectionComponentClassOptions<T>} options
   * @param {string|import("../../pluginHelper.js").vcsAppSymbol} owner
   */
  constructor(options, owner) {
    if (!options?.collection?.uniqueKey) {
      throw new Error(
        'CollectionComponentClassOptions requires a collection with mandatory key!',
      );
    }

    /**
     * @type {import("@vcmap/core").Collection<T>}
     * @private
     */
    this._collection = options.collection;
    /**
     * @type {string}
     * @private
     */
    this._id = options.id || uuidv4();
    /**
     * @type {import("vue").Ref<string>}
     */
    this.title = ref(options.title);
    /**
     * @type {import("vue").Ref<boolean>}
     */
    this.open = ref(false);
    /**
     *
     * @type {import("vue").Ref<number>}
     */
    this.overflowCount = ref(parseNumber(options.overflowCount, 2));
    /**
     *
     * @type {import("vue").Ref<number>}
     */
    this.limit = ref(parseNumber(options.limit, 10));
    /**
     * @type {import("vue").Ref<boolean>}
     * @private
     */
    this._draggable = ref(
      options.draggable && this._collection instanceof IndexedCollection,
    );
    /**
     * @type {import("vue").Ref<boolean>}
     */
    this.renamable = ref(parseBoolean(options.renamable, false));
    /**
     * @type {import("vue").Ref<boolean>}
     */
    this.removable = ref(parseBoolean(options.removable, false));
    /**
     * @type {import("vue").Ref<boolean>}
     */
    this.selectable = ref(parseBoolean(options.selectable));
    /**
     * @type {import("vue").Ref<boolean>}
     */
    this.singleSelect = ref(parseBoolean(options.singleSelect));
    /**
     * @type {string|vcsAppSymbol}
     * @private
     */
    this._owner = owner;

    /**
     * @type {import("vue").Ref<Array<import("./collectionManager.js").OwnedAction>>}
     */
    this._actions = ref([]);
    /**
     * @type {Array<import("./collectionManager.js").ItemMapping<T>>}
     * @private
     */
    this._itemMappings = [];
    /**
     * @type {Array<import("./collectionManager.js").ItemFilter<T>>}
     * @private
     */
    this._itemFilters = [];
    /**
     * @type {import("vue").Ref<Array<CollectionComponentListItem>>}
     * @private
     */
    this._listItems = ref([]);
    /**
     * @type {import("vue").Ref<Array<CollectionComponentListItem>>}
     */
    this.selection = ref([]);

    this._resetWatchers = [
      watch(this.renamable, () => this.reset()),
      watch([this.removable, this.selectable], () => {
        if (this.removable.value && this.selectable.value) {
          this._addBulkDeleteAction();
        } else {
          this._removeBulkDeleteAction();
        }
        this.reset();
      }),
      watch(this._draggable, () => {
        if (!(this._collection instanceof IndexedCollection)) {
          getLogger('CollectionComponentClass').warning(
            'draggable can only be set to IndexedCollections!',
          );
          this._draggable.value = false;
        }
      }),
    ];
    this._destroyBulkDelete = () => {};
    if (this.removable.value && this.selectable.value) {
      this._addBulkDeleteAction();
    }

    this._listeners = [
      this._collection.added.addEventListener(this._handleItemAdded.bind(this)),
      this._collection.removed.addEventListener(
        this._handleItemRemoved.bind(this),
      ),
    ];

    if (this._collection[isOverrideCollection]) {
      this._listeners.push(
        this._collection.replaced.addEventListener(
          this._handleItemReplaced.bind(this),
        ),
      );
    }

    if (this._collection instanceof IndexedCollection) {
      this._listeners.push(
        this._collection.moved.addEventListener(
          this._handleItemMoved.bind(this),
        ),
      );
    }
    this.reset();
  }

  /**
   * @type {string}
   */
  get id() {
    return this._id;
  }

  /**
   * @type {import("@vcmap/core").Collection<T>}
   */
  get collection() {
    return this._collection;
  }

  /**
   * @type {import("vue").Ref<Array<CollectionComponentListItem>>}
   */
  get items() {
    return this._listItems;
  }

  /**
   * @type {import("vue").Ref<boolean>}
   */
  get draggable() {
    return this._draggable;
  }

  /**
   * @param {boolean} value
   * @deprecated
   */
  set draggable(value) {
    getLogger('CollectionComponentClass').deprecate('set draggable');
    this._draggable.value = value;
  }

  /**
   * @type {string|import("../../pluginHelper.js").vcsAppSymbol}
   */
  get owner() {
    return this._owner;
  }

  /**
   * @returns {import("vue").ComputedRef<import("../../actions/actionHelper.js").VcsAction[]>}
   */
  getActions() {
    return computed(() => this._actions.value.map(({ action }) => action));
  }

  /**
   * @private
   */
  _addBulkDeleteAction() {
    const { action, destroy } = createListItemBulkAction(this.selection, {
      name: 'list.delete',
      callback: () => {
        [...this.selection.value].forEach((listItem) => {
          this._collection.remove(this._collection.getByKey(listItem.name));
        });
      },
    });
    this._destroyBulkDelete = destroy;
    this.addActions([
      {
        action,
        owner: this._owner,
        weight: 100,
      },
    ]);
  }

  /**
   * @private
   */
  _removeBulkDeleteAction() {
    this._destroyBulkDelete();
    const action = this._actions.value.find(
      (a) => a.action.name === 'list.delete',
    );
    if (action) {
      this.removeActions([action]);
    }
  }

  /**
   * uses the itemMappings to transform the given Item to an CollectionComponentListItem usable in the VcsList
   * @param {T} item
   * @returns {CollectionComponentListItem}
   * @template T
   * @private
   */
  _transformItem(item) {
    const keyProperty = this._collection.uniqueKey;
    const listItem = {
      get name() {
        return item[keyProperty];
      },
      title: item?.properties?.title || item[keyProperty],
      visible: item?.properties?.visible,
      disabled: item?.properties?.disabled,
      tooltip: item?.properties?.tooltip,
      icon: item?.properties?.icon,
      hasUpdate: false,
      rename: false,
      actions: [],
      clickedCallbacks: [],
      destroy: undefined,
      destroyFunctions: [],
    };
    if (this.renamable.value) {
      listItem.actions.push(createListItemRenameAction(listItem));
      listItem.titleChanged = (newTitle) =>
        titleChanged(item, listItem, newTitle);
    }
    if (this.removable.value) {
      listItem.actions.push(createListItemDeleteAction(this._collection, item));
    }
    this._itemMappings.forEach((itemMapping) => {
      if (
        itemMapping.predicate === undefined ||
        itemMapping.predicate(item, this)
      ) {
        itemMapping.mappingFunction(item, this, listItem);
      }
    });
    listItem.actions = listItem.actions
      .filter((action) => {
        return validateAction(action);
      })
      .sort((a, b) => sortByWeight(a.weight, b.weight));
    return listItem;
  }

  /**
   * Inserts the listItem into the list items array at the correct relative position in respect to the position of the listItem
   * in the collection
   * @param {CollectionComponentListItem} listItem
   * @private
   */
  _insertListItem(listItem) {
    if (!this._listItems.value.some((i) => i.name === listItem.name)) {
      if (this._collection instanceof IndexedCollection) {
        const newItemIndex = this._collection.indexOfKey(listItem.name);
        if (newItemIndex === this._collection.size - 1) {
          this._listItems.value.push(listItem);
        } else {
          const positionInChildren = this._listItems.value.findIndex((elem) => {
            const treeViewItemIndex = this._collection.indexOfKey(elem.name);
            return newItemIndex < treeViewItemIndex;
          });
          if (positionInChildren >= 0) {
            this._listItems.value.splice(positionInChildren, 0, listItem);
          } else {
            this._listItems.value.push(listItem);
          }
        }
      } else {
        this._listItems.value.push(listItem);
      }
    }
  }

  /**
   * synchronizes the collection items with the internal items list.
   * @param {T} item
   * @template T
   * @private
   */
  _handleItemAdded(item) {
    if (
      this._itemFilters.every(({ filterFunction }) =>
        filterFunction(item, this),
      )
    ) {
      const listItem = this._transformItem(item);
      this._insertListItem(listItem);
    }
  }

  /**
   * synchronizes the collection items with the internal items list by preserving previous selection
   * @param {import("@vcmap/core").ReplacedEvent<T>} replaced
   * @private
   */
  _handleItemReplaced(replaced) {
    const listItemHasUpdate = this.getListItemForItem(replaced.old)?.hasUpdate;
    const selectedIdx = this.selection.value.findIndex(
      (l) => l.name === replaced.old[this.collection.uniqueKey],
    );
    this._handleItemRemoved(replaced.old);
    if (selectedIdx > -1 || listItemHasUpdate !== undefined) {
      const addedListener = this._collection.added.addEventListener((added) => {
        if (added === replaced.new) {
          const newListItem = this.items.value.find(
            (l) => l.name === added[this.collection.uniqueKey],
          );
          if (newListItem) {
            if (listItemHasUpdate !== undefined) {
              newListItem.hasUpdate = listItemHasUpdate;
            }
            if (selectedIdx > -1) {
              this.selection.value.splice(selectedIdx, 0, newListItem);
            }
          }
          addedListener();
        }
      });
    }
  }

  /**
   * Synchronizes the order of the list items with respect to the order of the items in the collection.
   * Removes and reinserts the moved item.
   * Ensures selection and hasUpdate.
   * @param {T} item
   * @template T
   * @private
   */
  _handleItemMoved(item) {
    if (
      this._itemFilters.every(({ filterFunction }) =>
        filterFunction(item, this),
      )
    ) {
      const index = this._listItems.value.findIndex((elem) => {
        return elem.name === item[this._collection.uniqueKey];
      });
      if (index > -1) {
        const listItem = this._listItems.value[index];
        this._listItems.value.splice(index, 1);
        this._insertListItem(listItem);
      }
    }
  }

  /**
   * synchronizes the collection items with the internal list items.
   * @param {T} item
   * @template T
   * @private
   */
  _handleItemRemoved(item) {
    const index = this._listItems.value.findIndex((elem) => {
      return elem.name === item[this._collection.uniqueKey];
    });
    if (index > -1) {
      const listItem = this._listItems.value[index];
      const selectionIdx = this.selection.value.indexOf(listItem);
      if (selectionIdx > -1) {
        this.selection.value.splice(selectionIdx, 1);
      }
      destroyListItem(this._listItems.value[index]);
      this._listItems.value.splice(index, 1);
    }
  }

  /**
   * @param {T} item
   * @template T
   * @returns {CollectionComponentListItem|undefined}
   */
  getListItemForItem(item) {
    const itemKey = item[this._collection.uniqueKey];
    return this.items.value.find((i) => i.name === itemKey);
  }

  /**
   * recreates the items array with the new Mapping Function
   * @param {import("./collectionManager.js").ItemMapping<T>} itemMapping
   */
  addItemMapping(itemMapping) {
    if (
      !this._itemMappings.find(({ mappingFunction, owner }) => {
        return (
          itemMapping.mappingFunction === mappingFunction &&
          itemMapping.owner === owner
        );
      })
    ) {
      this._itemMappings.push(itemMapping);
      this.reset();
    }
  }

  /**
   * recreates the items array with the new Mapping Function
   * @param {import("./collectionManager.js").ItemMapping<T>} itemMapping
   */
  removeItemMapping(itemMapping) {
    const index = this._itemMappings.findIndex(({ mappingFunction, owner }) => {
      return (
        itemMapping.mappingFunction === mappingFunction &&
        itemMapping.owner === owner
      );
    });
    if (index > -1) {
      this._itemMappings.splice(index, 1);
      this.reset();
    }
  }

  /**
   * recreates the items array with the new Filter Function
   * @param {import("./collectionManager.js").ItemFilter<T>} itemFilter
   */
  addItemFilter(itemFilter) {
    if (
      !this._itemFilters.find(({ filterFunction, owner }) => {
        return (
          itemFilter.filterFunction === filterFunction &&
          itemFilter.owner === owner
        );
      })
    ) {
      this._itemFilters.push(itemFilter);
      this.reset();
    }
  }

  /**
   * recreates the items array with the new Filter Function
   * @param {import("./collectionManager.js").ItemFilter<T>} itemFilter
   */
  removeItemFilter(itemFilter) {
    const index = this._itemFilters.findIndex(({ filterFunction, owner }) => {
      return (
        itemFilter.filterFunction === filterFunction &&
        itemFilter.owner === owner
      );
    });
    if (index > -1) {
      this._itemFilters.splice(index, 1);
      this.reset();
    }
  }

  /**
   * @param {Array<import("./collectionManager.js").OwnedAction>} ownedActions
   */
  addActions(ownedActions) {
    const actions = [...this._actions.value, ...ownedActions];
    this._actions.value = actions
      .filter((item, pos, self) => {
        return self.indexOf(item) === pos;
      })
      .sort(
        (a, b) =>
          sortByWeight(a.weight, b.weight) || sortByOwner(a.owner, b.owner),
      );
  }

  /**
   * @param {Array<import("./collectionManager.js").OwnedAction>} ownedActions
   */
  removeActions(ownedActions) {
    this._actions.value = this._actions.value.filter((ownedAction) => {
      return !ownedActions.includes(ownedAction);
    });
  }

  /**
   * removes itemMapping, itemFilter and actions of provided owner and resets all list items
   * @param {string | symbol} owner
   */
  removeOwner(owner) {
    const itemMappings = this._itemMappings.filter((itemMapping) => {
      return itemMapping.owner !== owner;
    });
    const itemFilters = this._itemFilters.filter((itemFilter) => {
      return itemFilter.owner !== owner;
    });
    const actions = this._actions.value.filter(
      (ownedAction) => ownedAction.owner !== owner,
    );
    if (
      itemMappings.length < this._itemMappings.length ||
      itemFilters.length < this._itemFilters.length
    ) {
      this.reset();
    }
    this._itemMappings = itemMappings;
    this._itemFilters = itemFilters;
    this._actions.value = actions;
  }

  /**
   * resets this collection component by destroying all list items and
   * re-adding them from the collection applying current filter and mapping functions
   */
  reset() {
    this._listItems.value.forEach(destroyListItem);
    this._listItems.value = [];
    this.selection.value = [];
    [...this._collection]
      .filter((item) =>
        this._itemFilters.every(({ filterFunction }) =>
          filterFunction(item, this),
        ),
      )
      .map((item) => this._transformItem(item))
      .forEach((listItem) => this._listItems.value.push(listItem));
  }

  destroy() {
    this._listeners.forEach((cb) => cb());
    this._destroyBulkDelete();
    this._resetWatchers.forEach((cb) => cb());
    this._listItems.value.forEach(destroyListItem);
    this._listItems.value = [];
    this.selection.value = [];
  }
}

export default CollectionComponentClass;
