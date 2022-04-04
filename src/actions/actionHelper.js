import { v4 as uuid } from 'uuid';
import { check } from '@vcsuite/check';
import { Collection, MapCollection, ViewPoint } from '@vcmap/core';
import { vcsAppSymbol } from '../pluginHelper.js';
import { getWindowPositionOptions } from '../manager/window/windowManager.js';

/**
 * @typedef {Object} ActionOptions
 * @property {string} name
 * @property {string} [title]
 * @property {string} [icon]
 */

/**
 * @param {ActionOptions} actionOptions
 * @param {string} mapName
 * @param {OverrideMapCollection} maps
 * @returns {{action: VcsAction, destroy: Function}}
 */
export function createMapButtonAction(actionOptions, mapName, maps) {
  check(actionOptions, {
    name: String,
    icon: [undefined, String],
    title: [undefined, String],
  });
  check(mapName, String);
  check(maps, MapCollection);

  const action = {
    ...actionOptions,
    active: false,
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
 * @param {WindowComponentOptions} windowComponent
 * @param {WindowManager}  windowManager
 * @param {string|symbol} owner
 * @returns {{action: VcsAction, destroy: Function}}
 */
export function createToggleAction(actionOptions, windowComponent, windowManager, owner) {
  check(actionOptions, {
    name: String,
    icon: [undefined, String],
    title: [undefined, String],
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

  const destroy = () => { listeners.forEach((cb) => { cb(); }); };
  return { action, destroy };
}

/**
 * Creates a header less window which will close if anything outside of the window is clicked. The window will open
 * at the clicked position (the actions position) by default, unless the window component already has a position set.
 * @param {ActionOptions} actionOptions
 * @param {WindowComponentOptions} modalComponent
 * @param {WindowManager}  windowManager
 * @param {string|symbol} owner
 * @returns {{action: VcsAction, destroy: Function}}
 */
export function createModalAction(actionOptions, modalComponent, windowManager, owner) {
  check(actionOptions, {
    name: String,
    icon: [undefined, String],
    title: [undefined, String],
  });
  check(owner, [String, vcsAppSymbol]);

  const id = uuid();

  const addModal = (zIndex) => {
    const child = document.getElementById(id);
    if (!child) {
      const elem = document.createElement('div');
      elem.id = id;
      Object.assign(elem.style, {
        position: 'absolute',
        zIndex,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      });
      elem.onclick = () => { windowManager.remove(id); };
      document.body.appendChild(elem);
    }
  };

  const removeModal = () => {
    const child = document.getElementById(id);
    if (child) {
      child.parentElement.removeChild(child);
    }
  };

  const action = {
    ...actionOptions,
    active: false,
    callback(event) {
      if (!this.active) {
        this.active = true;
        const { left, top, width } = event.currentTarget.getBoundingClientRect();
        const position = getWindowPositionOptions(left + width, top);
        const state = { ...modalComponent?.state, hideHeader: true };
        windowManager.add({ position, ...modalComponent, id, state }, owner);
        addModal(windowManager.componentIds.length - 2);
      } else {
        this.active = false;
        windowManager.remove(id);
      }
      return null;
    },
  };

  const listeners = [
    windowManager.removed.addEventListener(({ id: windowId }) => {
      if (windowId === id) {
        action.active = false;
        removeModal();
      }
    }),
    removeModal,
  ];

  const destroy = () => { listeners.forEach((cb) => { cb(); }); };
  return { action, destroy };
}

/**
 * Creates an action which opens a given link in a new tab
 * @param {ActionOptions} actionOptions
 * @param {string} url
 * @returns {VcsAction}
 */
export function createLinkAction(actionOptions, url) {
  check(actionOptions, {
    name: String,
    icon: [undefined, String],
    title: [undefined, String],
  });
  check(url, String);

  return {
    ...actionOptions,
    callback() {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.click();
    },
  };
}

/**
 * @param {ActionOptions} actionOptions
 * @param {string|import("@vcmap/core").ViewPoint} viewpoint
 * @param {import("@vcmap/core").Collection<import("@vcmap/core").ViewPoint>} viewpointCollection
 * @param {import("@vcmap/core").MapCollection} mapCollection
 * @returns {VcsAction}
 */
export function createGoToViewpointAction(actionOptions, viewpoint, viewpointCollection, mapCollection) {
  check(actionOptions, {
    name: String,
    icon: [undefined, String],
    title: [undefined, String],
  });
  check(viewpoint, [ViewPoint, String]);
  check(viewpointCollection, Collection);
  check(mapCollection, MapCollection);

  return {
    ...actionOptions,
    async callback() {
      let viewpointItem = viewpoint;
      if (typeof viewpointItem === 'string') {
        viewpointItem = viewpointCollection.getByKey(viewpoint);
      }
      if (viewpointItem) {
        await mapCollection.activeMap.gotoViewPoint(viewpointItem);
      }
    },
  };
}
