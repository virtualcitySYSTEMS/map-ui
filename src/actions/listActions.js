import { reactive, watch } from 'vue';
import { check } from '@vcsuite/check';
import { createToggleAction } from './actionHelper.js';
import ImportComponent from '../components/import/ImportComponent.vue';
import { WindowSlot } from '../manager/window/windowManager.js';
import { vcsAppSymbol } from '../pluginHelper.js';

/**
 * Creates an action for renaming an item in a VcsList. Sho VcsTextfield in VcsList.
 * @param {import("../components/lists/VcsList.vue").VcsListItem} item
 * @param {Partial<import("./actionHelper.js").ActionOptions>} [actionOptions={}]
 * @returns {import("./actionHelper.js").VcsAction}
 */
export function createListItemRenameAction(item, actionOptions = {}) {
  return {
    name: 'list.renameItem',
    ...actionOptions,
    callback: () => {
      item.rename = true;
    },
  };
}

/**
 * Creates an action for renaming an item in a VcsList.
 * @param {import("@vcmap/core").Collection<T>} collection
 * @param {T} item
 * @param {Partial<import("./actionHelper.js").ActionOptions>} [actionOptions={}]
 * @template {Object} T
 * @returns {import("./actionHelper.js").VcsAction}
 */
export function createListItemDeleteAction(
  collection,
  item,
  actionOptions = {},
) {
  return {
    name: 'list.deleteItem',
    ...actionOptions,
    callback: () => {
      if (collection.has(item)) {
        collection.remove(item);
      }
    },
  };
}

/**
 * Creates an action based on a provided selection
 * @param {import("vue").Ref<Array<import("../components/lists/VcsList.vue").VcsListItem>>} selection
 * @param {import("./actionHelper.js").ActionOptions & {callback:import("./actionHelper.js").ActionCallback}} [actionOptions]
 * @returns {{action: import("vue").UnwrapRef<import("./actionHelper.js").VcsAction>, destroy: import("vue").WatchStopHandle}}
 */
export function createListItemBulkAction(selection, actionOptions) {
  check(actionOptions, {
    name: String,
    icon: [undefined, String],
    title: [undefined, String],
    callback: Function,
  });

  const action = reactive({
    disabled: true,
    ...actionOptions,
  });

  const destroy = watch(selection, () => {
    action.disabled = selection.value.length < 1;
  });

  return { action, destroy };
}

/**
 * @param {import("vue").Ref<Array<import("../components/lists/VcsList.vue").VcsListItem>>} selection
 * @param {import("./actionHelper.js").ActionCallback} exportCallback
 * @param {string|symbol} owner
 * @returns {{action: import("../manager/collectionManager/collectionManager.js").OwnedAction, destroy: (function(): void)}}
 */
export function createListExportAction(selection, exportCallback, owner) {
  const { action, destroy } = createListItemBulkAction(selection, {
    name: 'list.export',
    callback: exportCallback,
  });

  return {
    action: {
      action,
      owner,
      weight: 99,
    },
    destroy,
  };
}

/**
 *
 * @param {function(File[]):void|Promise<void>} importCallback
 * @param {import("../manager/window/windowManager.js").default} windowManager
 * @param {string|symbol} owner
 * @param {string} parentId
 * @returns {{action: import("../manager/collectionManager/collectionManager.js").OwnedAction, destroy: (function(): void)}}
 */
export function createListImportAction(
  importCallback,
  windowManager,
  owner,
  parentId,
) {
  check(importCallback, Function);
  check(owner, [String, vcsAppSymbol]);
  check(parentId, String);

  const { action, destroy } = createToggleAction(
    {
      name: `list.import`,
    },
    {
      id: `list-import`,
      parentId,
      component: ImportComponent,
      slot: WindowSlot.DYNAMIC_CHILD,
      state: {
        headerTitle: `list.import`,
        headerIcon: '$vcsPlus',
      },
      props: {
        importFiles: importCallback,
      },
    },
    windowManager,
    owner,
  );

  return {
    action: {
      action,
      owner,
      weight: 98,
    },
    destroy,
  };
}

/**
 * @param {import("vue").Ref<Array<import("../manager/collectionManager/collectionComponentClass.js").CollectionComponentListItem>>} selection
 * @param {function(T):void} editCallback
 * @param {import("../manager/window/windowManager.js").default} windowManager
 * @param {string|symbol} owner
 * @param {string} multiEditorId
 * @template {Object} T
 * @returns {{action: import("./actionHelper.js").VcsAction, destroy: function(): void}}
 */
export function createListEditAction(
  selection,
  editCallback,
  windowManager,
  owner,
  multiEditorId,
) {
  const { action, destroy: destroyEditSelected } = createListItemBulkAction(
    selection,
    {
      name: 'list.edit',
      callback: editCallback,
    },
  );

  function handleWindowChanged() {
    action.active = windowManager.has(multiEditorId);
  }

  const editorStateListener = [
    windowManager.added.addEventListener(handleWindowChanged),
    windowManager.removed.addEventListener(handleWindowChanged),
  ];

  return {
    action,
    destroy: () => {
      destroyEditSelected();
      editorStateListener.forEach((cb) => cb());
    },
  };
}
