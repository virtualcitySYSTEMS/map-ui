import { v4 as uuid } from 'uuid';
import { check, checkMaybe } from '@vcsuite/check';
import {
  Collection,
  Extent,
  MapCollection,
  mercatorProjection,
  Viewpoint,
} from '@vcmap/core';
import { Feature } from 'ol';
import { reactive, ref } from 'vue';
import { parseBoolean } from '@vcsuite/parsers';
import { vcsAppSymbol } from '../pluginHelper.js';
import { WindowSlot } from '../manager/window/windowManager.js';
import {
  getFittedWindowPositionOptionsFromMapEvent,
  getTargetSize,
} from '../manager/window/windowHelper.js';
import SearchComponent from '../search/SearchComponent.vue';

/**
 * @typedef {Object} ActionOptions
 * @property {string} name
 * @property {string} [title]
 * @property {string} [icon]
 */

/**
 * @typedef {function(PointerEvent): void | Promise<void>} ActionCallback
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
  checkMaybe(options.title, String);
  checkMaybe(options.icon, String);
  check(options.callback, Function);
  options.active = parseBoolean(options.active, false);
  options.hasUpdate = parseBoolean(options.hasUpdate, false);
  options.background = parseBoolean(options.background, false);
  options.disabled = parseBoolean(options.disabled, false);
  return options;
}

/**
 * @param {ActionOptions} actionOptions
 * @param {string} mapName
 * @param {import("@vcmap/core").OverrideMapCollection<import("@vcmap/core").VcsMap>} maps
 * @returns {{action: VcsAction, destroy: () => void}}
 */
export function createMapButtonAction(actionOptions, mapName, maps) {
  check(actionOptions, {
    name: String,
    icon: [undefined, String],
    title: [undefined, String],
  });
  check(mapName, String);
  check(maps, MapCollection);

  const active = maps.activeMap?.name === mapName;
  const action = {
    ...actionOptions,
    active,
    callback() {
      maps.setActiveMap(mapName);
    },
  };
  const destroyListener = maps.mapActivated.addEventListener((map) => {
    action.active = map.name === mapName;
  });

  return { action, destroy: destroyListener };
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
    icon: [undefined, String],
    title: [undefined, String],
    hasUpdate: [undefined, Boolean],
  });
  check(windowComponent, { id: String });
  check(owner, [String, vcsAppSymbol]);

  const action = {
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
  };

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

/**
 * Creates a toggle button for the search tool, which is only available, if at least one search implementation is registered.
 * @param {import("../vcsUiApp.js").default} app
 * @returns {{ searchAction: import("vue").Ref<import("vue").UnwrapRef<VcsAction>|null>, destroy: function():void }}
 */
export function createSearchButtonAction(app) {
  let destroyAction = () => {};
  const searchAction = ref(null);
  const determineAction = () => {
    if (app.windowManager.has('searchId')) {
      app.windowManager.remove('searchId');
    }
    if (app.search.size > 0 && searchAction.value === null) {
      const action = createToggleAction(
        {
          name: 'search.title',
          icon: '$vcsSearch',
          title: 'search.tooltip',
        },
        {
          id: 'searchId',
          component: SearchComponent,
          state: { hideHeader: true },
          slot: WindowSlot.DYNAMIC_RIGHT,
          position: {
            width: 440,
          },
        },
        app.windowManager,
        vcsAppSymbol,
      );
      destroyAction = action.destroy;
      searchAction.value = reactive(action.action);
    } else if (searchAction.value !== null) {
      destroyAction();
      destroyAction = () => {};
      searchAction.value = null;
    }
  };
  determineAction();
  const listeners = [
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
 * @returns {(function(): void)|*}
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
    windowManager.added.addEventListener(async ({ id }) => {
      if (id === windowComponent.id) {
        await overviewMap.activate();
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
    icon: [undefined, String],
    title: [undefined, String],
  });
  check(owner, [String, vcsAppSymbol]);

  const id = uuid();
  const { position: windowPositionOptions, ...component } = modalComponent;
  let modalActivator = null;

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

  const action = {
    ...actionOptions,
    active: false,
    callback(event) {
      if (!this.active) {
        this.active = true;
        const { left, top, width } =
          event.currentTarget.getBoundingClientRect();
        modalActivator = event.currentTarget;
        const position = {
          ...getFittedWindowPositionOptionsFromMapEvent(
            { x: left + width, y: top - getTargetSize(app.maps.target).top },
            windowPositionOptions?.width || 320,
            windowPositionOptions?.height || 0,
            app.maps.target,
          ),
          ...windowPositionOptions,
        };
        position.maxWidth = 320;
        position.width = windowPositionOptions?.width || -1; // unset width magic. dont touch.
        const state = { ...modalComponent?.state, hideHeader: true };
        app.windowManager.add({ position, ...component, id, state }, owner);
        document.addEventListener('mousedown', handleMouseDown);
      } else {
        this.active = false;
        app.windowManager.remove(id);
      }
      return null;
    },
  };

  const listeners = [
    app.windowManager.removed.addEventListener(({ id: windowId }) => {
      if (windowId === id) {
        action.active = false;
        document.removeEventListener('mousedown', handleMouseDown);
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

/**
 * Creates an action which opens a given link in a new tab
 * @param {ActionOptions} actionOptions
 * @param {string|function():string} url
 * @returns {VcsAction}
 */
export function createLinkAction(actionOptions, url) {
  check(actionOptions, {
    name: String,
    icon: [undefined, String],
    title: [undefined, String],
  });
  check(url, [String, Function]);

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
    icon: [undefined, String],
    title: [undefined, String],
  });
  check(viewpoint, [Viewpoint, String]);
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
 * @param {import("ol").Feature<import("ol/geom/Geometry").default>} feature
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
 * @param {import("ol").Feature<import("ol/geom/Geometry").default>} feature
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
    icon: [undefined, String],
    title: [undefined, String],
  });
  check(feature, Feature);
  check(mapCollection, MapCollection);

  const viewpoint = getViewpointFromFeature(feature);

  return {
    title: 'search.zoomToFeatureAction',
    ...actionOptions,
    async callback() {
      await mapCollection.activeMap.gotoViewpoint(viewpoint);
    },
  };
}

/**
 * Creates an action for renaming an item in a VcsList.
 * @param {import("../components/lists/VcsList.vue").VcsListItem} item
 * @param {ActionOptions} [actionOptions={}]
 * @returns {VcsAction}
 */
export function createRenameAction(item, actionOptions = {}) {
  return {
    name: 'list.renameAction.title',
    callback: () => {
      item.rename = true;
    },
    ...actionOptions,
  };
}
