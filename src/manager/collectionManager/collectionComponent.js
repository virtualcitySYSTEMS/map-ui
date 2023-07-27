import { IndexedCollection, isOverrideCollection } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import { v4 as uuidv4 } from 'uuid';
import { computed, ref } from 'vue';
import { parseNumber } from '@vcsuite/parsers';
import { validateAction } from '../../components/lists/VcsActionList.vue';
import { sortByWeight } from '../buttonManager.js';

/**
 * @typedef {Object} CollectionComponentUiOptions
 * @property {string} [id]
 * @property {string} [title]
 * @property {boolean} [draggable] - only supported for IndexedCollections
 * @property {boolean} [selectable]
 * @property {boolean} [singleSelect]
 * @property {number} [overflowCount=2] - number of header action buttons rendered until overflow
 * @property {number} [limit=10] - limit number of items in rendered list (more items are rendered in extra window)
 */

/**
 * @typedef {CollectionComponentUiOptions} CollectionComponentOptions
 * @property {import("@vcmap/core").Collection<T>} collection
 * @template {Object} T
 */

/**
 * Manages one collection and creates a mirrored items array with ListItems.
 * Listens to all collection events and synchronizes changes to the items array.
 * The Collection Items will be transformed and filtered with the given itemMappings and itemFilter functions
 * @class
 * @template {Object|VcsObject} T
 */
class CollectionComponent {
  /**
   * @param {CollectionComponentOptions} options
   * @param {string|vcsAppSymbol} owner
   */
  constructor(options, owner) {
    if (!options?.collection?.uniqueKey) {
      throw new Error(
        'CollectionComponentOptions requires a collection with mandatory key!',
      );
    }

    /**
     * @type {Collection<T>}
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
    this.selectable = ref(options.selectable);
    /**
     * @type {import("vue").Ref<boolean>}
     */
    this.singleSelect = ref(options.singleSelect);
    /**
     * @type {string|vcsAppSymbol}
     * @private
     */
    this._owner = owner;

    /**
     * @type {import("vue").Ref<Array<OwnedAction>>}
     */
    this._actions = ref([]);
    /**
     * @type {Array<ItemMapping<*>>}
     * @private
     */
    this._itemMappings = [];
    /**
     * @type {Array<ItemFilter<*>>}
     * @private
     */
    this._itemFilters = [];
    /**
     * @type {import("vue").Ref<Array<import("@vcmap/ui").VcsListItem & { destroy: (function():void)|undefined }>>}
     * @private
     */
    this._listItems = ref([]);
    /**
     * @type {import("vue").Ref<Array<import("@vcmap/ui").VcsListItem & { destroy: (function():void)|undefined }>>}
     */
    this.selection = ref([]);

    this._listeners = [
      this._collection.added.addEventListener(this._handleItemAdded.bind(this)),
      this._collection.removed.addEventListener(
        this._handleItemRemoved.bind(this),
      ),
    ];

    if (this._collection[isOverrideCollection]) {
      this._listeners.push(
        this._collection.replaced.addEventListener((replacedEvent) => {
          this._handleItemRemoved(replacedEvent.old);
        }),
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
   * @readonly
   */
  get id() {
    return this._id;
  }

  /**
   * @type {Collection<*>}
   * @readonly
   */
  get collection() {
    return this._collection;
  }

  /**
   * @type {import("vue").Ref<Array<import("@vcmap/ui").VcsListItem & { destroy: (function():void)|undefined }>>}
   * @readonly
   */
  get items() {
    return this._listItems;
  }

  /**
   * @type {import("vue").Ref<boolean>}
   * @readonly
   */
  get draggable() {
    return this._draggable;
  }

  /**
   * @param {boolean} value
   */
  set draggable(value) {
    if (this._collection instanceof IndexedCollection) {
      getLogger('CollectionComponent').warn(
        'draggable can only be set to IndexedCollections!',
      );
      return;
    }
    this._draggable.value = value;
  }

  /**
   * @type {string|vcsAppSymbol}
   * @readonly
   */
  get owner() {
    return this._owner;
  }

  /**
   * @returns {import("vue").ComputedRef<VcsAction[]>}
   */
  getActions() {
    return computed(() => this._actions.value.map(({ action }) => action));
  }

  /**
   * uses the itemMappings to transform the given Item to an VcsListItem usable in the VcsList
   * @param {T} item
   * @returns {import("@vcmap/ui").VcsListItem & { destroy: (function():void)|undefined }}
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
      hasUpdate: item?.properties?.hasUpdate,
      actions: [],
    };
    this._itemMappings.forEach((itemMapping) => {
      if (
        itemMapping.predicate === undefined ||
        itemMapping.predicate(item, this)
      ) {
        itemMapping.mappingFunction(item, this, listItem);
      }
    });
    listItem.actions = listItem.actions.filter((action) => {
      return validateAction(action);
    });
    return listItem;
  }

  /**
   * Inserts the listItem into the list items array at the correct relative position in respect to the position of the listItem
   * in the collection
   * @param {import("@vcmap/ui").VcsListItem} listItem
   * @private
   */
  _insertListItem(listItem) {
    if (!this._listItems.value.includes(listItem)) {
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
   * synchronizes the category items with the internal items list.
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
   * synchronizes the order of the list items with respect to the order of the items in the collection.
   * removes and reinserts the moved item.
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
      if (listItem.destroy) {
        listItem.destroy();
      }
      this._listItems.value.splice(index, 1);
    }
  }

  /**
   * recreates the items array with the new Mapping Function
   * @param {ItemMapping} itemMapping
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
   * @param {ItemMapping} itemMapping
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
   * @param {ItemFilter} itemFilter
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
   * @param {ItemFilter} itemFilter
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
   * @param {Array<OwnedAction>} ownedActions
   */
  addActions(ownedActions) {
    const actions = [...this._actions.value, ...ownedActions];
    this._actions.value = actions
      .filter((item, pos, self) => {
        return self.indexOf(item) === pos;
      })
      .sort(sortByWeight);
  }

  /**
   * @param {Array<OwnedAction>} ownedActions
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
    this._listItems.value.forEach((i) => i.destroy?.());
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
    this._listItems.value.forEach((i) => i.destroy?.());
    this._listItems.value = [];
    this.selection.value = [];
  }
}

export default CollectionComponent;
