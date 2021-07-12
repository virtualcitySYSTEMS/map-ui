/* eslint-disable import/prefer-default-export */

// eslint-disable-next-line max-classes-per-file
import { reactive } from '@vue/composition-api';
import { Subject } from 'rxjs';
import Vue from 'vue';
import PositionParser from './util/position-parser';

const zIndexMax = 50;

/**
 * @typedef Position
 * @property {string | 0} left Must be pixel-value string (e.g. '320px')
 * @property {string | 0} top Must be pixel-value string (e.g. '320px')
 * @property {string | 0} right Must be pixel-value string (e.g. '320px')
 * @property {string | 0} bottom Must be pixel-value string (e.g. '320px')
 */


/**
 * @typedef DraggableWindow
 * @property {boolean} visible
 * @property {string | number} id
 * @property {string | VueComponent} component
 * @property {number} width
 * @property {PositionParser} position
 * @property {Position} defaultPosition
 * @property {string} header
 * @property {string} icon
 */


/** @type {Object<string, PositionParser>} */
export const DRAGGABLE_WINDOW_POSITIONS = {
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
 * @typedef DraggableWindowState
 * @property {Object.<string, DraggableWindow>} items
 * @property {Object.<string, number>} zIndexMap
 * @property {number} zIndexMax
 */

/** @constant {DraggableWindowState} initialState */
const initialState = {
  items: {},
  zIndexMap: {},
  zIndexMax,
};


/**
 * @class DraggableWindowManager
 * @description Manages a set of Draggable Windows.0-
 * Should be instanciated with a reactive state and injected at root.
 */
export class DraggableWindowManager {
  /** @type {DraggableWindowState} */
  state;

  onAdded = new Subject();

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

    const draggableWindow = this.get(viewId);

    const updatedWindow = {
      ...draggableWindow,
      position: new PositionParser(position),
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

    if (this.get(draggableWindow.id)) {
      throw new Error(`A draggable window with id ${draggableWindow.id} has already been registered.`);
    }

    const updatedZIndex = this.state.zIndexMap[draggableWindow.id] ||
      zIndexMax -
      Object.keys(this.state.items).length;

    Vue.set(this.state.items, draggableWindow.id, draggableWindow);
    Vue.set(this.state.zIndexMap, draggableWindow.id, updatedZIndex);
    this.onAdded.next(draggableWindow);
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
        `DraggableWindow with id '${viewId}' has not been registered!`,
      );
    }
  };

  /**
   * @param {string} viewId
   */
  hideWindowsInDefaultPosition(viewId) {
    Object.values(this.state.items).forEach((v) => {
      const { defaultPosition } = this.get(viewId);
      if (
        parseInt(v.position.left, 10) === parseInt(defaultPosition.left, 10) &&
        parseInt(v.position.top, 10) === parseInt(defaultPosition.top, 10) &&
        v.id !== viewId
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
  // toggleViewVisible(viewId) {
  //   const view = this.get(viewId);

  //   this.checkIfViewRegistered(viewId);

  //   // When it is visible, bring it to top, otherwise send it to back.
  //   if (view.visible) {
  //     Vue.set(this.state.items, viewId, { ...view });
  //     Vue.set(this.state.zIndexMap, viewId, zIndexMax);

  //     this.hideWindowsInDefaultPosition(viewId);
  //     this.bringViewToTop(viewId);
  //   } else {
  //     const updatedZIndex = zIndexMax - Object.keys(this.state.items).length + 1;
  //     Vue.set(this.state.zIndexMap, viewId, updatedZIndex);
  //     Vue.set(this.state.items, viewId, {
  //       ...view,
  //       position: new PositionParser(view.defaultPosition),
  //     });
  //   }
  // }
}
