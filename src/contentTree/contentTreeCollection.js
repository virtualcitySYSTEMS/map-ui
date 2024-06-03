// eslint-disable-next-line max-classes-per-file
import {
  IndexedCollection,
  makeOverrideCollection,
  getObjectFromClassRegistry,
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
      }),
      this.removed.addEventListener((child) => {
        recreateTree();
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
    ];
    /**
     * This is the default content tree.
     * @type {SubContentTreeItem}
     * @private
     */
    this._defaultSubtreeItem = new SubContentTreeItem(
      {
        name: 'Content',
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
   */
  _clearSubTrees() {
    this._subTreeViewItems.value.clear();
    [...this._subTreeListeners.values()].forEach((cb) => {
      cb();
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

    this._app.navbarManager.add(
      { id, action, weight: subTreeViewItem[subTreeItemWeight] },
      vcsAppSymbol,
      ButtonLocation.CONTENT,
    );
    this._subTreeViewItems.value.set(id, subTreeViewItem);
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

    subTrees.forEach((subTree) => {
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
    });
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
   * @param {string} id
   * @returns {Array<string>}
   */
  getTreeOpenState(id) {
    const subTree = this._getSubTree(id);
    if (subTree) {
      if (!subTree[subTreeOpenStateSymbol]) {
        subTree[subTreeOpenStateSymbol] = this.getChildrenForSubTree(id)
          .filter((i) => i.initOpen)
          .map((i) => i.name);
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
