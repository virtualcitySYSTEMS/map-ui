import { v4 as uuid } from 'uuid';
import { check, maybe, oneOf, optional } from '@vcsuite/check';
import { getLogger } from '@vcsuite/logger';
import type { Layer, OverrideCollection, VcsMap } from '@vcmap/core';
import {
  Collection,
  Extent,
  MapCollection,
  mercatorProjection,
  PanoramaMap,
  Viewpoint,
} from '@vcmap/core';
import { Feature } from 'ol';
import type { Ref } from 'vue';
import { nextTick, reactive, ref } from 'vue';
import { parseBoolean } from '@vcsuite/parsers';
import { vcsAppSymbol } from '../pluginHelper.js';
import type {
  WindowComponentOptions,
  WindowPositionOptions,
} from '../manager/window/windowManager.js';
import type WindowManager from '../manager/window/windowManager.js';
import {
  getFittedWindowPositionOptions,
  getTargetSize,
} from '../manager/window/windowHelper.js';
import SearchComponent from '../search/SearchComponent.ts.vue';
import { searchComponentId } from '../search/helper.js';
import VcsLoadingOverlay from '../components/plugins/VcsLoadingOverlay.ts.vue';
import type VcsUiApp from '../vcsUiApp.js';

export type ActionOptions = Omit<VcsAction, 'callback'>;

export type ActionCallback = (p?: PointerEvent) => void | Promise<void>;

export type VcsAction = {
  /** reactive and translatable name rendered in overflow */
  name: string;
  /** reactive and translatable title rendered as tooltip */
  title?: string;
  /** icon rendered on the button. If no icon provided, item is rendered in overflow */
  icon?: string;
  /** callback function is triggered when the button is clicked */
  callback: ActionCallback;
  /** optional state of button. If active, button is rendered in primary color */
  active?: boolean;
  /** optional hasUpdate of button. If true, a yellow notification is rendered next to the button */
  hasUpdate?: boolean;
  /** optional background state. If active and background, button is rendered in primary color outlined */
  background?: boolean;
  /** optional flag to indicate that the action is disabled */
  disabled?: boolean;
};

export type DestroyableAction = {
  action: VcsAction;
  destroy: () => void;
};

/** merges action options with defaults */
export function getActionFromOptions(
  options: VcsAction | (ActionOptions & { callback: ActionCallback }),
): VcsAction {
  check(options.name, String);
  check(options.title, maybe(String));
  check(options.icon, maybe(String));
  check(options.callback, Function);
  options.active = parseBoolean(options.active, false);
  options.hasUpdate = parseBoolean(options.hasUpdate, false);
  options.background = parseBoolean(options.background, false);
  options.disabled = parseBoolean(options.disabled, false);
  return options;
}

function setupDisablePanorama(map: PanoramaMap, action: VcsAction): () => void {
  const datasetListeners = new Map();

  action.disabled = true;
  const setupDataset = (dataset: Layer): void => {
    datasetListeners.get(dataset.name)?.();
    if (dataset.active) {
      action.disabled = false;
    }

    const listener = dataset.stateChanged.addEventListener(() => {
      if (!dataset.active) {
        action.disabled = ![...map.layerCollection].find(
          (d) => d.active && d.className === 'PanoramaDatasetLayer',
        );
      } else if (dataset.active) {
        action.disabled = false;
      }
    });

    datasetListeners.set(dataset.name, (): void => {
      listener();
      action.disabled = ![...map.layerCollection].find(
        (d) => d.active && d.className === 'PanoramaDatasetLayer',
      );
    });
  };

  let datasetCollectionListeners: (() => void)[] = [];
  const setupDatasets = (): void => {
    datasetCollectionListeners.forEach((cb) => {
      cb();
    });
    datasetListeners.forEach((cb) => {
      cb();
    });
    datasetListeners.clear();

    [...map.layerCollection].forEach(setupDataset);

    datasetCollectionListeners = [
      map.layerCollection.added.addEventListener(setupDataset),
      map.layerCollection.removed.addEventListener((removedDataset) => {
        datasetListeners.get(removedDataset.name)?.();
        datasetListeners.delete(removedDataset.name);
      }),
    ];
  };
  setupDatasets();

  return (): void => {
    datasetCollectionListeners.forEach((cb) => {
      cb();
    });
    datasetListeners.forEach((cb) => {
      cb();
    });
    datasetListeners.clear();
  };
}

export function createMapButtonAction(
  actionOptions: ActionOptions,
  mapName: string,
  maps: OverrideCollection<VcsMap, MapCollection>,
): DestroyableAction {
  check(actionOptions, {
    name: String,
    icon: optional(String),
    title: optional(String),
  });
  check(mapName, String);
  check(maps, MapCollection);

  const active = maps.activeMap?.name === mapName;
  const action = reactive({
    ...actionOptions,
    active,
    async callback(): Promise<void> {
      await maps.setActiveMap(mapName);
    },
  });

  const map = maps.getByKey(mapName);
  let datasetListener: (() => void) | undefined;
  if (map instanceof PanoramaMap) {
    datasetListener = setupDisablePanorama(map, action);
  }
  const destroyListener = maps.mapActivated.addEventListener((activatedMap) => {
    action.active = activatedMap?.name === mapName;
  });

  return {
    action,
    destroy(): void {
      datasetListener?.();
      destroyListener();
    },
  };
}

/** Creates an action which will toggle the given window component (opening & closing the window). The window component must have an id set. */
export function createToggleAction(
  actionOptions: ActionOptions,
  windowComponent: WindowComponentOptions,
  windowManager: WindowManager,
  owner: string | typeof vcsAppSymbol,
): DestroyableAction {
  check(actionOptions, {
    name: String,
    icon: optional(String),
    title: optional(String),
    hasUpdate: optional(Boolean),
  });
  check(windowComponent, { id: String });
  check(owner, oneOf(String, vcsAppSymbol));

  const action = reactive({
    ...actionOptions,
    active: windowManager.has(windowComponent.id),
    callback(): void {
      if (this.active) {
        windowManager.remove(windowComponent.id);
      } else {
        windowManager.add(windowComponent, owner);
      }
    },
  });

  const listeners = [
    windowManager.added.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        action.active = true;
      }
    }),
    windowManager.removed.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        action.active = false;
      }
    }),
  ];

  const destroy = (): void => {
    listeners.forEach((cb) => {
      cb();
    });
  };
  return { action, destroy };
}

function createSearchAction(app: VcsUiApp): DestroyableAction {
  const windowComponent: WindowComponentOptions = {
    id: searchComponentId,
    component: SearchComponent,
    position: { width: 440 },
    state: { hideHeader: true },
    slot: 'dynamicRight',
  };
  const action = reactive({
    name: 'search.title',
    icon: '$vcsSearch',
    title: 'search.tooltip',
    active: false,
    background: false,
    callback(): void {
      if (this.active && !this.background) {
        app.windowManager.remove(searchComponentId);
        this.active = false;
        app.search.clearSearch();
      } else {
        app.windowManager.add(windowComponent, vcsAppSymbol);
      }
    },
  });
  const addedListener = app.windowManager.added.addEventListener(({ id }) => {
    if (id === searchComponentId) {
      action.active = true;
      action.background = false;
    }
  });
  const removedListener = app.windowManager.removed.addEventListener(
    ({ id }) => {
      if (id === searchComponentId) {
        if (app.search.currentResults.value.length) {
          action.active = true;
          action.background = true;
        } else {
          action.active = false;
          action.background = false;
          app.search.clearSearch();
        }
      }
    },
  );

  return {
    action,
    destroy: (): void => {
      addedListener();
      removedListener();
    },
  };
}

/** Creates a toggle button for the search tool, which is only available, if at least one search implementation is registered. */
export function createSearchButtonAction(app: VcsUiApp): {
  searchAction: Ref<VcsAction | null>;
  destroy: () => void;
} {
  let destroyAction = (): void => {};
  const searchAction = ref<VcsAction | null>(null);
  const uiConfig = app.uiConfig.config;

  const determineAction = (): void => {
    if (
      !uiConfig.hideSearch &&
      app.search.size > 0 &&
      searchAction.value === null
    ) {
      const { action, destroy } = createSearchAction(app);
      destroyAction = destroy;
      searchAction.value = action;
    } else if (
      (uiConfig.hideSearch || app.search.size === 0) &&
      searchAction.value !== null
    ) {
      if (app.windowManager.has(searchComponentId)) {
        app.windowManager.remove(searchComponentId);
      }
      destroyAction();
      destroyAction = (): void => {};
      searchAction.value = null;
    }
  };
  determineAction();
  const listeners = [
    app.uiConfig.added.addEventListener(determineAction),
    app.uiConfig.removed.addEventListener(determineAction),
    app.search.added.addEventListener(determineAction),
    app.search.removed.addEventListener(determineAction),
  ];
  const destroy = (): void => {
    destroyAction();
    listeners.forEach((cb) => {
      cb();
    });
  };

  return { searchAction, destroy };
}

/**
 * Creates a header less window which will close if anything outside of the window is clicked. The window will open
 * at the clicked position (the actions position) by default, unless the window component already has a position set.
 */
export function createModalAction(
  actionOptions: ActionOptions,
  modalComponent: WindowComponentOptions,
  app: VcsUiApp,
  owner: string | typeof vcsAppSymbol,
): DestroyableAction {
  check(actionOptions, {
    name: String,
    icon: optional(String),
    title: optional(String),
  });
  check(owner, oneOf(String, vcsAppSymbol));

  const id = uuid();
  const { position: windowPositionOptions, ...component } = modalComponent;
  let modalActivator: HTMLElement | null = null;
  let clickedWindowPosition: { x: number; y: number } | null = null;

  /**
   * Closes the modal at mousedown on an app element
   * Requires mousedown event bubbling on app elements (same behaviour as v-menu).
   */
  const handleMouseDown = (e: MouseEvent): void => {
    const div = document.getElementById(`window-component--${id}`);
    if (
      e.target &&
      e.target instanceof Node &&
      !div?.contains(e.target) &&
      !modalActivator?.contains(e.target)
    ) {
      app.windowManager.remove(id);
    }
  };

  const getPositionOptions = (contentHeight = 0): WindowPositionOptions => {
    const { width, height } = modalActivator!.getBoundingClientRect();
    const fittedPosition = getFittedWindowPositionOptions(
      clickedWindowPosition!.x,
      clickedWindowPosition!.y,
      Number(windowPositionOptions?.width) || 320,
      Number(windowPositionOptions?.height) || contentHeight,
      app.maps.target,
      width,
      height,
    );
    const position = { ...fittedPosition, ...windowPositionOptions };
    const targetSize = getTargetSize(app.maps.target);
    if (contentHeight) {
      if (position.bottom) {
        position.maxHeight = Math.min(
          Number(position.maxHeight) || Infinity,
          clickedWindowPosition!.y - targetSize!.top,
        );
      } else {
        position.maxHeight = Math.min(
          Number(position.maxHeight) || Infinity,
          targetSize!.height - (clickedWindowPosition!.y - targetSize!.top),
        );
      }
    }
    position.maxWidth = 320;
    position.width = windowPositionOptions?.width || -1; // unset width magic. dont touch.
    return position;
  };

  const action = reactive<VcsAction>({
    ...actionOptions,
    active: false,
    callback(event): void {
      if (!this.active) {
        this.active = true;
        modalActivator = event!.currentTarget as HTMLElement;
        clickedWindowPosition = { x: event!.x, y: event!.y };
        const state = { ...modalComponent?.state, hideHeader: true };
        app.windowManager.add(
          { position: getPositionOptions(), ...component, id, state },
          owner,
        );
        document.addEventListener('mousedown', handleMouseDown);
      } else {
        this.active = false;
        app.windowManager.remove(id);
      }
    },
  });

  const listeners = [
    app.windowManager.removed.addEventListener(({ id: windowId }) => {
      if (windowId === id) {
        action.active = false;
        document.removeEventListener('mousedown', handleMouseDown);
      }
    }),
  ];

  // if no height is provided, update fitted window position after actual div size is available
  if (!windowPositionOptions?.height) {
    listeners.push(
      app.windowManager.added.addEventListener(async (added) => {
        if (added.id === id) {
          await nextTick();
          const div = document.getElementById(`window-component--${id}`);
          if (div) {
            app.windowManager.setWindowPositionOptions(
              id,
              getPositionOptions(div.offsetHeight),
            );
          }
        }
      }),
    );
  }

  const destroy = (): void => {
    listeners.forEach((cb) => {
      cb();
    });
  };
  return { action, destroy };
}

/** Creates an action which opens a given link in a new tab */
export function createLinkAction(
  actionOptions: ActionOptions,
  url: string | (() => string),
): VcsAction {
  check(actionOptions, {
    name: String,
    icon: optional(String),
    title: optional(String),
  });
  check(url, oneOf(String, Function));

  return {
    ...actionOptions,
    callback(): void {
      const link = document.createElement('a');
      if (typeof url === 'string') {
        link.href = url;
      } else {
        link.href = url();
      }
      link.target = '_blank';
      link.click();
    },
  };
}

export function createGoToViewpointAction(
  actionOptions: ActionOptions,
  viewpoint: string | Viewpoint,
  viewpointCollection: Collection<Viewpoint>,
  mapCollection: MapCollection,
): VcsAction {
  check(actionOptions, {
    name: String,
    icon: optional(String),
    title: optional(String),
  });
  check(viewpoint, oneOf(Viewpoint, String));
  check(viewpointCollection, Collection);
  check(mapCollection, MapCollection);

  return {
    // @ts-expect-error let title be overwritten
    title: 'content.viewpointAction.title',
    ...actionOptions,
    async callback(): Promise<void> {
      let viewpointItem: Viewpoint | string | undefined = viewpoint;
      if (typeof viewpointItem === 'string') {
        viewpointItem = viewpointCollection.getByKey(viewpoint)!;
      }
      if (viewpointItem && viewpointItem.isValid()) {
        await mapCollection.activeMap?.gotoViewpoint(viewpointItem);
      }
    },
  };
}

/** calculates and returns a viewpoint using feature's extent */
export function getViewpointFromFeature(feature: Feature): Viewpoint | null {
  const extent = new Extent({
    coordinates: feature.getGeometry()?.getExtent?.(),
    projection: mercatorProjection,
  });

  if (!extent || !extent.isValid()) {
    return null;
  }
  return Viewpoint.createViewpointFromExtent(extent);
}

/**
 * Creates an action, which when clicked, zooms to the provided feature
 * @returns returns null if the feature does not have a geometry with a valid extent
 */
export function createZoomToFeatureAction(
  actionOptions: ActionOptions,
  feature: Feature,
  mapCollection: MapCollection,
): VcsAction | null {
  check(actionOptions, {
    name: String,
    icon: optional(String),
    title: optional(String),
  });
  check(feature, Feature);
  check(mapCollection, MapCollection);

  return {
    // @ts-expect-error let title be overwritten
    title: 'search.zoomToFeatureAction',
    ...actionOptions,
    async callback(): Promise<void> {
      const viewpoint = getViewpointFromFeature(feature);
      if (viewpoint && viewpoint.isValid()) {
        await mapCollection.activeMap?.gotoViewpoint(viewpoint);
      }
    },
  };
}

/** Calls the callback of an action and handles potential error. */
export function callSafeAction(action: VcsAction, p?: PointerEvent): void {
  const logError = (e: unknown): void => {
    getLogger(action.name).error(
      `Error while calling the ${action.title ?? action.name} callback:`,
      e,
    );
  };
  try {
    const optPromise = action.callback(p);
    if (optPromise instanceof Promise) {
      optPromise.catch(logError);
    }
  } catch (e) {
    logError(e);
  }
}

type LoadingOverlayOptions = {
  id?: string;
  progress?: Ref<number>;
  title?: string;
  text?: string;
  cancel?: () => void;
  maxWidth?: number | string;
  persistent?: boolean;
};

/**
 * Adds a loading overlay to the application.
 * @param owner The owner of the loading overlay.
 * @param options The options for the loading overlay, passed as props.
 * @returns A function to remove the loading overlay.
 */
export function addLoadingOverlay(
  app: VcsUiApp,
  owner: string | typeof vcsAppSymbol,
  options?: LoadingOverlayOptions,
): () => void {
  check(owner, oneOf(String, Symbol));
  check(options?.progress?.value, optional(Number));

  const id = options?.id || `loading-overlay-${uuid()}`;
  const removeWindow = (): void => {
    if (app.windowManager.has(id)) {
      app.windowManager.remove(id);
    }
  };
  app.windowManager.add(
    {
      component: VcsLoadingOverlay,
      id,
      state: { hideHeader: true, styles: { display: 'none !important' } },
      props: {
        ...options,
        cancellable: !!options?.cancel,
        onCancel: () => {
          options?.cancel?.();
          removeWindow();
        },
      },
    },
    owner,
  );
  return removeWindow;
}
