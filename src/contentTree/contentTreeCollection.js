import {
  IndexedCollection,
  makeOverrideCollection,
  getObjectFromClassRegistry,
  moduleIdSymbol,
} from '@vcmap/core';
import { computed, ref } from 'vue';
import ContentTreeItem from './contentTreeItem.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import SubContentTreeItem, { subTreeSymbol } from './subContentTreeItem.js';
import LayerTree from './LayerTree.vue';
import { WindowSlot } from '../manager/window/windowManager.js';
import { createToggleAction } from '../actions/actionHelper.js';
import { ButtonLocation } from '../manager/navbarManager.js';

/**
 * @type {symbol}
 */
const subTreeOpenStateSymbol = Symbol('SubTreeOpenState');
const subTreeItemWeight = Symbol('SubTreeItemWeight');

export const defaultContentTreeComponentId = 'Content';

/**
 * @typedef {Object} ParentTreeViewItem
 * @property {import("./contentTreeItem.js").TreeViewItem} [treeViewItem]
 * @property {Map<string, ParentTreeViewItem>} children
 */

/**
 * @extends {IndexedCollection<ContentTreeItem>}
 */
class ContentTreeCollection extends IndexedCollection {
  /**
   * @type {string|undefined}
   * @private
   */
  _removedListenerTimeoutId;
  /**
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(app) {
    super();
    /**
     * @type {import("@src/vcsUiApp.js").default}
     * @private
     */
    this._app = app;

    const recreateTree = (resetSubTreeButtons) => {
      if (!this._suspendListeners) {
        this._setTreeView(resetSubTreeButtons);
      }
    };

    /**
     * A map of all item weightChanged listeners
     * @type {Map<string, function():void>}
     * @private
     */
    this._weightListeners = new Map();

    const uiConfigChanged = () => {
      this.subTreeViewItems.value.forEach((subTree) => {
        if (
          !this._app.uiConfig.config.hideContentTree &&
          !this._subTreeListeners.has(subTree.name)
        ) {
          this._subTreeListeners.get(subTree.name)?.();
          this._subTreeListeners.set(
            subTree.name,
            this._createSubtreeActionButton(subTree),
          );
        } else if (this._app.uiConfig.config.hideContentTree) {
          this._subTreeListeners.get(subTree.name)?.();
          this._subTreeListeners.delete(subTree.name);
        }
      });
      const contentTreeActiveOnStartup = this._app.uiConfig.getByKey(
        'contentTreeActiveOnStartup',
      );
      if (
        contentTreeActiveOnStartup?.value != null &&
        contentTreeActiveOnStartup[moduleIdSymbol] !== this._app.dynamicModuleId
      ) {
        const action = this._app.navbarManager.get(
          defaultContentTreeComponentId,
        )?.action;
        if (action && action.active !== contentTreeActiveOnStartup.value) {
          action.callback();
        }
      }
    };

    /**
     * @type {Array<function():void>}
     * @private
     */
    this._listeners = [
      this.added.addEventListener((child) => {
        recreateTree();
        this._weightListeners.set(
          child.name,
          child.weightChanged.addEventListener(recreateTree),
        );
        if (child.initOpen) {
          const subTreeId = this._getSubtreeIdForItem(child);
          const openState = this.getTreeOpenState(subTreeId);
          if (!openState.includes(child.name)) {
            openState.push(child.name);
          }
        }
      }),
      this.removed.addEventListener((child) => {
        clearTimeout(this._removedListenerTimeoutId);
        this._removedListenerTimeoutId = setTimeout(() => {
          recreateTree();
        }, 0);
        if (this._weightListeners.has(child.name)) {
          this._weightListeners.get(child.name)();
          this._weightListeners.delete(child.name);
        }
        if (this._subTreeListeners.has(child.name)) {
          this._subTreeListeners.get(child.name)();
          this._subTreeListeners.delete(child.name);
          this._subTreeViewItems.value.delete(child.name);
        }
      }),
      this.moved.addEventListener(() => recreateTree(true)),
      app.uiConfig.added.addEventListener(uiConfigChanged),
      app.uiConfig.removed.addEventListener(uiConfigChanged),
    ];
    /**
     * This is the default content tree.
     * @type {SubContentTreeItem}
     * @private
     */
    this._defaultSubtreeItem = new SubContentTreeItem(
      {
        name: defaultContentTreeComponentId,
        icon: '$vcsLayers',
        title: 'content.title',
        tooltip: 'content.title',
      },
      app,
    );
    /**
     * @type {import("vue").Ref<Map<string, import("./contentTreeItem.js").TreeViewItem>>}
     * @private
     */
    this._subTreeViewItems = ref(new Map());
    /**
     * The subtree content action button destroy handlers
     * @type {Map<string, function():void>}
     * @private
     */
    this._subTreeListeners = new Map();
    /**
     * @type {boolean}
     * @private
     */
    this._suspendListeners = false;
  }

  /**
   * @private
   * @param {Array<string>} exclude
   */
  _clearSubTrees(exclude = []) {
    this._subTreeViewItems.value.forEach((tree, key) => {
      if (!exclude.includes(key)) {
        this._subTreeViewItems.value.delete(key);
      }
    });
    this._subTreeListeners.forEach((cb, key) => {
      if (!exclude.includes(key)) {
        cb();
        this._subTreeListeners.delete(key);
      }
    });
  }

  /**
   * @param {import("./contentTreeItem.js").TreeViewItem} subTreeViewItem
   * @param {WindowSlot} [slot]
   * @returns {function():void}
   * @private
   */
  _createSubtreeActionButton(subTreeViewItem, slot = WindowSlot.STATIC) {
    // TODO make configurable?
    const id = subTreeViewItem.name;
    const app = this._app;
    const { action, destroy } = createToggleAction(
      // TODO icon & title are not reactive
      {
        name: subTreeViewItem.title ?? subTreeViewItem.name,
        icon: subTreeViewItem.icon,
        title: subTreeViewItem.tooltip,
      },
      {
        component: LayerTree,
        slot,
        id,
        state: {
          headerIcon: subTreeViewItem.icon,
          headerTitle: subTreeViewItem.title,
          infoUrlCallback: app.getHelpUrlCallback(
            '/components/contentspace.html#id_content',
          ),
        },
      },
      app.windowManager,
      vcsAppSymbol,
    );
    const contentTreeActiveOnStartup = this._app.uiConfig.getByKey(
      'contentTreeActiveOnStartup',
    );
    if (
      id === defaultContentTreeComponentId &&
      contentTreeActiveOnStartup?.value &&
      contentTreeActiveOnStartup[moduleIdSymbol] !== this._app.dynamicModuleId
    ) {
      action.callback();
    }
    this._app.navbarManager.add(
      { id, action, weight: subTreeViewItem[subTreeItemWeight] },
      vcsAppSymbol,
      ButtonLocation.CONTENT,
      { mobile: true, desktop: true, tablet: true },
    );
    return () => {
      app.windowManager.remove(id);
      app.navbarManager.remove(id);
      destroy();
    };
  }

  /**
   * @param {boolean} [resetSubtreeButtons=false]
   * @private
   */
  _setTreeView(resetSubtreeButtons = false) {
    /** @type {Map<string, ParentTreeViewItem>} */
    const baseTreeMap = new Map();
    let maxWeight = 0;
    [...this._array]
      .sort((a, b) => {
        const depthA = a.name.split('.').length;
        const depthB = b.name.split('.').length;
        if (depthA === depthB) {
          if (a.weight === b.weight) {
            return 0;
          }
          return a.weight > b.weight ? -1 : 1;
        }
        return depthA > depthB ? 1 : -1;
      })
      .forEach((item) => {
        const treeViewItem = item.getTreeViewItem();
        const namespace = treeViewItem.name.split('.');
        const name = namespace.pop();
        maxWeight = item.weight > maxWeight ? item.weight : maxWeight;
        if (namespace.length === 0) {
          treeViewItem[subTreeItemWeight] = item.weight;
        }
        /** @type {ParentTreeViewItem} */
        let parentItem = { children: baseTreeMap };
        namespace.forEach((parentName) => {
          if (!parentItem) {
            return;
          }
          parentItem = parentItem.children.get(parentName);
        });

        if (parentItem) {
          parentItem.children.set(name, { treeViewItem, children: new Map() });
        }
      });

    const setChildren = ({ treeViewItem, children }) => {
      const childMaps = [...children.values()];
      childMaps.forEach(setChildren);
      treeViewItem.children.splice(0);
      treeViewItem.children.push(...childMaps.map((c) => c.treeViewItem));
      return treeViewItem;
    };

    const topLevelItems = [...baseTreeMap.values()].map(setChildren);
    const defaultSubTreeViewItem = this._defaultSubtreeItem.getTreeViewItem();
    defaultSubTreeViewItem.children.splice(0);
    defaultSubTreeViewItem[subTreeItemWeight] = maxWeight + 1;
    defaultSubTreeViewItem.children.push(
      ...topLevelItems.filter((i) => !i[subTreeSymbol]),
    );
    const subTrees = [
      defaultSubTreeViewItem,
      ...topLevelItems.filter((i) => i[subTreeSymbol]),
    ];
    this._clearSubTrees(
      subTrees.map((tree) => {
        return tree.name;
      }),
    );

    subTrees.forEach((subTree) => {
      if (!this._subTreeViewItems.value.has(subTree.name)) {
        this._subTreeViewItems.value.set(subTree.name, subTree);
      }

      if (!this._app.uiConfig.config.hideContentTree) {
        if (!this._app.navbarManager.has(subTree.name) || resetSubtreeButtons) {
          this._subTreeListeners.get(subTree.name)?.();
          this._subTreeListeners.set(
            subTree.name,
            this._createSubtreeActionButton(subTree),
          );
        } else {
          const buttonComponent = this._app.navbarManager.get(subTree.name);
          if (buttonComponent.weight !== subTree[subTreeItemWeight]) {
            buttonComponent.weight = subTree[subTreeItemWeight];
          }
        }
      }
    });
  }

  /**
   * @param {ContentTreeItem} item
   * @returns {string}
   * @private
   */
  _getSubtreeIdForItem(item) {
    const [parent] = item.name.split('.');
    if (this._subTreeViewItems.value.has(parent)) {
      return parent;
    }
    return defaultContentTreeComponentId;
  }

  /**
   * Returns all managed subtrees. Entries are not persisted and will change, if the trees get recalculated.
   * @type {import("vue").Ref<Map<string, import("./contentTreeItem.js").TreeViewItem>>}
   */
  get subTreeViewItems() {
    return this._subTreeViewItems;
  }

  /**
   * All ids of the currently managed subtrees.
   * The first ID is always the default tree. Other ids are subtree ids.
   * Order of ids is dependent on their position in the collection and weight.
   * @type {Array<string>}
   */
  get subTreeIds() {
    const [defaultItem, ...rest] = [...this._subTreeViewItems.value.entries()];
    rest.sort(([, a], [, b]) => {
      if (a[subTreeItemWeight] === b[subTreeItemWeight]) {
        return 0;
      }
      return a[subTreeItemWeight] > b[subTreeItemWeight] ? -1 : 1;
    });
    return [defaultItem, ...rest].map(([id]) => id);
  }

  /**
   * @param {string} id
   * @returns {import("vue").ComputedRef<Array<import("./contentTreeItem.js").TreeViewItem>>}
   */
  getComputedVisibleTree(id) {
    return computed(() => {
      const subTreesMap = this._subTreeViewItems.value;
      if (subTreesMap.has(id)) {
        return subTreesMap.get(id).visibleChildren;
      }
      return [];
    });
  }

  /**
   * @param {string} id
   * @returns {import("./contentTreeItem.js").TreeViewItem}
   * @private
   */
  _getSubTree(id) {
    const subTreesMap = this._subTreeViewItems.value;
    return subTreesMap.get(id);
  }

  /**
   * @param {string} id
   * @returns {Array<ContentTreeItem>}
   */
  getChildrenForSubTree(id) {
    const subTree = this._getSubTree(id);
    if (subTree) {
      if (subTree === this._subTreeViewItems.value.values().next().value) {
        const subTreeNames = [...this._subTreeViewItems.value.values()]
          .filter((s) => s !== subTree)
          .map((s) => s.name);
        return this._array.filter(
          (i) => !subTreeNames.some((name) => i.name.startsWith(name)),
        );
      }
      return this._array.filter((i) => i.name.startsWith(subTree.name));
    }
    return [];
  }

  /**
   * This returns a proxy to the subtrees open state. You should mutate this array in place.
   * @param {string} id
   * @returns {Array<string>}
   */
  getTreeOpenState(id) {
    const subTree = this._getSubTree(id);
    if (subTree) {
      if (!subTree[subTreeOpenStateSymbol]) {
        subTree[subTreeOpenStateSymbol] = this.getChildrenForSubTree(id)
          .filter((c) => c.initOpen)
          .map((c) => c.name);
      }
      return subTree[subTreeOpenStateSymbol];
    }
    return [];
  }

  destroy() {
    this._clearSubTrees();
    this._defaultSubtreeItem.destroy();
    this._listeners.forEach((cb) => {
      cb();
    });
    this._weightListeners.forEach((cb) => {
      cb();
    });
    this._weightListeners.clear();
    super.destroy();
  }
}

export default ContentTreeCollection;

/**
 * @param {import("@src/vcsUiApp.js").default} app
 * @returns {import("@vcmap/core").OverrideCollection<ContentTreeItem, ContentTreeCollection>}
 */
export function createContentTreeCollection(app) {
  const collection = new ContentTreeCollection(app);

  const overrideCollection = makeOverrideCollection(
    collection,
    () => app.dynamicModuleId,
    null,
    (config) =>
      getObjectFromClassRegistry(app.contentTreeClassRegistry, config, app),
    ContentTreeItem,
  );

  const originalParseItems =
    overrideCollection.parseItems.bind(overrideCollection);
  overrideCollection.parseItems = async function parseItems(...args) {
    this._suspendListeners = true;
    await originalParseItems(...args);
    this._suspendListeners = false;
    this._setTreeView();
  };

  return overrideCollection;
}
