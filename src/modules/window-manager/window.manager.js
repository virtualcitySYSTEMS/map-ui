
import { reactive } from '@vue/composition-api';
import { VcsEvent } from '@vcmap/core';
import Vue from 'vue';
import PositionParser from './util/position-parser';

/**
 * @typedef Position
 * @property {string | 0} left Must be pixel-value string (e.g. '320px')
 * @property {string | 0} top Must be pixel-value string (e.g. '320px')
 * @property {string | 0} right Must be pixel-value string (e.g. '320px')
 * @property {string | 0} bottom Must be pixel-value string (e.g. '320px')
 */

/**
 * @typedef WindowState
 * @property {Object.<string, Window>} items
 * @property {Object.<string, number>} zIndexMap
 * @property {number} zIndexMax
 */

/**
 * @typedef Window
 * @property {boolean} visible
 * @property {string | number} id
 * @property {string | VueComponent} component
 * @property {number} width
 * @property {PositionParser} position
 * @property {Position} defaultPosition
 * @property {string} header
 * @property {string} icon
 */

const zIndexMax = 50;

/** @type {Object<string, PositionParser>} */
export const WINDOW_POSITIONS = {
  topLeft: new PositionParser({
    left: 0,
    top: '48px',
  }),
  topRight: new PositionParser({
    right: 0,
    top: '48px',
  }),
  bottomRight: new PositionParser({
    right: 0,
    bottom: 0,
  }),
};


/**
 * @class WindowManager
 * @description Manages a set of Draggable Windows.0-
 * Should be instanciated with a reactive state and injected at root.
 */
export class WindowManager {
  constructor() {
    this.onAdded = new VcsEvent();
    /** @type {WindowState} */
    this.state = reactive({
      items: {},
      zIndexMap: {},
      zIndexMax,
    });
  }

  /**
   * @param {string} viewId
   * @returns {Window}
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

  toggle(view) {
    if (this.has(view.id)) {
      this.remove(view.id);
    } else {
      this.add(view);
    }
  }

  /**
   * @param {string} viewId
   * @param {Position} position
   */
  setCoordinates(viewId, position) {
    this.checkIfViewRegistered(viewId);

    const window = this.get(viewId);

    const updatedWindow = {
      ...window,
      position: new PositionParser(position),
    };

    Vue.set(this.state.items, window.id, updatedWindow);
  }

  /**
   * @param {Window} window
   */
  add(window) {
    if (!window.id) {
      throw new Error(`A window must have an id, got: ${window.id}.`);
    }

    if (this.get(window.id)) {
      throw new Error(`A window with id ${window.id} has already been registered.`);
    }

    const updatedZIndex = this.state.zIndexMap[window.id] ||
      zIndexMax -
      Object.keys(this.state.items).length;

    Vue.set(this.state.items, window.id, window);
    Vue.set(this.state.zIndexMap, window.id, updatedZIndex);
    this.onAdded.raiseEvent(window);
  }


  /**
   * @param {string} viewId
   */
  bringViewToTop(viewId) {
    Vue.set(this.state.zIndexMap, viewId, this.state.zIndexMax);

    // Set other windows to back by one each.
    Object.keys(this.state.items)
      .sort((keyA, keyB) => this.state.zIndexMap[keyB] - this.state.zIndexMap[keyA])
      .filter(id => id !== viewId)
      .forEach((id, i) => {
        const zIndex = this.state.zIndexMax - (i + 1);
        Vue.set(this.state.zIndexMap, id, zIndex);
      });
  }

  /**
   * @param {string} viewId
   */
  checkIfViewRegistered = (viewId) => {
    if (!this.has(viewId)) {
      throw new Error(
        `Window with id '${viewId}' has not been registered!`,
      );
    }
  };

  /**
   * @param {string} viewId
   */
  hideWindowsInDefaultPosition(viewId) {
    Object.values(this.state.items).forEach((view) => {
      const { defaultPosition } = this.get(viewId);
      if (
        parseInt(view.position.left, 10) === parseInt(defaultPosition.left, 10) &&
        parseInt(view.position.top, 10) === parseInt(defaultPosition.top, 10) &&
        view.id !== viewId
      ) {
        Vue.set(this.state.items, view.id, {
          ...view,
          visible: false,
        });
      }
    });
  }
}
