// eslint-disable-next-line max-classes-per-file
import {
  IndexedCollection,
  makeOverrideCollection,
  getObjectFromClassRegistry,
} from '@vcmap/core';
import { v4 as uuid } from 'uuid';
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

/**
 * @typedef {Object} ParentTreeViewItem
 * @property {TreeViewItem} [treeViewItem]
 * @property {Map<string, ParentTreeViewItem>} children
 */

/**
 * @extends {IndexedCollection<ContentTreeItem>}
 */
class ContentTreeCollection extends IndexedCollection {
  /**
   * @param {VcsUiApp} app
   */
  constructor(app) {
    super();
    /**
     * @type {VcsUiApp}
     * @private
     */
    this._app = app;

    const recreateTree = () => {
      if (!this._suspendListeners) {
        this._setTreeView();
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
      }),
    ];
    /**
     * This is the default content tree.
     * @type {SubContentTreeItem}
     * @private
     */
    this._defaultSubtreeItem = new SubContentTreeItem(
      { name: 'Content', icon: '$vcsLayers', title: 'content.title' },
      app,
    );
    /**
     * @type {import("vue").Ref<Map<string, TreeViewItem>>}
     * @private
     */
    this._subTreeViewItems = ref(new Map());
    /**
     * The subtree content action button destroy handlers
     * @type {Array<function():void>}
     * @private
     */
    this._subTreeListeners = [];
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
    this._subTreeListeners.forEach((cb) => {
      cb();
    });
  }

  /**
   * @param {TreeViewItem} subTreeViewItem
   * @param {WindowSlot} [slot]
   * @returns {function():void}
   * @private
   */
  _createSubtreeActionButton(subTreeViewItem, slot = WindowSlot.STATIC) {
    // TODO make configurable?
    const id = uuid();
    const app = this._app;
    const { action, destroy } = createToggleAction(
      // TODO icon & title are not reactive
      {
        name: subTreeViewItem.name,
        icon: subTreeViewItem.icon,
        title: subTreeViewItem.title,
      },
      {
        component: LayerTree,
        slot,
        id,
        state: {
          headerIcon: subTreeViewItem.icon,
          headerTitle: subTreeViewItem.title,
        },
      },
      app.windowManager,
      vcsAppSymbol,
    );

    this._app.navbarManager.add(
      { id, action, weight: 100 },
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
   * @private
   */
  _setTreeView() {
    this._clearSubTrees();
    /** @type {Map<string, ParentTreeViewItem>} */
    const baseTreeMap = new Map();
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
    defaultSubTreeViewItem.children.push(
      ...topLevelItems.filter((i) => !i[subTreeSymbol]),
    );
    const subTrees = [
      defaultSubTreeViewItem,
      ...topLevelItems.filter((i) => i[subTreeSymbol]),
    ];

    this._subTreeListeners = subTrees.map((subTree) =>
      this._createSubtreeActionButton(subTree),
    );
  }

  /**
   * Returns all managed subtrees. Entries are not persisted and will change, if the trees get recalculated.
   * @type {import("vue").Ref<Map<string, TreeViewItem>>}
   * @readonly
   */
  get subTreeViewItems() {
    return this._subTreeViewItems;
  }

  /**
   * All ids of the currently managed subtrees. Ids are not persisted and will change if
   * the trees get recalculated. The first ID is always the default tree. Other ids are subtree ids.
   * Order of ids is dependent on their position in the collection and weight.
   * @type {Array<string>}
   * @readonly
   */
  get subTreeIds() {
    return [...this._subTreeViewItems.value.keys()];
  }

  /**
   * @param {string} id
   * @returns {import("vue").ComputedRef<Array<TreeViewItem>>}
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
   * @returns {TreeViewItem}
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
   * @returns {import("vue").Ref<Array<string>>}
   */
  getTreeOpenStateRef(id) {
    const subTree = this._getSubTree(id);
    if (subTree) {
      if (!subTree[subTreeOpenStateSymbol]) {
        subTree[subTreeOpenStateSymbol] = ref(
          this.getChildrenForSubTree(id)
            .filter((i) => i.initOpen)
            .map((i) => i.name),
        );
      }
      return subTree[subTreeOpenStateSymbol];
    }
    return ref([]);
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
 * Only used for intelisense, unconstructable
 * @implements {import("@vcmap/core").OverrideCollection<ContentTreeItem>}
 * @extends {ContentTreeCollection}
 */
// eslint-disable-next-line no-unused-vars
class OverrideContentTreeCollection extends ContentTreeCollection {}

/**
 * @param {VcsUiApp} app
 * @returns {OverrideContentTreeCollection}
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
