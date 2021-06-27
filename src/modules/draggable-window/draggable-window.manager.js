/* eslint-disable import/prefer-default-export */

import { reactive } from '@vue/composition-api';
import LayerTree from '@/components/LayerTree.vue';
import Vue from 'vue';
import DraggableWindowId from './draggable-window-id';

const draggableWindowHighestIndex = 50;

/**
 * @typedef DraggableWindow
 * @property {boolean} visible
 * @property {number} zIndex
 * @property {string | number} id
 * @property {string | VueComponent} component
 * @property {number} width
 * @property {number} x
 * @property {number} y
 * @property {string} header
 * @property {string} icon
 * @property {number} xMax
 */

/**
 * @typedef DraggableWindowState
 * @property {Object.<string, DraggableWindow>} items
 * @property {number} draggableWindowHighestIndex
 */

/** @constant {DraggableWindowState} initialState */
const initialState = {
  items: {
    [DraggableWindowId.LayerTree]: {
      visible: true,
      zIndex: 50,
      id: DraggableWindowId.LayerTree,
      component: LayerTree,
      width: 320,
      x: 0,
      y: 56,
      header: 'layer-tree.title',
      icon: '$vcsLayers',
      xMax: window.innerWidth,
    },
  },
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
   */
  remove(viewId) {
    Vue.delete(this.state.items, viewId);
  }

  /**
   * @param {string} viewId
   * @param {DraggableWindow} draggableWindow
   */
  add(viewId, draggableWindow) {
    if (!viewId) {
      throw new Error(`A draggable window must have an id, got: ${viewId}.`);
    }

    if (this.state.items[viewId]) {
      throw new Error(`A draggable window with id ${viewId} has already been registered.`);
    }

    Vue.set(this.state.items, viewId, {
      id: viewId,
      ...draggableWindow,
      zIndex:
        draggableWindow.zIndex ||
        draggableWindowHighestIndex -
        Object.keys(this.state.items).length,
    });
  }


  /**
   * @param {DraggableWindow} draggableWindow
   */
  bringViewToTop(draggableWindow) {
    if (draggableWindow.zIndex === this.state.draggableWindowHighestIndex) {
      return;
    }

    draggableWindow.zIndex = this.state.draggableWindowHighestIndex;

    // Set other windows to back by one each.
    Object.keys(this.state.items)
      .sort((keyA, keyB) => this.state.items[keyB].zIndex - this.state.items[keyA].zIndex)
      .filter((id) => { return id !== draggableWindow.id; })
      .forEach((id, i) => {
        const zIndex = this.state.draggableWindowHighestIndex - (i + 1);
        this.state.items[id].zIndex = zIndex;
      });
  }

  /**
   * @param {DraggableWindow} draggableWindow
   * @param {string} viewId
   */
  checkIfViewRegistered = (draggableWindow, viewId) => {
    if (!draggableWindow || !this.has(viewId)) {
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
      Vue.set(this.state.items, viewId, {
        ...view,
        zIndex: draggableWindowHighestIndex,
      });
    } else {
      Vue.set(this.state.items, viewId, {
        ...view,
        zIndex:
          draggableWindowHighestIndex -
          Object.keys(this.state.items).length + 1,
      });
    }
  }
}
