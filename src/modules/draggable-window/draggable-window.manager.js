/* eslint-disable import/prefer-default-export */

import { reactive } from '@vue/composition-api';
import DraggableWindowId from './draggable-window-id';


const draggableWindowHighestIndex = 50;

/**
 * @typedef DraggableWindow
 * @property {boolean} visible
 * @property {number} zIndex
 * @property {string | number} id
 */

/**
 * @typedef DraggableWindowState
 * @property {Object.<string, DraggableWindow>} draggableWindows
 * @property {number} draggableWindowHighestIndex
 */

/** @constant {DraggableWindowState} initialState */
const initialState = {
  draggableWindows: {
    [DraggableWindowId.LayerTree]: {
      visible: true,
      zIndex: 50,
      id: DraggableWindowId.LayerTree,
    },
  },
  draggableWindowHighestIndex,
};


/**
 * @class DraggableWindowManager
 * @description Manages a set of Draggable Windows.
 * Should be instanciated with a reactive state and injected at root.
 */
export class DraggableWindowManager {
  /**
   * @type {DraggableWindowState}
   */
  state;

  /**
   * @constructor
   * @param {DraggableWindowState} state
   */
  constructor(state) {
    if (state) {
      this.state = state;
    } else {
      this.state = reactive(initialState);
    }
  }

  /**
   * @param {string} viewId
   * @returns {DraggableWindow}
   */
  get(viewId) {
    return this.state.draggableWindows[viewId];
  }

  /**
   * @param {string} viewId
   * @returns {boolean}
   */
  has(viewId) {
    return !!this.get(viewId);
  }

  /**
   * @param {string} viewId
   * @param {DraggableWindow} view
   */
  add(viewId, view) {
    if (!viewId) {
      throw new Error(`A draggable window must have an id, got: ${viewId}.`);
    }

    if (this.state.draggableWindows[viewId]) {
      throw new Error(`A draggable window with id ${viewId} has already been registered.`);
    }

    this.state.draggableWindows[viewId] = {
      id: viewId,
      ...view,
      zIndex:
        view.zIndex ||
        draggableWindowHighestIndex -
        Object.keys(this.state.draggableWindows).length,
    };
  }

  /**
   * @param {string} viewId
   */
  remove(viewId) {
    if (!this.has(viewId)) {
      throw new Error(`View with ID ${viewId} has not been registered, so it cannot be removed.`);
    }

    delete this.state.draggableWindows[viewId];
  }


  /**
   * @param {string} viewId
   */
  bringViewToTop(viewId) {
    const { draggableWindows } = this.state;
    const view = this.get(viewId);

    if (view.zIndex === draggableWindowHighestIndex) {
      return;
    }

    this.checkIfViewRegistered(view, viewId);

    draggableWindows[viewId] = {
      ...view,
      zIndex: draggableWindowHighestIndex,
    };

    // Set other windows to back by one each.
    Object.keys(draggableWindows)
      .sort((keyA, keyB) => draggableWindows[keyB].zIndex - draggableWindows[keyA].zIndex)
      .filter((id) => { return id !== viewId; })
      .forEach((id, i) => {
        const zIndex = draggableWindowHighestIndex - (i + 1);
        draggableWindows[id] = {
          ...draggableWindows[id],
          zIndex,
        };
      });
  }

  /**
   * @param {DraggableWindow} view
   * @param {string} viewId
   */
  checkIfViewRegistered = (view, viewId) => {
    if (!view || !this.has(viewId)) {
      throw new Error(
        `DraggableWindow with id '${viewId}' has not been registered!`,
      );
    }
  };

  /**
   * @param {string} viewId
   */
  toggleViewVisible(viewId) {
    const view = this.get(viewId);

    this.checkIfViewRegistered(view, viewId);

    view.visible = !view.visible;
    // When it is visible, bring it to top, otherwise send it to back.
    if (view.visible) {
      this.state.draggableWindows[viewId] = {
        ...view,
        zIndex: draggableWindowHighestIndex,
      };
    } else {
      this.state.draggableWindows[viewId] = {
        ...view,
        zIndex:
          draggableWindowHighestIndex -
          Object.keys(this.state.draggableWindows).length + 1,
      };
    }
  }
}
