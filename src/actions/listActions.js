import { reactive, watch } from 'vue';
import { check, oneOf, optional } from '@vcsuite/check';
import { getLogger } from '@vcsuite/logger';
import { parseGeoJSON } from '@vcmap/core';
import VcsImportComponent from '../components/import/VcsImportComponent.vue';
import { createToggleAction } from './actionHelper.js';
import { WindowSlot } from '../manager/window/windowManager.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import { NotificationType } from '../notifier/notifier.js';

/**
 * Creates an action for deleting an item in a VcsList.
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
 * @param {import("vue").Ref<Array<import("../components/lists/VcsListItemComponent.vue").VcsListItem>>} selection
 * @param {import("./actionHelper.js").ActionOptions & {callback:import("./actionHelper.js").ActionCallback}} [actionOptions]
 * @returns {{action: import("vue").UnwrapRef<import("./actionHelper.js").VcsAction>, destroy: import("vue").WatchStopHandle}}
 */
export function createListItemBulkAction(selection, actionOptions) {
  check(actionOptions, {
    name: String,
    icon: optional(String),
    title: optional(String),
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
 * @param {import("vue").Ref<Array<import("../components/lists/VcsListItemComponent.vue").VcsListItem>>} selection
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
 * @typedef {Object} ImportIntoLayerOptions
 * @property {import("@vcmap/core").GeoJSONreadOptions} [readOptions]
 * @property {function(import("ol").Feature):boolean} [predicate] - predicate to filter features by
 * @property {string} [predicateFailureMessage='components.import.predicateFailure'] - message to be displayed on predicate failures
 * @property {string} [addFailureMessage='components.import.addFailure'] - message to be displayed if feature could not be added to layer (same id)
 * @property {string} [featuresAddedMessage='components.import.featuresAdded'] - message to be displayed if features where imported
 * @property {string} [nothingAddedMessage='components.import.nothingAdded'] - message to be displayed if no features where imported
 * @property {boolean} [setStyle] - set the style from the last imported file on the provided layer
 * @property {boolean} [setVcsMeta] - set vcs meta from the last imported file on the provided layer
 * @property {boolean} [returnValue] - by default true is returned to close the window, this can be overriden.
 */

/**
 * @param {File[]} files
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").VectorLayer} layer
 * @param {ImportIntoLayerOptions} [options={}]
 * @returns {Promise<boolean>}
 */
export async function importIntoLayer(files, app, layer, options = {}) {
  const { vueI18n } = app;
  const results = await Promise.all(
    files.map(async (file) => {
      const text = await file.text();
      try {
        return parseGeoJSON(text, options.readOptions);
      } catch (e) {
        app.notifier.add({
          type: NotificationType.ERROR,
          message: vueI18n.t('components.import.failure', {
            fileName: file.name,
          }),
        });
        getLogger('import').error(e);
      }
      return {
        features: [],
      };
    }),
  );

  const features = results.flatMap((r) => r.features);
  const featureToImport = options.predicate
    ? features.filter((f) => options.predicate(f))
    : features;

  const predicateDelta = features.length - featureToImport.length;
  if (predicateDelta > 0) {
    app.notifier.add({
      type: NotificationType.WARNING,
      message: vueI18n.t(
        options.predicateFailureMessage ?? 'components.import.predicateFailure',
        [predicateDelta],
      ),
    });
  }

  const imported = layer
    .addFeatures(featureToImport)
    .filter((id) => id != null);

  const importedDelta = featureToImport.length - imported.length;
  if (importedDelta > 0) {
    app.notifier.add({
      type: NotificationType.WARNING,
      message: vueI18n.t(
        options.addFailureMessage ?? 'components.import.addFailure',
        [importedDelta],
      ),
    });
  }

  if (imported.length > 0) {
    app.notifier.add({
      type: NotificationType.SUCCESS,
      message: vueI18n.t(
        options.featuresAddedMessage ?? 'components.import.featuresAdded',
        [imported.length],
      ),
    });
  } else {
    app.notifier.add({
      type: NotificationType.ERROR,
      message: vueI18n.t(
        options.nothingAddedMessage ?? 'components.import.nothingAdded',
      ),
    });
  }

  if (options.setStyle) {
    const lastStyle = results.findLast((r) => !!r.style)?.style;
    if (lastStyle) {
      layer.setStyle(lastStyle);
    }
  }

  if (options.setVcsMeta) {
    const lastVcsMeta = results.findLast((r) => !!r.vcsMeta)?.vcsMeta;
    if (lastVcsMeta) {
      layer.setVcsMeta(lastVcsMeta);
    }
  }

  return options.returnValue ?? true;
}

/**
 *
 * @param {function(File[]):boolean|Promise<boolean>} importCallback
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
  check(owner, oneOf(String, vcsAppSymbol));
  check(parentId, String);

  const { action, destroy } = createToggleAction(
    {
      name: `list.import`,
    },
    {
      id: `list-import`,
      parentId,
      component: VcsImportComponent,
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
 * @param {string} [name="list.edit"]
 * @template {Object} T
 * @returns {{action: import("./actionHelper.js").VcsAction, destroy: function(): void}}
 */
export function createListEditAction(
  selection,
  editCallback,
  windowManager,
  owner,
  multiEditorId,
  name = 'list.edit',
) {
  const { action, destroy: destroyEditSelected } = createListItemBulkAction(
    selection,
    {
      name,
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
