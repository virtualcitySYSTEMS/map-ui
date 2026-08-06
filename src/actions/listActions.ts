import type { Ref } from 'vue';
import { reactive, watch } from 'vue';
import { check, oneOf, optional } from '@vcsuite/check';
import { getLogger } from '@vcsuite/logger';
import type { Collection, GeoJSONreadOptions, VectorLayer } from '@vcmap/core';
import { getCaughtError, parseGeoJSON } from '@vcmap/core';
import type Feature from 'ol/Feature.js';
import VcsImportComponent from '../components/import/VcsImportComponent.ts.vue';
import type {
  ActionCallback,
  ActionOptions,
  VcsAction,
  DestroyableAction,
} from './actionHelper.ts';
import { createToggleAction } from './actionHelper.js';
import type WindowManager from '../manager/window/windowManager.js';
import { WindowSlot } from '../manager/window/windowManager.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import { NotificationType } from '../notifier/notifier.js';
import type { VcsListItem } from '../components/lists/listHelper.js';
import type { OwnedAction } from '../manager/collectionManager/collectionManager.js';
import type VcsUiApp from '../vcsUiApp.js';
import type { CollectionComponentListItem } from '../manager/collectionManager/collectionComponentClass.js';

/** Creates an action for deleting an item in a VcsList. */
export function createListItemDeleteAction<T>(
  collection: Collection<T>,
  item: T,
  actionOptions: Partial<ActionOptions> = {},
): VcsAction {
  return {
    name: 'list.deleteItem',
    ...actionOptions,
    callback: (): void => {
      if (collection.has(item)) {
        collection.remove(item);
      }
    },
  };
}

/** Creates an action based on a provided selection */
export function createListItemBulkAction(
  selection: Ref<Array<VcsListItem>>,
  actionOptions?: ActionOptions & { callback: ActionCallback },
): DestroyableAction {
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

export function createListExportAction(
  selection: Ref<Array<VcsListItem>>,
  exportCallback: ActionCallback,
  owner: string | symbol,
): { action: OwnedAction; destroy: () => void } {
  const { action, destroy } = createListItemBulkAction(selection, {
    name: 'list.export',
    callback: exportCallback,
  });

  return {
    action: { action, owner, weight: 99 },
    destroy,
  };
}

type ImportIntoLayerOptions = {
  readOptions?: GeoJSONreadOptions;
  /** Predicate to filter features by */
  predicate?: (feature: Feature) => boolean;
  /** Message to be displayed on predicate failures. Defaults to 'components.import.predicateFailure' */
  predicateFailureMessage?: string;
  /** Message to be displayed if feature could not be added to layer (same id). Defaults to 'components.import.addFailure' */
  addFailureMessage?: string;
  /** Message to be displayed if features where imported. Defaults to 'components.import.featuresAdded' */
  featuresAddedMessage?: string;
  /** Message to be displayed if no features where imported. Defaults to 'components.import.nothingAdded' */
  nothingAddedMessage?: string;
  /** Set the style from the last imported file on the provided layer */
  setStyle?: boolean;
  /** Set vcs meta from the last imported file on the provided layer */
  setVcsMeta?: boolean;
  /** By default true is returned to close the window, this can be overriden. */
  returnValue?: boolean;
};

export async function importIntoLayer(
  files: File[],
  app: VcsUiApp,
  layer: VectorLayer,
  options: ImportIntoLayerOptions = {},
): Promise<boolean> {
  const { vueI18n } = app;
  const results = await Promise.all(
    files.map(async (file) => {
      const text = await file.text();
      try {
        return parseGeoJSON(text, options.readOptions);
      } catch (e: unknown) {
        app.notifier.add({
          type: NotificationType.ERROR,
          message: vueI18n.t('components.import.failure', {
            fileName: file.name,
          }),
        });
        getLogger('import').error(getCaughtError(e).message);
      }
      return { features: [] };
    }),
  );

  const features = results.flatMap((r) => r.features);
  const featureToImport = options.predicate
    ? features.filter((f) => options.predicate?.(f))
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

export function createListImportAction(
  importCallback: (files: File[]) => boolean | Promise<boolean>,
  windowManager: WindowManager,
  owner: string | symbol,
  parentId: string,
): { action: OwnedAction; destroy: () => void } {
  check(importCallback, Function);
  check(owner, oneOf(String, vcsAppSymbol));
  check(parentId, String);

  const { action, destroy } = createToggleAction(
    { name: `list.import` },
    {
      id: `list-import`,
      parentId,
      component: VcsImportComponent,
      slot: WindowSlot.DYNAMIC_CHILD,
      state: { headerTitle: `list.import`, headerIcon: '$vcsPlus' },
      props: { importFiles: importCallback },
    },
    windowManager,
    owner,
  );

  return { action: { action, owner, weight: 98 }, destroy };
}

export function createListEditAction(
  selection: Ref<Array<CollectionComponentListItem>>,
  editCallback: () => void,
  windowManager: WindowManager,
  multiEditorId: string,
  name = 'list.edit',
): DestroyableAction {
  const { action, destroy: destroyEditSelected } = createListItemBulkAction(
    selection,
    { name, callback: editCallback },
  );

  function handleWindowChanged(): void {
    action.active = windowManager.has(multiEditorId);
  }

  const editorStateListener = [
    windowManager.added.addEventListener(handleWindowChanged),
    windowManager.removed.addEventListener(handleWindowChanged),
  ];

  return {
    action,
    destroy: (): void => {
      destroyEditSelected();
      editorStateListener.forEach((cb) => {
        cb();
      });
    },
  };
}
