import {
  type Collection,
  IndexedCollection,
  type MapCollection,
  type OverrideCollection,
  type ReplacedEvent,
  VcsEvent,
  type VcsObject,
  isOverrideCollection,
} from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  type ComputedRef,
  type Ref,
  computed,
  reactive,
  ref,
  shallowRef,
  watch,
} from 'vue';
import { parseBoolean, parseNumber } from '@vcsuite/parsers';
import { check, oneOf } from '@vcsuite/check';
import { validateAction } from '../../components/lists/VcsActionList.ts.vue';
import { sortByWeight } from '../buttonManager.js';
import {
  createListItemBulkAction,
  createListItemDeleteAction,
} from '../../actions/listActions.js';
import { sortByOwner } from '../navbarManager.js';
import type { VcsListItem } from '../../components/lists/listHelper.js';
import type { VcsAction } from '../../actions/actionHelper.js';
import type {
  ItemFilter,
  ItemMapping,
  MappingFunction,
  OwnedAction,
} from './collectionManager.js';
import type { vcsAppSymbol } from '../../pluginHelper.js';

type Pagination<T> = {
  initialize: () => Promise<void>;
  initialized: boolean;
  /** Total number of items. */
  totalCount: number;
  getPage: () => number;
  setPage: (page: number) => Promise<void>;
  getPageSize: () => number;
  setPageSize: (pageSize: number) => Promise<void>;
  getPageItems: () => T[];
  pageChanged: VcsEvent<number>;
  pageSizeChanged: VcsEvent<number>;
};

type PaginationOptions<T> = {
  /** Async loader returning items slice and total count. */
  getItems: (
    startIndex: number,
    count: number,
  ) => Promise<{ items: T[]; total: number }>;
  /** Initial page size. Defaults to 10. */
  defaultPageSize?: number;
  /** Initial page which is applied on initialize. */
  initialPage?: number;
};

/**
 * Create a simple pagination helper that loads items into the provided collection.
 * The collection is cleared and refilled whenever the page (or page size) changes.
 * @param collection - Target collection to populate.
 * @param options - Pagination options.
 */
function createPagination<T extends object>(
  collection: Collection<T>,
  { getItems, defaultPageSize = 10, initialPage = 1 }: PaginationOptions<T>,
): Pagination<T> {
  let initialized = false;
  let initializePromise: Promise<void>;
  let totalCount: number;
  let currentPage: number;
  let currentPageSize = defaultPageSize;

  const pageChanged = new VcsEvent<number>();
  const pageSizeChanged = new VcsEvent<number>();

  async function setPage(page: number, size?: number): Promise<void> {
    const pageSize = size || currentPageSize;

    if (currentPage === page && currentPageSize === pageSize) {
      return;
    }

    const prevPage = currentPage;
    const prevPageSize = currentPageSize;

    const result = await getItems((page - 1) * pageSize, pageSize);
    // If another request finished in the meantime, ignore the result (stale)
    if (currentPage !== prevPage || currentPageSize !== prevPageSize) {
      return;
    }
    const { items, total } = result;
    totalCount = total;
    collection.clear();
    items.forEach((i) => {
      collection.add(i);
    });

    currentPage = page;
    pageChanged.raiseEvent(currentPage);
    if (pageSize && pageSize !== currentPageSize) {
      currentPageSize = pageSize;
      pageSizeChanged.raiseEvent(currentPageSize);
    }
    if (!initialized) {
      initialized = true;
    }
  }

  return {
    initialize(): Promise<void> {
      if (initializePromise === undefined) {
        initializePromise = setPage(initialPage, defaultPageSize);
      }
      return initializePromise;
    },
    get initialized(): boolean {
      return initialized;
    },
    get totalCount(): number {
      if (!initialized) {
        throw new Error(
          'No initial request send yet. Please initialize/setPage first',
        );
      }
      return totalCount;
    },
    getPage(): number {
      if (!initialized) {
        throw new Error(
          'No initial request send yet. Please initialize/setPage first',
        );
      }
      return currentPage;
    },
    setPage,
    getPageSize(): number {
      return currentPageSize;
    },
    async setPageSize(size: number): Promise<void> {
      await setPage(1, size);
    },
    getPageItems(): T[] {
      if (!initialized) {
        throw new Error(
          'No initial request send yet. Please initialize/setPage first',
        );
      }
      return [...collection];
    },
    pageChanged,
    pageSizeChanged,
  };
}

export type CollectionComponentUiOptions<T> = {
  id?: string;
  title?: string;
  /** Only supported for IndexedCollections. Defaults to false */
  draggable?: boolean;
  /** Adds actions to rename items from the list. Sets a default titleChanged callback on all list items, which can be overwritten in the mapping function, if necessary. Defaults to false.*/
  renamable?: boolean;
  /** Adds actions to remove items from the list. Also adds a header action to delete selected, if selectable is set to true. Defaults to false. */
  removable?: boolean;
  /** Defaults to false */
  selectable?: boolean;
  /** Defaults to false */
  singleSelect?: boolean;
  /** Number of header action buttons rendered until overflow. Defaults to 2. */
  overflowCount?: number;
  /** Limit number of items in the rendered list (more items are rendered in an extra window). Defaults to 10. */
  limit?: number;
  /** Defaults to "list.deleteItem" */
  removeTitle?: string;
  /** Defaults to "list.delete" */
  bulkRemoveTitle?: string;
  /** Defaults to "list.renameItem" */
  renameTitle?: string;
  pagination?: PaginationOptions<T>;
};

export type CollectionComponentClassOptions<T extends object> =
  CollectionComponentUiOptions<T> & {
    collection: Collection<T>;
  };

export type CollectionComponentListItem = VcsListItem & {
  actions: (VcsAction & { weight?: number })[];
  clickedCallbacks: ((event: PointerEvent) => void)[];
  destroy: (() => void) | undefined;
  destroyFunctions: (() => void)[];
};

function destroyListItem(listItem: CollectionComponentListItem): void {
  listItem.destroyFunctions.forEach((cb) => {
    cb();
  });
  listItem.destroy?.();
}

/**
 * Renames the title of an item for VcsObject based items.
 */
function titleChanged(
  item: { properties?: Record<string, unknown> },
  listItem: VcsListItem,
  newTitle: string,
): void {
  if (!item.properties) {
    item.properties = {};
  }
  item.properties.title = newTitle;
  listItem.title = newTitle;
}

export function createSupportedMapMappingFunction<T extends object | VcsObject>(
  supportedMaps: string[] | ((item: unknown) => string[]),
  mapCollection: MapCollection,
): MappingFunction<T> {
  check(supportedMaps, oneOf([String], Function));

  return (item, _c, listItem) => {
    const mapNames =
      typeof supportedMaps === 'function' ? supportedMaps(item) : supportedMaps;
    if (mapCollection.activeMap) {
      listItem.disabled = !mapNames.includes(mapCollection.activeMap.className);
    } else {
      listItem.disabled = true;
    }
    listItem.destroyFunctions.push(
      mapCollection.mapActivated.addEventListener((map) => {
        listItem.disabled = !mapNames.includes(map.className);
      }),
    );
  };
}

/**
 * Manages one collection and creates a mirrored items array with ListItems.
 * Listens to all collection events and synchronizes changes to the items array.
 * The Collection Items will be transformed and filtered with the given itemMappings and itemFilter functions
 */
class CollectionComponentClass<T extends object | VcsObject = object> {
  private _collection: Collection<T> & { [isOverrideCollection]?: boolean };
  private _id: string;
  title: Ref<string | undefined>;
  open = ref(false);
  overflowCount: Ref<number>;
  limit: Ref<number>;
  private _draggable: Ref<boolean>;
  renamable: Ref<boolean>;
  removable: Ref<boolean>;
  selectable: Ref<boolean>;
  singleSelect: Ref<boolean>;
  private _owner: string | typeof vcsAppSymbol;
  private _actions = shallowRef<OwnedAction[]>([]);
  private _itemMappings: ItemMapping<T>[] = [];
  private _itemFilters: ItemFilter<T>[] = [];
  private _listItems: Ref<CollectionComponentListItem[]> = ref([]);
  selection: Ref<CollectionComponentListItem[]> = ref([]);
  private _actionTitles: {
    removeTitle: string;
    bulkRemoveTitle: string;
    renameTitle: string;
  };
  readonly pagination = shallowRef<Pagination<T> | undefined>();
  // eslint-disable-next-line class-methods-use-this
  private _removeBulkDeleteAction: () => void = () => {};
  private _resetWatchers: (() => void)[] = [];
  // eslint-disable-next-line class-methods-use-this
  private _destroyBulkDelete: () => void = () => {};
  private _listeners: (() => void)[] = [];

  constructor(
    options: CollectionComponentClassOptions<T>,
    owner: string | typeof vcsAppSymbol,
  ) {
    if (!options?.collection?.uniqueKey) {
      throw new Error(
        'CollectionComponentClassOptions requires a collection with mandatory key!',
      );
    }

    this._collection = options.collection;
    this._id = options.id || uuidv4();
    this.title = ref(options.title);
    this.overflowCount = ref(parseNumber(options.overflowCount, 2));
    this.limit = ref(parseNumber(options.limit, 10));
    this._draggable = ref(
      !!options.draggable && this._collection instanceof IndexedCollection,
    );
    this.renamable = ref(parseBoolean(options.renamable, false));
    this.removable = ref(parseBoolean(options.removable, false));
    this.selectable = ref(parseBoolean(options.selectable));
    this.singleSelect = ref(parseBoolean(options.singleSelect));
    this._owner = owner;

    this._actionTitles = {
      removeTitle: options.removeTitle ?? 'list.deleteItem',
      bulkRemoveTitle: options.bulkRemoveTitle ?? 'list.delete',
      renameTitle: options.renameTitle ?? 'list.renameItem',
    };

    if (options.pagination) {
      this.setPagination(options.pagination);
    }

    this._resetWatchers = [
      watch(this.renamable, (): void => {
        this.reset();
      }),
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
        (this._collection as OverrideCollection<T>).replaced.addEventListener(
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

  get id(): string {
    return this._id;
  }
  get collection(): Collection<T> {
    return this._collection;
  }
  get items(): Ref<CollectionComponentListItem[]> {
    return this._listItems;
  }
  get draggable(): Ref<boolean> {
    return this._draggable;
  }
  get owner(): string | typeof vcsAppSymbol {
    return this._owner;
  }

  getActions(): ComputedRef<VcsAction[]> {
    return computed(() => this._actions.value.map(({ action }) => action));
  }

  private _addBulkDeleteAction(): void {
    const { action, destroy } = createListItemBulkAction(this.selection, {
      name: this._actionTitles.bulkRemoveTitle,
      callback: (): void => {
        [...this.selection.value].forEach((listItem) => {
          this._collection.remove(this._collection.getByKey(listItem.name)!);
        });
        this.selection.value = [];
      },
    });
    this._destroyBulkDelete = destroy;
    const ownedAction = { action, owner: this._owner, weight: 100 };
    this.addActions([ownedAction]);

    this._removeBulkDeleteAction = (): void => {
      this.removeActions([ownedAction]);
    };
  }

  /**
   * uses the itemMappings to transform the given Item to an CollectionComponentListItem usable in the VcsList
   */
  private _transformItem(item: T): CollectionComponentListItem {
    const keyProperty = this._collection.uniqueKey!;
    const listItem = reactive<CollectionComponentListItem>({
      get name() {
        return item[keyProperty] as string;
      },
      title: ((item as VcsObject)?.properties?.title ||
        item[keyProperty]) as string,
      visible: (item as VcsObject)?.properties?.visible as boolean | undefined,
      disabled: (item as VcsObject)?.properties?.disabled as
        | boolean
        | undefined,
      tooltip: (item as VcsObject)?.properties?.tooltip as string | undefined,
      icon: (item as VcsObject)?.properties?.icon as string | undefined,
      hasUpdate: false,
      renamable: undefined,
      actions: [],
      clickedCallbacks: [],
      destroy: undefined,
      destroyFunctions: [],
    });
    if (this.renamable.value) {
      listItem.renamable = {
        name: this._actionTitles.renameTitle,
      };
      listItem.titleChanged = (newTitle: string): void => {
        titleChanged(item, listItem, newTitle);
      };
    }
    if (this.removable.value) {
      listItem.actions.push(
        createListItemDeleteAction(this._collection, item, {
          name: this._actionTitles.removeTitle,
        }),
      );
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
      .filter((action) => validateAction(action))
      .sort((a, b) =>
        sortByWeight(
          (a as VcsAction & { weight?: number }).weight,
          (b as VcsAction & { weight?: number }).weight,
        ),
      );
    return listItem;
  }

  /**
   * Inserts the listItem into the list items array at the correct relative position in respect to the position of the listItem
   * in the collection
   */
  private _insertListItem(listItem: CollectionComponentListItem): void {
    if (!this._listItems.value.some((i) => i.name === listItem.name)) {
      if (this._collection instanceof IndexedCollection) {
        const newItemIndex = this._collection.indexOfKey(listItem.name) || 0;
        if (newItemIndex === this._collection.size - 1) {
          this._listItems.value.push(listItem);
        } else {
          const positionInChildren = this._listItems.value.findIndex((elem) => {
            const treeViewItemIndex =
              (this._collection as IndexedCollection<T>).indexOfKey(
                elem.name,
              ) || 0;
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
   */
  private _handleItemAdded(item: T): void {
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
   */
  private _handleItemReplaced(replaced: ReplacedEvent<T>): void {
    const listItemHasUpdate = this.getListItemForItem(replaced.old)?.hasUpdate;
    const idx = this._listItems.value.findIndex(
      (l) => l.name === replaced.old[this.collection.uniqueKey!],
    );
    const selectedIdx = this.selection.value.findIndex(
      (l) => l.name === replaced.old[this.collection.uniqueKey!],
    );
    this._handleItemRemoved(replaced.old);
    if (selectedIdx > -1 || listItemHasUpdate !== undefined) {
      const addedListener = this._collection.added.addEventListener((added) => {
        if (added === replaced.new) {
          const newIdx = this.items.value.findIndex(
            (l) => l.name === added[this.collection.uniqueKey!],
          );
          const newListItem = this._listItems.value[newIdx];
          if (newListItem) {
            if (listItemHasUpdate !== undefined) {
              newListItem.hasUpdate = listItemHasUpdate;
            }
            if (newIdx !== idx) {
              this._listItems.value.splice(newIdx, 1);
              this._listItems.value.splice(idx, 0, newListItem);
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
   */
  private _handleItemMoved(item: T): void {
    if (
      this._itemFilters.every(({ filterFunction }) =>
        filterFunction(item, this),
      )
    ) {
      const index = this._listItems.value.findIndex(
        (elem) => elem.name === item[this._collection.uniqueKey!],
      );
      if (index > -1) {
        const listItem = this._listItems.value[index];
        this._listItems.value.splice(index, 1);
        this._insertListItem(listItem);
      }
    }
  }

  /**
   * synchronizes the collection items with the internal list items.
   */
  private _handleItemRemoved(item: T): void {
    const index = this._listItems.value.findIndex(
      (elem) => elem.name === item[this._collection.uniqueKey!],
    );
    if (index > -1) {
      const listItem = this._listItems.value[index];
      this.selection.value = this.selection.value.filter(
        (i) => i.name !== listItem.name,
      );
      destroyListItem(this._listItems.value[index]);
      this._listItems.value.splice(index, 1);
    }
  }

  getListItemForItem(item: T): CollectionComponentListItem | undefined {
    const itemKey = item[this._collection.uniqueKey!];
    return this.items.value.find((i) => i.name === itemKey);
  }

  /**
   * recreates the items array with the new Mapping Function
   */
  addItemMapping(itemMapping: ItemMapping<T>): void {
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
   */
  removeItemMapping(itemMapping: ItemMapping<T>): void {
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
   */
  addItemFilter(itemFilter: ItemFilter<T>): void {
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
   */
  removeItemFilter(itemFilter: ItemFilter<T>): void {
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

  addActions(ownedActions: OwnedAction[]): void {
    const actions = [...this._actions.value, ...ownedActions];
    this._actions.value = actions
      .filter((item, pos, self) => self.indexOf(item) === pos)
      .sort(
        (a, b) =>
          sortByWeight(a.weight, b.weight) || sortByOwner(a.owner, b.owner),
      );
  }

  removeActions(ownedActions: OwnedAction[]): void {
    this._actions.value = this._actions.value.filter(
      (ownedAction) => !ownedActions.includes(ownedAction),
    );
  }

  /**
   * removes itemMapping, itemFilter and actions of provided owner and resets all list items
   */
  removeOwner(owner: string | typeof vcsAppSymbol): void {
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

  setPagination(options?: PaginationOptions<T>): void {
    if (options) {
      this.pagination.value = createPagination(this.collection, options);
    } else {
      this.pagination.value = undefined;
      this.collection.clear();
    }
  }

  /**
   * resets this collection component by destroying all list items and
   * re-adding them from the collection applying current filter and mapping functions
   */
  reset(): void {
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

  destroy(): void {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._destroyBulkDelete();
    this._resetWatchers.forEach((cb) => {
      cb();
    });
    this._listItems.value.forEach(destroyListItem);
    this._listItems.value = [];
    this.selection.value = [];
  }
}

export default CollectionComponentClass;
