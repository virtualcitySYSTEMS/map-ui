/* eslint-disable import/prefer-default-export */

import { reactive } from '@vue/composition-api';
import Vue from 'vue';

const draggableWindowHighestIndex = 50;


/**
 * @typedef Position
 * @property {string | 0} left
 * @property {string | 0} top
 * @property {string | 0} right
 * @property {string | 0} bottom
 */

/**
 * @typedef DraggableWindow
 * @property {boolean} visible
 * @property {string | number} id
 * @property {string | VueComponent} component
 * @property {number} width
 * @property {Position} position
 * @property {Position} defaultPosition
 * @property {string} header
 * @property {string} icon
 */


/** @type {Object<string, Position>} */
export const DRAGGABLE_WINDOW_POSITIONS = {
  topLeft: {
    left: 0,
    top: '48px',
  },
  topRight: {
    right: 0,
    top: '48px',
  },
  bottomRight: {
    right: 0,
    bottom: 0,
  },
};

/**
 * @typedef DraggableWindowState
 * @property {Object.<string, DraggableWindow>} items
 * @property {Object.<string, number>} zIndexMap
 * @property {number} draggableWindowHighestIndex
 */

/** @constant {DraggableWindowState} initialState */
const initialState = {
  items: {},
  zIndexMap: {},
  draggableWindowHighestIndex,
};


/**
 * @class DraggableWindowManager
 * @description Manages a set of Draggable Windows.0-
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
    return this.state.items[viewId];
  }

  /**
   * @param {string} viewId
   * @returns {boolean}
   */
  has(viewId) {
    return !!this.get(viewId);
  }

  /**
   * @param {string | number} viewId
   * @description
   * when this method is called the window needs to be re-registered in order to be shown again.
   * Use this only to destroy a window, for hiding it call toggleViewVisible
   */
  remove(viewId) {
    Vue.delete(this.state.items, viewId);
  }

  /**
   * @param {string} viewId
   * @param {Position} position
   */
  setCoordinates(viewId, position) {
    this.checkIfViewRegistered(viewId);

    const draggableWindow = this.get(viewId);

    const updatedWindow = {
      ...draggableWindow,
      position: { ...position },
    };

    Vue.set(this.state.items, draggableWindow.id, updatedWindow);
  }

  /**
   * @param {DraggableWindow} draggableWindow
   */
  add(draggableWindow) {
    if (!draggableWindow.id) {
      throw new Error(`A draggable window must have an id, got: ${draggableWindow.id}.`);
    }

    if (this.state.items[draggableWindow.id]) {
      throw new Error(`A draggable window with id ${draggableWindow.id} has already been registered.`);
    }

    const updatedZIndex = this.state.zIndexMap[draggableWindow.id] ||
      draggableWindowHighestIndex -
      Object.keys(this.state.items).length;

    Vue.set(this.state.items, draggableWindow.id, draggableWindow);
    Vue.set(this.state.zIndexMap, draggableWindow.id, updatedZIndex);
  }


  /**
   * @param {string} viewId
   */
  bringViewToTop(viewId) {
    this.checkIfViewRegistered(viewId);

    Vue.set(this.state.zIndexMap, viewId, this.state.draggableWindowHighestIndex);

    // Set other windows to back by one each.
    Object.keys(this.state.items)
      .sort((keyA, keyB) => this.state.zIndexMap[keyB] - this.state.zIndexMap[keyA])
      .filter(id => id !== viewId)
      .forEach((id, i) => {
        const zIndex = this.state.draggableWindowHighestIndex - (i + 1);
        Vue.set(this.state.zIndexMap, id, zIndex);
      });
  }

  /**
   * @param {string} viewId
   */
  checkIfViewRegistered = (viewId) => {
    if (!this.has(viewId)) {
      throw new Error(
        `DraggableWindow with id '${viewId}' has not been registered!`,
      );
    }
  };

  hideWindowsInDefaultPosition(viewId) {
    Object.values(this.state.items).forEach((v) => {
      if (
        parseInt(v.position.left, 10) === parseInt(this.state.items[viewId].defaultPosition.left, 10) &&
        parseInt(v.position.top, 10) === parseInt(this.state.items[viewId].defaultPosition.top, 10) &&
        v.id !== this.state.items[viewId].id
      ) {
        Vue.set(this.state.items, v.id, {
          ...v,
          visible: false,
        });
      }
    });
  }

  /**
   * @param {string} viewId
   */
  toggleViewVisible(viewId) {
    const view = this.get(viewId);

    this.checkIfViewRegistered(viewId);

    view.visible = !view.visible;
    // When it is visible, bring it to top, otherwise send it to back.
    if (view.visible) {
      Vue.set(this.state.items, viewId, { ...view });
      Vue.set(this.state.zIndexMap, viewId, draggableWindowHighestIndex);

      this.hideWindowsInDefaultPosition(viewId);
      this.bringViewToTop(viewId);
    } else {
      const updatedZIndex = draggableWindowHighestIndex - Object.keys(this.state.items).length + 1;
      Vue.set(this.state.zIndexMap, viewId, updatedZIndex);
      Vue.set(this.state.items, viewId, {
        ...view,
        position: view.defaultPosition,
      });
    }
  }
}
