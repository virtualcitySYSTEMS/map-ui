import { ref } from 'vue';
import { contextIdSymbol, IndexedCollection } from '@vcmap/core';
import { check } from '@vcsuite/check';
import { sortByOwner } from '../navbarManager.js';
import { validateAction, validateActions } from '../../components/lists/VcsActionList.vue';

/**
 * @callback MappingFunction
 * @param {T} item
 * @param {import("@vcmap/core").Category<T>} category
 * @param {import("@vcmap/ui").TreeViewItem} treeViewItem
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
 * uses the itemMappings to transform the given Item to an TreeViewItem usable in the VCSTreeView
 * @param {T} item
 * @param {import("@vcmap/core").Category<T>} category
 * @param {Array<ItemMapping<T>>} itemMappings
 * @returns {import("@vcmap/ui").TreeViewItem}
 * @template T
 * @private
 */
function transformItem(item, category, itemMappings) {
  const keyProperty = category.collection.uniqueKey;
  const treeViewItem = {
    get id() { return item[keyProperty]; },
    title: item?.properties?.title || item[keyProperty],
    actions: [],
    children: [],
  };
  itemMappings.forEach((itemMapping) => {
    if (itemMapping.predicate(item, category)) {
      itemMapping.mappingFunction(item, category, treeViewItem);
    }
  });
  treeViewItem.actions = treeViewItem.actions.filter((action) => {
    return validateAction(action);
  });
  return treeViewItem;
}

/**
 * Inserts the item into the children array at the correct relative position in respect to the position of the item
 * in the collection
 * @param {import("@vcmap/ui").TreeViewItem} item
 * @param {import("@vcmap/core").Collection} collection
 * @param {Array<import("@vcmap/ui").TreeViewItem>} children
 * @private
 */
function insertItem(item, collection, children) {
  if (collection instanceof IndexedCollection) {
    const newItemIndex = collection.indexOfKey(item.id);
    if (newItemIndex === collection.size - 1) {
      children.push(item);
    } else {
      const positionInChildren = children.findIndex((treeViewItem) => {
        const treeViewItemIndex = collection.indexOfKey(treeViewItem.id);
        return newItemIndex < treeViewItemIndex;
      });
      if (positionInChildren >= 0) {
        children.splice(positionInChildren, 0, item);
      }
    }
  } else {
    children.push(item);
  }
}

/**
 * a categoryManager manages categories, and synchronizes a tree of VcsTreeView Items.
 * provides an API to add/remove Categories.
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
     * @type {Map<string, Map<string|symbol, Array<import("@vcmap/ui").VcsAction>>>}
     * @private
     */
    this._managedCategories = new Map();

    /**
     * @type {Map<string, Array<function():void>>}
     * @private
     */
    this._managedCategoriesListeners = new Map();

    /**
     * @type {function():void}
     * @private
     */
    this._dynamicContextIdListener = this._app.dynamicContextIdChanged.addEventListener((id) => {
      this._dynamicContextId = id;
      this._resetItems();
    });

    /**
     * @type {function():void}
     * @private
     */
    this._appCategoriesRemovedListener = this._app.categories.removed.addEventListener((category) => {
      this._removeCategory(category.name);
    });

    /**
     * @type {string}
     * @private
     */
    this._dynamicContextId = this._app.dynamicContextId;

    /**
     * @type {Array<ItemMapping<*>>}
     * @private
     */
    this._itemMappings = [];

    /**
     * @type {import("vue").Ref<Array<import("@vcmap/ui").TreeViewItem>>}
     * @private
     */
    this._items = ref([]);
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
    const finishedUiItem = transformItem(item, category, itemMappings);
    const categoryItem = this.items.value.find((elem) => { return elem.id === category.name; });
    if (categoryItem) {
      insertItem(finishedUiItem, category.collection, categoryItem.children);
      /* if (category.collection instanceof IndexedCollection) {
        const newItemIndex = category.collection.indexOf(item);
        let indexToInsert = 0;
        // eslint-disable-next-line for-direction
        for (let index = categoryItem.children.length - 1; index >= 0; index--) {
          const treeViewItem = categoryItem.children[index];
          const treeViewItemIndex = category.collection.indexOfKey(treeViewItem.id);
          if (treeViewItemIndex < newItemIndex) {
            // should be added directly after this item
            indexToInsert = index + 1;
            break;
          }
        }
        categoryItem.children.splice(indexToInsert, 0, finishedUiItem);
      } else {
        categoryItem.children.push(finishedUiItem);
      } */
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
    const categoryItem = this.items.value.find((elem) => { return elem.id === category.name; });
    if (categoryItem) {
      const index = categoryItem.children.findIndex((elem) => { return elem.id === item.name; });
      if (index > -1) {
        const treeViewItem = categoryItem.children[index];
        categoryItem.children.splice(index, 1);
        insertItem(treeViewItem, category.collection, categoryItem.children);
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
    const categoryItem = this.items.value.find((elem) => { return elem.id === category.name; });
    if (categoryItem) {
      const index = categoryItem.children.findIndex((elem) => { return elem.id === item.name; });
      if (index > -1) {
        categoryItem.children.splice(index, 1);
      }
    }
  }

  /**
   * removes all Items and rebuilds the item tree depending on the ContextId
   * @private
   */
  _resetItems() {
    this.items.value.splice(0);
    this._managedCategories.forEach((value, categoryName) => {
      this._resetCategory(categoryName);
    });
  }

  /**
   * resets the category, removes the currently managed state and rebuilds the categoryItem and all children
   * @param {string} categoryName
   * @private
   */
  _resetCategory(categoryName) {
    const category = this._app.categories.getByKey(categoryName);
    if (!category) {
      throw new Error(`Could not find Category: ${categoryName}`);
    }
    // cleanup existing listeners
    if (this._managedCategoriesListeners.has(categoryName)) {
      this._managedCategoriesListeners.get(categoryName).forEach((listener) => {
        listener();
      });
      this._managedCategoriesListeners.delete(categoryName);
    }

    const categoryItemIndex = this._items.value.findIndex((item) => {
      return item.id === category.name;
    });
    const actions = [...this._managedCategories.get(category.name).values()].flatMap(ownerActions => ownerActions);

    const itemMappings = this._itemMappings.filter((itemMapping) => {
      return itemMapping.categoryNames.includes(category.name);
    });
    const children = [...category.collection]
      .filter((item) => {
        return item[contextIdSymbol] === this._dynamicContextId;
      })
      .map((item) => {
        return transformItem(item, category, itemMappings);
      });


    const categoryItem = {
      id: category.name,
      title: category.title,
      children,
      actions,
    };
    if (categoryItemIndex >= 0) {
      this._items.value.splice(categoryItemIndex, 1, categoryItem);
    } else {
      this._items.value.push(categoryItem);
    }

    const listeners = [
      category.collection.added.addEventListener((item) => {
        if (item[contextIdSymbol] === this._dynamicContextId) {
          this._handleItemAdded(item, category);
        }
      }),
      category.collection.removed.addEventListener((item) => {
        if (item[contextIdSymbol] === this._dynamicContextId) {
          this._handleItemRemoved(item, category);
        }
      }),
      category.collection.replaced.addEventListener((replacedEvent) => {
        if (replacedEvent.old[contextIdSymbol] === this._dynamicContextId) {
          this._handleItemRemoved(replacedEvent.old, category);
        }
      }),
    ];

    if (category.collection instanceof IndexedCollection) {
      listeners.push(category.collection.moved.addEventListener((item) => {
        if (item[contextIdSymbol] === this._dynamicContextId) {
          this._handleItemMoved(item, category);
        }
      }));
    }

    this._managedCategoriesListeners.set(category.name, listeners);
  }

  /**
   * updates the root item of this category in the items array.
   * Only updates the actions
   * @param {string} categoryName
   * @private
   */
  _updateCategory(categoryName) {
    if (this._managedCategories.has(categoryName)) {
      const categoryUiItem = this._items.value.find((item) => {
        return item.id === categoryName;
      });
      if (categoryUiItem) {
        const pluginNames = [...this._app.plugins].map(p => p.name);
        const actions = [...this._managedCategories.get(categoryName).entries()]
          .sort(([ownerA], [ownerB]) => sortByOwner(ownerA, ownerB, pluginNames))
          .map(([, value]) => value)
          .flatMap(ownerActions => ownerActions);
        categoryUiItem.actions = actions;
      }
    }
  }

  /**
   * adds a category to this manager, the category will be shown in the components window.
   * If a category has been added by several owners the actions will be merged and sorted by the order of the
   * owner in the app.plugins collection.
   * @param {string} categoryName
   * @param {string | symbol} owner
   * @param {Array<VcsAction>} actions
   */
  addCategory(categoryName, owner, actions) {
    check(categoryName, String);
    check(owner, [String, Symbol]);
    if (!validateActions(actions)) {
      throw new Error('Invalid actions Array');
    }
    if (!this._app.categories.hasKey(categoryName)) {
      throw new Error(`Could not find category: ${categoryName}`);
    }

    if (this._managedCategories.get(categoryName)?.has(owner)) {
      throw new Error(`Category has already been added by this owner: ${categoryName}, ${owner}`);
    }

    if (!this._managedCategories.has(categoryName)) {
      const managedCategory = new Map();
      managedCategory.set(owner, actions.slice());
      this._managedCategories.set(categoryName, managedCategory);
      this._resetCategory(categoryName);
    } else {
      this._managedCategories.get(categoryName).set(owner, actions.slice());
      this._updateCategory(categoryName);
    }
  }

  /**
   * removes a category from this manager
   * @param {string} categoryName
   * @param {string | symbol} owner
   */
  removeCategory(categoryName, owner) {
    check(categoryName, String);
    check(owner, [String, Symbol]);
    if (!this._managedCategories.has(categoryName)) {
      return;
    }
    this._managedCategories.get(categoryName).delete(owner);
    if (this._managedCategories.get(categoryName).size > 0) {
      this._updateCategory(categoryName);
    } else {
      this._removeCategory(categoryName);
    }
  }

  /**
   * removes a Category from management, removes all Listeners, and updates the treeViewItems
   * @param {string} categoryName
   * @private
   */
  _removeCategory(categoryName) {
    // remove rootCategoryItem
    const categoryItemIndex = this._items.value.findIndex((item) => {
      return item.id === categoryName;
    });
    if (categoryItemIndex >= 0) {
      this._items.value.splice(categoryItemIndex, 1);
    }
    this._managedCategoriesListeners.get(categoryName)
      ?.forEach((listenerCallback) => {
        listenerCallback();
      });
    this._managedCategoriesListeners.delete(categoryName);
    this._managedCategories.delete(categoryName);
  }

  /**
   * adds MappingFunction the categoryManager. For the given categoryNames each Item will be transformed by the
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
    if (this._itemMappings.find((itemMapping) => {
      return itemMapping.mappingFunction === mappingFunction && itemMapping.owner === owner;
    })) {
      throw new Error('Could not add MappingFunction, the MappingFunction is already under management');
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
      if (this._managedCategories.has(categoryName)) {
        this._resetCategory(categoryName);
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
      if (itemMapping.mappingFunction === mappingFunction && itemMapping.owner === owner) {
        affectedCategories.push(...itemMapping.categoryNames);
        return false;
      }
      return true;
    });
    new Set(affectedCategories).forEach((categoryName) => {
      this._resetCategory(categoryName);
    });
  }

  /**
   * removes managed categories and mappingFunctions belonging to the given owner.
   * @param {string | symbol} owner
   */
  removeOwner(owner) {
    check(owner, [String, Symbol]);
    this._managedCategories.forEach((managedCategory, categoryName) => {
      managedCategory.delete(owner);
      if (managedCategory.size === 0) {
        this._managedCategories.delete(categoryName);
      }
    });
    this._itemMappings = this._itemMappings.filter((itemMapping) => {
      return itemMapping.owner !== owner;
    });
    this._resetItems();
  }

  /**
   * Array to render in TreeView
   * @returns {import("vue").Ref<Array<import("@vcmap/ui").TreeViewItem>>}
   */
  get items() {
    return this._items;
  }

  /**
   * destroys the categoryManager, removes all Listeners and clears all Managed Categories
   */
  destroy() {
    this._dynamicContextIdListener();
    this._appCategoriesRemovedListener();
    this.items.value.splice(0);
    this._managedCategories.clear();
    [...this._managedCategoriesListeners.values()].forEach((listeners) => {
      listeners.forEach((listener) => { listener(); });
    });
    this._managedCategoriesListeners.clear();
  }
}

export default CategoryManager;
