import {
  IndexedCollection,
  type OverrideCollection,
  getObjectFromClassRegistry,
  makeOverrideCollection,
  moduleIdSymbol,
} from '@vcmap/core';
import { type ComputedRef, type Ref, computed, ref } from 'vue';
import type VcsUiApp from '../vcsUiApp.js';
import ContentTreeItem, {
  type TreeViewItem,
  subTreeItemWeight,
  subTreeOpenStateSymbol,
  subTreeSymbol,
} from './contentTreeItem.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import SubContentTreeItem from './subContentTreeItem.js';
import LayerTree from './LayerTree.ts.vue';
import { callSafeAction, createToggleAction } from '../actions/actionHelper.js';
import { ButtonLocation } from '../manager/navbarManager.js';
import type { WindowSlotType } from '../manager/window/windowManager.js';

export const defaultContentTreeComponentId = 'Content';

type ParentTreeViewItem = {
  treeViewItem: TreeViewItem;
  children: Map<string, ParentTreeViewItem>;
};
class ContentTreeCollection extends IndexedCollection<ContentTreeItem> {
  private _app: VcsUiApp;
  private _removedListenerTimeoutId: number | undefined;
  /** A map of all item weightChanged listeners */
  private _weightListeners = new Map<string, () => void>();
  private _listeners: Array<() => void>;
  /** This is the default content tree */
  private _defaultSubtreeItem: SubContentTreeItem;
  private _subTreeViewItems = ref(new Map<string, TreeViewItem>());
  /** The subtree content action button destroy handlers */
  private _subTreeListeners = new Map<string, () => void>();
  private _suspendListeners = false;

  constructor(app: VcsUiApp) {
    super();
    this._app = app;

    const recreateTree = (resetSubTreeButtons?: boolean): void => {
      if (!this._suspendListeners) {
        this._setTreeView(resetSubTreeButtons);
      }
    };

    const uiConfigChanged = (): void => {
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
          callSafeAction(action);
        }
      }
    };

    this._listeners = [
      this.added.addEventListener((child) => {
        recreateTree();
        this._weightListeners.set(
          child.name,
          child.weightChanged.addEventListener(() => {
            recreateTree();
          }),
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
          this._weightListeners.get(child.name)?.();
          this._weightListeners.delete(child.name);
        }
        if (this._subTreeListeners.has(child.name)) {
          this._subTreeListeners.get(child.name)?.();
          this._subTreeListeners.delete(child.name);
          this._subTreeViewItems.value.delete(child.name);
        }
      }),
      this.moved.addEventListener(() => {
        recreateTree(true);
      }),
      app.uiConfig.added.addEventListener(uiConfigChanged),
      app.uiConfig.removed.addEventListener(uiConfigChanged),
    ];

    this._defaultSubtreeItem = new SubContentTreeItem(
      {
        name: defaultContentTreeComponentId,
        icon: '$vcsLayers',
        title: 'content.title',
        tooltip: 'content.title',
      },
      app,
    );
  }

  private _clearSubTrees(exclude: Array<string> = []): void {
    this._subTreeViewItems.value.forEach((_tree, key) => {
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

  private _createSubtreeActionButton(
    subTreeViewItem: TreeViewItem,
    slot: WindowSlotType = 'static',
  ): () => void {
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
      callSafeAction(action);
    }
    this._app.navbarManager.add(
      { id, action, weight: subTreeViewItem[subTreeItemWeight] },
      vcsAppSymbol,
      ButtonLocation.CONTENT,
      { mobile: true, desktop: true, tablet: true },
    );
    return (): void => {
      app.windowManager.remove(id);
      app.navbarManager.remove(id);
      destroy();
    };
  }

  private _setTreeView(resetSubtreeButtons = false): void {
    const baseTreeMap = new Map<string, ParentTreeViewItem>();
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
        const name = namespace.pop()!;
        maxWeight = item.weight > maxWeight ? item.weight : maxWeight;
        if (namespace.length === 0) {
          treeViewItem[subTreeItemWeight] = item.weight;
        }
        let parentItem:
          | Pick<ParentTreeViewItem, 'children'>
          | ParentTreeViewItem
          | undefined = {
          children: baseTreeMap,
        };
        namespace.forEach((parentName) => {
          if (parentItem) {
            parentItem = parentItem.children.get(parentName);
          }
        });
        if (parentItem) {
          parentItem.children.set(name, { treeViewItem, children: new Map() });
        }
      });

    const setChildren = ({
      treeViewItem,
      children,
    }: ParentTreeViewItem): TreeViewItem => {
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
    this._clearSubTrees(subTrees.map((tree) => tree.name));

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
          const buttonComponent = this._app.navbarManager.get(subTree.name)!;
          if (buttonComponent.weight !== subTree[subTreeItemWeight]) {
            buttonComponent.weight = subTree[subTreeItemWeight]!;
          }
        }
      }
    });
  }

  private _getSubtreeIdForItem(item: ContentTreeItem): string {
    const [parent] = item.name.split('.');
    if (this._subTreeViewItems.value.has(parent)) {
      return parent;
    }
    return defaultContentTreeComponentId;
  }

  /**
   * Returns all managed subtrees. Entries are not persisted and will change, if the trees get recalculated.
   */
  get subTreeViewItems(): Ref<Map<string, TreeViewItem>> {
    return this._subTreeViewItems;
  }

  /**
   * All ids of the currently managed subtrees.
   * The first ID is always the default tree. Other ids are subtree ids.
   * Order of ids is dependent on their position in the collection and weight.
   */
  get subTreeIds(): Array<string> {
    const [defaultItem, ...rest] = [...this._subTreeViewItems.value.entries()];
    rest.sort(([, a], [, b]) => {
      if (a[subTreeItemWeight] === b[subTreeItemWeight]) {
        return 0;
      }
      return a[subTreeItemWeight]! > b[subTreeItemWeight]! ? -1 : 1;
    });
    return [defaultItem, ...rest].map(([id]) => id);
  }

  getComputedVisibleTree(id: string): ComputedRef<Array<TreeViewItem>> {
    return computed<Array<TreeViewItem>>(() => {
      const subTreesMap = this._subTreeViewItems.value;
      if (subTreesMap.has(id)) {
        return subTreesMap.get(id)?.visibleChildren ?? [];
      }
      return [];
    });
  }

  private _getSubTree(id: string): TreeViewItem | undefined {
    const subTreesMap = this._subTreeViewItems.value;
    return subTreesMap.get(id);
  }

  getChildrenForSubTree(id: string): Array<ContentTreeItem> {
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
   */
  getTreeOpenState(id: string): Array<string> {
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

  destroy(): void {
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

export function createContentTreeCollection(
  app: VcsUiApp,
): OverrideCollection<ContentTreeItem, ContentTreeCollection> {
  const collection = new ContentTreeCollection(app);

  const overrideCollection = makeOverrideCollection(
    collection,
    () => app.dynamicModuleId,
    undefined,
    (config) =>
      getObjectFromClassRegistry(app.contentTreeClassRegistry, config, app),
    ContentTreeItem,
  );

  const originalParseItems =
    overrideCollection.parseItems.bind(overrideCollection);
  overrideCollection.parseItems = async function parseItems(
    ...args
  ): Promise<void> {
    // @ts-expect-error suspend listeners to avoid multiple tree recalculations during parseItems
    this._suspendListeners = true;
    await originalParseItems(...args);
    // @ts-expect-error restore suspend listeners
    this._suspendListeners = false;
    // @ts-expect-error after parseItems, the tree view needs to be recalculated
    this._setTreeView();
  };

  return overrideCollection;
}
