import { check } from '@vcsuite/check';
import { MapCollection } from '@vcmap/core';
import { vcsAppSymbol } from '../pluginHelper.js';

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
        windowManager.add(windowComponent, owner);
      }
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
