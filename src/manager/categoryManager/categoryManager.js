import { reactive } from 'vue';
import { moduleIdSymbol, IndexedCollection, VcsEvent } from '@vcmap/core';
import { check } from '@vcsuite/check';
import { sortByOwner } from '../navbarManager.js';
import {
  validateAction,
  validateActions,
} from '../../components/lists/VcsActionList.vue';

/**
 * @callback MappingFunction
 * @param {T} item
 * @param {import("@vcmap/core").Category<T>} category
 * @param {import("@vcmap/ui").VcsListItem & { destroy: (function():void)|undefined }} listItem - you can add a destroy callback for cleanup
 * @template {Object} T
 */

/**
 * @callback PredicateFunction
 * @param {T} item
 * @param {import("@vcmap/core").Category<T>} category
 * @returns {boolean}
 * @template {Object} T
 */

/**
 * @typedef {Object} ItemMapping
 * @property {MappingFunction<T>} mappingFunction
 * @property {PredicateFunction<T>} predicate
 * @property {Array<string>} categoryNames
 * @property {string | symbol} owner
 * @template T
 */

/**
 * @typedef {Object} ManagedCategory
 * @property {string} categoryName
 * @property {string} title
 * @property {Array<VcsAction>} actions
 * @property {Array<VcsListItem & { destroy: (function():void|undefined) }>} items
 * @property {boolean} draggable
 * @property {boolean} selectable
 * @property {boolean} singleSelect
 * @property {Array<VcsListItem>} selection
 * @property {function():void} destroy - called when the item is destroyed. do not call yourself, remove the category from the manager
 */

/**
 * @typedef {Object} ManagedCategoryOptions
 * @property {string} categoryName
 * @property {boolean} [draggable] - only allowed for categories with underlying IndexedCollections
 * @property {boolean} [selectable]
 * @property {boolean} [singleSelect]
 * @property {Array<VcsAction>} [actions]
 */

/**
 * uses the itemMappings to transform the given Item to an VcsListItem usable in the VcsList
 * @param {T} item
 * @param {import("@vcmap/core").Category<T>} category
 * @param {Array<ItemMapping<T>>} itemMappings
 * @returns {import("@vcmap/ui").VcsListItem & { destroy: (function():void)|undefined }}
 * @template T
 * @private
 */
function transformItem(item, category, itemMappings) {
  const keyProperty = category.collection.uniqueKey;
  const listItem = {
    get id() {
      return item[keyProperty];
    },
    title: item?.properties?.title || item[keyProperty],
    actions: [],
  };
  itemMappings.forEach((itemMapping) => {
    if (itemMapping.predicate(item, category)) {
      itemMapping.mappingFunction(item, category, listItem);
    }
  });
  listItem.actions = listItem.actions.filter((action) => {
    return validateAction(action);
  });
  return listItem;
}

/**
 * Inserts the item into the items array at the correct relative position in respect to the position of the item
 * in the collection
 * @param {import("@vcmap/ui").VcsListItem} item
 * @param {import("@vcmap/core").Collection} collection
 * @param {Array<import("@vcmap/ui").VcsListItem>} items
 * @private
 */
function insertItem(item, collection, items) {
  if (!items.includes(item)) {
    if (collection instanceof IndexedCollection) {
      const newItemIndex = collection.indexOfKey(item.id);
      if (newItemIndex === collection.size - 1) {
        items.push(item);
      } else {
        const positionInChildren = items.findIndex((listItem) => {
          const treeViewItemIndex = collection.indexOfKey(listItem.id);
          return newItemIndex < treeViewItemIndex;
        });
        if (positionInChildren >= 0) {
          items.splice(positionInChildren, 0, item);
        } else {
          items.push(item);
        }
      }
    } else {
      items.push(item);
    }
  }
}

/**
 * @param {ManagedCategoryOptions} current
 * @param {ManagedCategoryOptions} next
 * @returns {ManagedCategoryOptions}
 */
function reduceCategoryOptions(current, next) {
  if (next.actions?.length > 0) {
    current.actions.push(...next.actions);
  }
  current.draggable = current.draggable ?? next.draggable;
  current.selectable = current.selectable ?? next.selectable;
  current.singleSelect = current.singleSelect ?? next.singleSelect;
  return current;
}

/**
 * a categoryManager manages categories, and synchronizes a tree of VcsTreeView Items.
 * provides an API to add/remove Categories.
 * @implements {VcsComponentManager<ManagedCategory, ManagedCategoryOptions>}
 */
class CategoryManager {
  /**
   * @param {import("@vcmap/ui").VcsUiApp} app
   */
  constructor(app) {
    /**
     * @type {import("@vcmap/ui").VcsUiApp}
     * @private
     */
    this._app = app;

    /**
     * @type {Map<string, Map<string|symbol, ManagedCategoryOptions>>}
     * @private
     */
    this._managedCategoryOptions = new Map();

    /**
     * @type {function():void}
     * @private
     */
    this._dynamicModuleIdListener =
      this._app.dynamicModuleIdChanged.addEventListener((id) => {
        this._dynamicModuleId = id;
        this._resetManagedCategories();
      });

    /**
     * @type {function():void}
     * @private
     */
    this._appCategoriesRemovedListener =
      this._app.categories.removed.addEventListener((category) => {
        this._removeCategory(category.name);
      });

    /**
     * @type {string}
     * @private
     */
    this._dynamicModuleId = this._app.dynamicModuleId;

    /**
     * @type {Array<ItemMapping<*>>}
     * @private
     */
    this._itemMappings = [];
    /**
     * @type {Map<string, ManagedCategory>}
     * @private
     */
    this._managedCategories = new Map();
    /**
     * @type {Array<string>}
     */
    this.componentIds = [];
    /**
     * @type {VcsEvent<ManagedCategory>}
     */
    this.added = new VcsEvent();
    /**
     * @type {VcsEvent<ManagedCategory>}
     */
    this.removed = new VcsEvent();
  }

  /**
   * synchronizes the category items with the internal items list.
   * @param {T} item
   * @param {import("@vcmap/core").Category<T>} category
   * @template T
   * @private
   */
  _handleItemAdded(item, category) {
    const itemMappings = this._itemMappings.filter((itemMapping) => {
      return itemMapping.categoryNames.includes(category.name);
    });
    const listItem = transformItem(item, category, itemMappings);
    const managedCategory = this.get(category.name);
    if (managedCategory) {
      insertItem(listItem, category.collection, managedCategory.items);
    }
  }

  /**
   * synchronizes the order of the treeViewItems with respect to the order of the items in the collection.
   * removes and reinserts the moved item.
   * @param {T} item
   * @param {import("@vcmap/core").Category<T>} category
   * @template T
   * @private
   */
  _handleItemMoved(item, category) {
    const managedCategory = this.get(category.name);
    if (managedCategory) {
      const index = managedCategory.items.findIndex((elem) => {
        return elem.id === item[category.collection.uniqueKey];
      });
      if (index > -1) {
        const listItem = managedCategory.items[index];
        managedCategory.items.splice(index, 1);
        insertItem(listItem, category.collection, managedCategory.items);
      }
    }
  }

  /**
   * synchronizes the category items with the internal items list.
   * @param {T} item
   * @param {import("@vcmap/core").Category<T>} category
   * @template T
   * @private
   */
  _handleItemRemoved(item, category) {
    const managedCategory = this.get(category.name);
    if (managedCategory) {
      const index = managedCategory.items.findIndex((elem) => {
        return elem.id === item[category.collection.uniqueKey];
      });
      if (index > -1) {
        const listItem = managedCategory.items[index];
        if (listItem.destroy) {
          listItem.destroy();
        }
        managedCategory.items.splice(index, 1);
      }
    }
  }

  /**
   * removes all items from all categories and rebuilds the item tree depending on the ModuleId
   * @private
   */
  _resetManagedCategories() {
    this._managedCategoryOptions.forEach((value, categoryName) => {
      this._resetCategoryItems(categoryName);
    });
  }

  /**
   * @param {string} categoryName
   * @private
   */
  _resetCategoryItems(categoryName) {
    const category = this._app.categories.getByKey(categoryName);
    const managedCategory = this.get(categoryName);

    if (category && managedCategory) {
      const itemMappings = this._itemMappings.filter((itemMapping) => {
        return itemMapping.categoryNames.includes(categoryName);
      });
      if (managedCategory.selection.length > 0) {
        managedCategory.selection = [];
      }
      managedCategory.items.forEach((item) => {
        if (item.destroy) {
          item.destroy();
        }
      });
      managedCategory.items = [...category.collection]
        .filter((item) => {
          return item[moduleIdSymbol] === this._dynamicModuleId;
        })
        .map((item) => {
          return transformItem(item, category, itemMappings);
        });
    }
  }

  /**
   * create the managed category
   * @param {string} categoryName
   * @returns {ManagedCategory}
   * @private
   */
  _createManagedCategory(categoryName) {
    const category = this._app.categories.getByKey(categoryName);
    if (!category) {
      throw new Error(`Could not find Category: ${categoryName}`);
    }

    const options = [
      ...this._managedCategoryOptions.get(category.name).values(),
    ] // does not have to be sorted, since this is the first owner
      .reduce(reduceCategoryOptions, { actions: [] });

    const listeners = [
      category.collection.added.addEventListener((item) => {
        if (item[moduleIdSymbol] === this._dynamicModuleId) {
          this._handleItemAdded(item, category);
        }
      }),
      category.collection.removed.addEventListener((item) => {
        if (item[moduleIdSymbol] === this._dynamicModuleId) {
          this._handleItemRemoved(item, category);
        }
      }),
      category.collection.replaced.addEventListener((replacedEvent) => {
        if (replacedEvent.old[moduleIdSymbol] === this._dynamicModuleId) {
          this._handleItemRemoved(replacedEvent.old, category);
        }
      }),
    ];

    if (category.collection instanceof IndexedCollection) {
      listeners.push(
        category.collection.moved.addEventListener((item) => {
          if (item[moduleIdSymbol] === this._dynamicModuleId) {
            this._handleItemMoved(item, category);
          }
        }),
      );
    }

    /** @type {ManagedCategory} */
    const managedCategory = reactive({
      ...options,
      get categoryName() {
        return category.name;
      },
      selection: [],
      title: category.title,
      items: [],
      destroy() {
        listeners.forEach((cb) => {
          cb();
        });
        this.items.forEach((item) => {
          if (item.destroy) {
            item.destroy();
          }
        });
        this.items = [];
      },
    });

    this._managedCategories.set(categoryName, managedCategory);
    this._resetCategoryItems(categoryName);
    this.componentIds.push(categoryName);
    this.added.raiseEvent(managedCategory);

    return managedCategory;
  }

  /**
   * updates the managed categorys actions
   * @param {string} categoryName
   * @private
   */
  _updateCategory(categoryName) {
    if (this._managedCategoryOptions.has(categoryName)) {
      const managedCategory = this.get(categoryName);
      if (managedCategory) {
        const pluginNames = [...this._app.plugins].map((p) => p.name);
        const options = [
          ...this._managedCategoryOptions.get(categoryName).entries(),
        ]
          .sort(([ownerA], [ownerB]) =>
            sortByOwner(ownerA, ownerB, pluginNames),
          )
          .map(([, value]) => value)
          .reduce(reduceCategoryOptions, { actions: [] });
        Object.assign(managedCategory, options);
      }
    }
  }

  /**
   * @param {string} categoryName
   * @returns {ManagedCategory|undefined}
   */
  get(categoryName) {
    return this._managedCategories.get(categoryName);
  }

  /**
   * @param {string} categoryName
   * @returns {boolean}
   */
  has(categoryName) {
    return this._managedCategories.has(categoryName);
  }

  /**
   * adds a category to this manager, the category will be shown in the components window.
   * If a category has been added by several owners the actions will be merged and sorted by the order of the
   * owner in the app.plugins collection.
   * @param {ManagedCategoryOptions} managedCategoryOptions
   * @param {string|symbol} owner
   * @returns {ManagedCategory}
   */
  add(managedCategoryOptions, owner) {
    check(managedCategoryOptions, { categoryName: String });
    check(owner, [String, Symbol]);

    const { categoryName } = managedCategoryOptions;
    if (
      managedCategoryOptions.actions &&
      !validateActions(managedCategoryOptions.actions)
    ) {
      throw new Error('Invalid actions Array');
    }
    if (!this._app.categories.hasKey(categoryName)) {
      throw new Error(`Could not find category: ${categoryName}`);
    }

    if (this._managedCategoryOptions.get(categoryName)?.has(owner)) {
      throw new Error(
        `Category has already been added by this owner: ${categoryName}, ${owner}`,
      );
    }
    if (managedCategoryOptions.draggable) {
      const { collection } = this._app.categories.getByKey(categoryName);
      managedCategoryOptions.draggable =
        collection instanceof IndexedCollection;
    }

    /** @type {ManagedCategoryOptions} */
    const clonedOptions = {
      categoryName,
      actions: managedCategoryOptions.actions?.slice?.() ?? [],
      draggable: managedCategoryOptions.draggable,
      selectable: managedCategoryOptions.selectable,
      singleSelect: managedCategoryOptions.singleSelect,
    };

    if (!this._managedCategoryOptions.has(categoryName)) {
      const managedCategory = new Map();
      managedCategory.set(owner, clonedOptions);
      this._managedCategoryOptions.set(categoryName, managedCategory);
      return this._createManagedCategory(categoryName);
    } else {
      this._managedCategoryOptions.get(categoryName).set(owner, clonedOptions);
      this._updateCategory(categoryName);
      return this.get(categoryName);
    }
  }

  /**
   * removes a category for a specific owner from this manager
   * @param {string} categoryName
   * @param {string|symbol} owner
   */
  remove(categoryName, owner) {
    check(categoryName, String);
    check(owner, [String, Symbol]);
    if (!this._managedCategoryOptions.has(categoryName)) {
      return;
    }
    this._managedCategoryOptions.get(categoryName).delete(owner);
    if (this._managedCategoryOptions.get(categoryName).size > 0) {
      this._updateCategory(categoryName);
    } else {
      this._removeCategory(categoryName);
    }
  }

  /**
   * removes a Category from management, removes all Listeners, and updates the listItems
   * @param {string} categoryName
   * @private
   */
  _removeCategory(categoryName) {
    const managedCategory = this.get(categoryName);
    this._managedCategoryOptions.delete(categoryName);
    const index = this.componentIds.indexOf(categoryName);
    if (index > -1) {
      this.componentIds.splice(index, 1);
    }
    if (managedCategory) {
      this._managedCategories.delete(categoryName);
      managedCategory.destroy();
      this.removed.raiseEvent(managedCategory);
    }
  }

  /**
   * adds MappingFunction to the categoryManager. For the given categoryNames each Item will be transformed by the
   * mappingFunction if the predicate returns true.
   * @param {PredicateFunction} predicate
   * @param {MappingFunction} mappingFunction
   * @param {Array<string>} categoryNames list of categories this mappingFunction should be used on
   * @param {string | symbol} owner
   */
  addMappingFunction(predicate, mappingFunction, categoryNames, owner) {
    check(predicate, Function);
    check(mappingFunction, Function);
    check(categoryNames, [String]);
    check(owner, [String, Symbol]);
    if (categoryNames.length === 0) {
      throw new Error('Provide at least one categoryName');
    }
    if (
      this._itemMappings.find((itemMapping) => {
        return (
          itemMapping.mappingFunction === mappingFunction &&
          itemMapping.owner === owner
        );
      })
    ) {
      throw new Error(
        'Could not add MappingFunction, the MappingFunction is already under management',
      );
    }
    /** @type {ItemMapping} */
    const itemMapping = {
      predicate,
      mappingFunction,
      categoryNames: categoryNames.slice(),
      owner,
    };
    this._itemMappings.push(itemMapping);
    itemMapping.categoryNames.forEach((categoryName) => {
      if (this._managedCategoryOptions.has(categoryName)) {
        this._resetCategoryItems(categoryName);
      }
    });
  }

  /**
   * removes the given mappingFunction
   * @param {MappingFunction} mappingFunction
   * @param {string | symbol} owner
   */
  removeMappingFunction(mappingFunction, owner) {
    check(mappingFunction, Function);
    check(owner, [String, Symbol]);
    const affectedCategories = [];
    this._itemMappings = this._itemMappings.filter((itemMapping) => {
      if (
        itemMapping.mappingFunction === mappingFunction &&
        itemMapping.owner === owner
      ) {
        affectedCategories.push(...itemMapping.categoryNames);
        return false;
      }
      return true;
    });
    new Set(affectedCategories).forEach((categoryName) => {
      this._resetCategoryItems(categoryName);
    });
  }

  /**
   * removes managed categories and mappingFunctions belonging to the given owner.
   * @param {string | symbol} owner
   */
  removeOwner(owner) {
    check(owner, [String, Symbol]);
    const affectedCategories = [];
    this._managedCategoryOptions.forEach((managedCategory, categoryName) => {
      if (managedCategory.delete(owner)) {
        affectedCategories.push(categoryName);
      }
      if (managedCategory.size === 0) {
        this._managedCategoryOptions.delete(categoryName);
      }
    });
    affectedCategories.forEach((categoryName) => {
      if (this._managedCategoryOptions.has(categoryName)) {
        this._updateCategory(categoryName);
      } else {
        this._removeCategory(categoryName);
      }
    });
    this._itemMappings = this._itemMappings.filter((itemMapping) => {
      return itemMapping.owner !== owner;
    });
    this._resetManagedCategories();
  }

  /**
   * Clears the manager of all added categories and item mappings
   */
  clear() {
    [...this.componentIds].forEach((categoryName) => {
      this._removeCategory(categoryName);
    });
    this._itemMappings = [];
  }

  /**
   * destroys the categoryManager, removes all Listeners and clears all Managed Categories
   */
  destroy() {
    this._dynamicModuleIdListener();
    this._appCategoriesRemovedListener();
    this.componentIds = [];
    this._managedCategories.forEach((item) => {
      item.destroy();
    });
    this._managedCategories.clear();
    this._managedCategoryOptions.clear();
    this.added.destroy();
    this.removed.destroy();
  }
}

export default CategoryManager;
