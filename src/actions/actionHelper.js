import { v4 as uuid } from 'uuid';
import { check, maybe, oneOf, optional } from '@vcsuite/check';
import { getLogger } from '@vcsuite/logger';
import {
  Collection,
  Extent,
  MapCollection,
  mercatorProjection,
  PanoramaMap,
  Viewpoint,
} from '@vcmap/core';
import { Feature } from 'ol';
import { nextTick, reactive, ref } from 'vue';
import { parseBoolean } from '@vcsuite/parsers';
import { vcsAppSymbol } from '../pluginHelper.js';
import { WindowSlot } from '../manager/window/windowManager.js';
import {
  getFittedWindowPositionOptions,
  getTargetSize,
} from '../manager/window/windowHelper.js';
import SearchComponent from '../search/SearchComponent.vue';

/**
 * @typedef {Omit<VcsAction, 'callback'>} ActionOptions
 */

/**
 * @typedef {(p?: PointerEvent) => (void | Promise<void>)} ActionCallback
 */

/**
 * @typedef {Object} VcsAction
 * @property {string} name - reactive and translatable name rendered in overflow
 * @property {string} [title] - reactive and translatable title rendered as tooltip
 * @property {string} [icon] - icon rendered on the button. If no icon provided, item is rendered in overflow
 * @property {ActionCallback} callback - callback function is triggered when the button is clicked
 * @property {boolean} [active=false] - optional state of button. If active, button is rendered in primary color
 * @property {boolean} [hasUpdate=false] - optional hasUpdate of button. If true, a yellow notification is rendered next to the button
 * @property {boolean} [background=false] - optional background state. If active and background, button is rendered in primary color outlined
 * @property {boolean} [disabled=false] - optional flag to indicate that the action is disabled
 */

/**
 * merges action options with defaults
 * @param {VcsAction|ActionOptions & { callback: ActionCallback}} options
 * @returns {VcsAction}
 */
export function getActionFromOptions(options) {
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

/**
 * @param {import("@vcmap/core").PanoramaMap} map
 * @param {import("../actions/actionHelper.js").VcsAction} action
 * @returns {() => void}
 */
function setupDisablePanorama(map, action) {
  const datasetListeners = new Map();

  action.disabled = true;
  const setupDataset = (dataset) => {
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

    datasetListeners.set(dataset.name, () => {
      listener();
      action.disabled = ![...map.layerCollection].find(
        (d) => d.active && d.className === 'PanoramaDatasetLayer',
      );
    });
  };

  let datasetCollectionListeners = [];
  const setupDatasets = () => {
    datasetCollectionListeners.forEach((cb) => cb());
    datasetListeners.forEach((cb) => cb());
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

  return () => {
    datasetCollectionListeners.forEach((cb) => cb());
    datasetListeners.forEach((cb) => cb());
    datasetListeners.clear();
  };
}

/**
 * @param {ActionOptions} actionOptions
 * @param {string} mapName
 * @param {import("@vcmap/core").OverrideCollection<import("@vcmap/core").VcsMap, import("@vcmap/core").MapCollection>} maps
 * @returns {{action: VcsAction, destroy: () => void}}
 */
export function createMapButtonAction(actionOptions, mapName, maps) {
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
    callback() {
      maps.setActiveMap(mapName);
    },
  });

  const map = maps.getByKey(mapName);
  let datasetListener;
  if (map instanceof PanoramaMap) {
    datasetListener = setupDisablePanorama(map, action);
  }
  const destroyListener = maps.mapActivated.addEventListener((activatedMap) => {
    action.active = activatedMap?.name === mapName;
  });

  return {
    action,
    destroy() {
      datasetListener?.();
      destroyListener();
    },
  };
}

/**
 * Creates an action which will toggle the given window component (opening & closing the window). The window component must have an id set.
 * @param {ActionOptions} actionOptions
 * @param {import("../manager/window/windowManager.js").WindowComponentOptions} windowComponent
 * @param {import("../manager/window/windowManager.js").default}  windowManager
 * @param {string|symbol} owner
 * @returns {{action: VcsAction, destroy: function(): void}}
 */
export function createToggleAction(
  actionOptions,
  windowComponent,
  windowManager,
  owner,
) {
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
    callback() {
      if (this.active) {
        windowManager.remove(windowComponent.id);
      } else {
        return windowManager.add(windowComponent, owner);
      }
      return null;
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

  const destroy = () => {
    listeners.forEach((cb) => {
      cb();
    });
  };
  return { action, destroy };
}

export const searchComponentId = 'searchId';

/**
 * @param {import("../vcsUiApp.js").default} app
 * @returns {{action: import("vue").UnwrapRef<VcsAction>, destroy: function():void}}
 */
function createSearchAction(app) {
  const windowComponent = {
    id: searchComponentId,
    component: SearchComponent,
    position: { width: 440 },
    state: { hideHeader: true },
    slot: WindowSlot.DYNAMIC_RIGHT,
  };
  const action = reactive({
    name: 'search.title',
    icon: '$vcsSearch',
    title: 'search.tooltip',
    active: false,
    background: false,
    callback() {
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
    destroy: () => {
      addedListener();
      removedListener();
    },
  };
}

/**
 * Creates a toggle button for the search tool, which is only available, if at least one search implementation is registered.
 * @param {import("../vcsUiApp.js").default} app
 * @returns {{ searchAction: import("vue").Ref<import("vue").UnwrapRef<VcsAction>|null>, destroy: function():void }}
 */
export function createSearchButtonAction(app) {
  let destroyAction = () => {};
  const searchAction = ref(null);
  const uiConfig = app.uiConfig.config;

  const determineAction = () => {
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
      destroyAction = () => {};
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
  const destroy = () => {
    destroyAction();
    listeners.forEach((cb) => {
      cb();
    });
  };

  return { searchAction, destroy };
}

/**
 * Creates an action which will toggle the overview map (opening & closing the window and activating/ deactivating the overview map).
 * @param {import("../navigation/overviewMap.js").default} overviewMap
 * @param {import("../manager/window/windowManager.js").WindowComponentOptions} windowComponent
 * @param {import("../manager/window/windowManager.js").default}  windowManager
 * @returns {{action: VcsAction, destroy: function(): void}}
 */
export function createOverviewMapAction(
  overviewMap,
  windowComponent,
  windowManager,
) {
  const { action, destroy } = createToggleAction(
    {
      name: 'overviewMapToggle',
      icon: '$vcsMap',
      title: 'navigation.overviewMapTooltip',
    },
    windowComponent,
    windowManager,
    vcsAppSymbol,
  );

  const listeners = [
    windowManager.added.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        overviewMap.activate().catch((e) => {
          getLogger('createOverviewMapAction').error(
            'failed to activate overview map',
            e,
          );
          windowManager.remove(windowComponent.id);
        });
      }
    }),
    windowManager.removed.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        overviewMap.deactivate();
      }
    }),
  ];

  const destroyAction = () => {
    destroy();
    listeners.forEach((cb) => {
      cb();
    });
  };
  return { action, destroy: destroyAction };
}

/**
 * Creates a header less window which will close if anything outside of the window is clicked. The window will open
 * at the clicked position (the actions position) by default, unless the window component already has a position set.
 * @param {ActionOptions} actionOptions
 * @param {import("../manager/window/windowManager.js").WindowComponentOptions} modalComponent
 * @param {import("../vcsUiApp.js").default}  app
 * @param {string|symbol} owner
 * @returns {{action: VcsAction, destroy: function(): void}}
 */
export function createModalAction(actionOptions, modalComponent, app, owner) {
  check(actionOptions, {
    name: String,
    icon: optional(String),
    title: optional(String),
  });
  check(owner, oneOf(String, vcsAppSymbol));

  const id = uuid();
  const { position: windowPositionOptions, ...component } = modalComponent;
  let modalActivator = null;
  let clickedWindowPosition = null;

  /**
   * Closes the modal at mousedown on an app element
   * Requires mousedown event bubbling on app elements (same behaviour as v-menu).
   * @param {MouseEvent} e
   */
  const handleMouseDown = (e) => {
    const div = document.getElementById(`window-component--${id}`);
    if (!div?.contains(e.target) && !modalActivator?.contains(e.target)) {
      app.windowManager.remove(id);
    }
  };

  const getPositionOptions = (contentHeight = 0) => {
    const { width, height } = modalActivator.getBoundingClientRect();
    const fittedPosition = getFittedWindowPositionOptions(
      clickedWindowPosition.x,
      clickedWindowPosition.y,
      windowPositionOptions?.width || 320,
      windowPositionOptions?.height || contentHeight,
      app.maps.target,
      width,
      height,
    );
    const position = {
      ...fittedPosition,
      ...windowPositionOptions,
    };
    const targetSize = getTargetSize(app.maps.target);
    if (contentHeight) {
      if (position.bottom) {
        position.maxHeight = Math.min(
          position.maxHeight ?? Infinity,
          clickedWindowPosition.y - targetSize.top,
        );
      } else {
        position.maxHeight = Math.min(
          position.maxHeight ?? Infinity,
          targetSize.height - (clickedWindowPosition.y - targetSize.top),
        );
      }
    }
    position.maxWidth = 320;
    position.width = windowPositionOptions?.width || -1; // unset width magic. dont touch.
    return position;
  };

  const action = reactive({
    ...actionOptions,
    active: false,
    callback(event) {
      if (!this.active) {
        this.active = true;
        modalActivator = event.currentTarget;
        clickedWindowPosition = { x: event.x, y: event.y };
        const state = { ...modalComponent?.state, hideHeader: true };
        app.windowManager.add(
          {
            position: getPositionOptions(),
            ...component,
            id,
            state,
          },
          owner,
        );
        document.addEventListener('mousedown', handleMouseDown);
      } else {
        this.active = false;
        app.windowManager.remove(id);
      }
      return null;
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

  const destroy = () => {
    listeners.forEach((cb) => {
      cb();
    });
  };
  return { action, destroy };
}

/**
 * Creates an action which opens a given link in a new tab
 * @param {ActionOptions} actionOptions
 * @param {string|function():string} url
 * @returns {VcsAction}
 */
export function createLinkAction(actionOptions, url) {
  check(actionOptions, {
    name: String,
    icon: optional(String),
    title: optional(String),
  });
  check(url, oneOf(String, Function));

  return {
    ...actionOptions,
    callback() {
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

/**
 * @param {ActionOptions} actionOptions
 * @param {string|import("@vcmap/core").Viewpoint} viewpoint
 * @param {import("@vcmap/core").Collection<import("@vcmap/core").Viewpoint>} viewpointCollection
 * @param {import("@vcmap/core").MapCollection} mapCollection
 * @returns {VcsAction}
 */
export function createGoToViewpointAction(
  actionOptions,
  viewpoint,
  viewpointCollection,
  mapCollection,
) {
  check(actionOptions, {
    name: String,
    icon: optional(String),
    title: optional(String),
  });
  check(viewpoint, oneOf(Viewpoint, String));
  check(viewpointCollection, Collection);
  check(mapCollection, MapCollection);

  return {
    title: 'content.viewpointAction.title',
    ...actionOptions,
    async callback() {
      let viewpointItem = viewpoint;
      if (typeof viewpointItem === 'string') {
        viewpointItem = viewpointCollection.getByKey(viewpoint);
      }
      if (viewpointItem) {
        await mapCollection.activeMap.gotoViewpoint(viewpointItem);
      }
    },
  };
}

/**
 * calculates and returns a viewpoint using feature's extent
 * @param {import("ol").Feature} feature
 * @returns {Viewpoint|null}
 */
export function getViewpointFromFeature(feature) {
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
 * @param {ActionOptions} actionOptions
 * @param {import("ol").Feature} feature
 * @param {import("@vcmap/core").MapCollection} mapCollection
 * @returns {VcsAction|null} returns null if the feature does not have a geometry with a valid extent
 */
export function createZoomToFeatureAction(
  actionOptions,
  feature,
  mapCollection,
) {
  check(actionOptions, {
    name: String,
    icon: optional(String),
    title: optional(String),
  });
  check(feature, Feature);
  check(mapCollection, MapCollection);

  return {
    title: 'search.zoomToFeatureAction',
    ...actionOptions,
    async callback() {
      const viewpoint = getViewpointFromFeature(feature);
      if (viewpoint && viewpoint.isValid()) {
        await mapCollection.activeMap.gotoViewpoint(viewpoint);
      }
    },
  };
}

/**
 * Calls the callback of an action and handles potential error.
 * @param {VcsAction} action
 * @param {PointerEvent} [p]
 */
export function callSafeAction(action, p) {
  const logError = (e) =>
    getLogger(action.name).error(
      `Error while calling the ${action.title ?? action.name} callback:`,
      e,
    );
  try {
    const optPromise = action.callback(p);
    if (optPromise instanceof Promise) {
      optPromise.catch(logError);
    }
  } catch (e) {
    logError(e);
  }
}
