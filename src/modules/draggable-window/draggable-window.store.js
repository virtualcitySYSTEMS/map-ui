import { getField, updateField } from 'vuex-map-fields';

import { draggableWindowHighestIndex, initialDraggableWindows } from './constants';
import { addWindow, bringViewToTop, toggleViewVisible } from './draggable-window.mutations';


/**
 *
 * @module DraggableWindow
 * @description Module needed to handle state for draggable windows. Import into src/store/index.ts as such:
 * <pre><code>
 * export default new Vuex.Store({
 *   state: {},
 *   getters: {},
 *   mutations: {},
 *   actions: {},
 *   modules: {
 *     draggableWindowStoreModule,
 *   }
 *});
 * </code></pre>
 *
 * In order to have a predictable z-index we pick a fairly high number as the maximum z-index.
 * The number 50 is chosen so we can have a maximum of ~30-40 windows open without colliding with lower z-idexes,
 * yet still low enough to not collide with higher indexes of e.g. Popups.
 * We count down from this number for each new view.
 * Should this range not suffice it can be changed here to something higher.
 */
const draggableWindowStoreModule = {
  namespaced: true,
  state: () => {
    return {
      draggableWindows: initialDraggableWindows,
      draggableWindowHighestIndex,
    };
  },
  getters: {
    getField,
    getViewById: ({ draggableWindows }) => viewId => draggableWindows[viewId],
  },
  mutations: {
    updateField,
    bringViewToTop,
    toggleViewVisible,
    addWindow,
  },
};

export default draggableWindowStoreModule;
