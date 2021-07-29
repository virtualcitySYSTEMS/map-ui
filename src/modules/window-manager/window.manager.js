
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
    this.onRemoved = new VcsEvent();
    /** @type {WindowState} */
    this.state = reactive({
      items: {},
      zIndexMap: {},
      zIndexMax,
    });
  }

  /**
   * @param {string} id
   * @returns {Window}
   */
  get(id) {
    return this.state.items[id];
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return !!this.get(id);
  }

  /**
   * @param {string | number} id
   * @description
   * when this method is called the window needs to be re-registered in order to be shown again.
   * Use this only to destroy a window, for hiding it call toggleViewVisible
   * @returns {Error | void}
   */
  remove(id) {
    const windowComponent = this.state.items[id];
    if (!windowComponent) {
      return new Error(`Cannot remove window with id '${id}' as it is not present.`);
    }
    this.onRemoved.raiseEvent(windowComponent);
    Vue.delete(this.state.items, id);
    Object.keys(this.state.items)
      .sort((keyA, keyB) => this.state.zIndexMap[keyB] - this.state.zIndexMap[keyA])
      .filter(windowId => windowId !== windowComponent.id)
      .forEach((windowId, i) => {
        const zIndex = this.state.zIndexMax - i;
        Vue.set(this.state.zIndexMap, windowId, zIndex);
      });
    if (!windowComponent.isDocked) {
      return this.pullWindowsIn();
    }
    return undefined;
  }


  toggle(windowComponent) {
    if (this.has(windowComponent.id)) {
      this.remove(windowComponent.id);
    } else {
      this.add(windowComponent);
    }
  }

  /**
   * @param {string} id
   * @param {Position} position
   */
  setCoordinates(id, position) {
    this.checkIfViewRegistered(id);

    const windowComponent = this.get(id);

    const updatedWindow = {
      ...windowComponent,
      position: new PositionParser(position),
    };

    Vue.set(this.state.items, windowComponent.id, updatedWindow);
  }

  pullWindowsIn() {
    Object.values(this.state.items).forEach((item) => {
      if (
        (item.position.asNumber.top === 48 && (item.position.asNumber.right === item.width)) ||
        (item.position.asNumber.bottom === 0 && (item.position.asNumber.right === item.width))
      ) {
        Vue.set(this.state.items, item.id, {
          ...item,
          position: new PositionParser({ ...item.position, right: `${item.position.asNumber.right - item.width}px` }),
        });
      }
      if (
        (item.position.asNumber.top === 48 && (item.position.asNumber.left === item.width)) ||
        (item.position.asNumber.bottom === 0 && (item.position.asNumber.left === item.width))
      ) {
        Vue.set(this.state.items, item.id, {
          ...item,
          position: new PositionParser({ ...item.position, left: `${item.position.asNumber.left - item.width}px` }),
        });
      }
    });
  }

  pushWindowFrom(windowComponent) {
    Object.values(this.state.items).forEach((item) => {
      if (
        parseInt(item.position.top, 10) === parseInt(windowComponent.position.top, 10) &&
        parseInt(item.position.left, 10) === parseInt(windowComponent.position.left, 10)
      ) {
        const newLeft = item.position.asNumber.left + item.width;
        Vue.set(this.state.items, item.id, {
          ...item,
          position: new PositionParser({ ...item.position, left: `${newLeft}px` }),
        });
        return;
      }
      if (
        parseInt(item.position.bottom, 10) === parseInt(windowComponent.position.bottom, 10) &&
        parseInt(item.position.left, 10) === parseInt(windowComponent.position.left, 10)
      ) {
        const newLeft = item.position.asNumber.left + item.width;
        Vue.set(this.state.items, item.id, {
          ...item,
          position: new PositionParser({ ...item.position, left: `${newLeft}px` }),
        });
        return;
      }
      if (
        parseInt(item.position.top, 10) === parseInt(windowComponent.position.top, 10) &&
        parseInt(item.position.right, 10) === parseInt(windowComponent.position.right, 10)
      ) {
        const newRight = item.position.asNumber.right + item.width;
        Vue.set(this.state.items, item.id, {
          ...item,
          position: new PositionParser({ ...item.position, right: `${newRight}px` }),
        });
        return;
      }
      if (
        parseInt(item.position.bottom, 10) === parseInt(windowComponent.position.bottom, 10) &&
        parseInt(item.position.right, 10) === parseInt(windowComponent.position.right, 10)
      ) {
        const newRight = item.position.asNumber.right + item.width;
        Vue.set(this.state.items, item.id, {
          ...item,
          position: new PositionParser({ ...item.position, right: `${newRight}px` }),
        });
      }
    });
  }

  removeWindowAtSamePositionAs(windowComponent) {
    Object.values(this.state.items).forEach((item) => {
      if (
        item.position.top === windowComponent.position.top &&
        item.position.left === windowComponent.position.left
      ) {
        return this.remove(item.id);
      }
      if (
        item.position.top === windowComponent.position.top &&
        item.position.right === windowComponent.position.right
      ) {
        return this.remove(item.id);
      }
      return undefined;
    });
  }

  /**
   * @param {Window} windowComponent
   */
  add(windowComponent) {
    if (!windowComponent.id) {
      throw new Error(`A window must have an id, got: ${windowComponent.id}.`);
    }

    if (this.get(windowComponent.id)) {
      throw new Error(`A window with id ${windowComponent.id} has already been registered.`);
    }

    if (windowComponent.isDocked) {
      this.removeWindowAtSamePositionAs(windowComponent);
    }

    if (!windowComponent.isDocked) {
      this.pushWindowFrom(windowComponent);
    }


    Vue.set(this.state.items, windowComponent.id, windowComponent);
    Vue.set(this.state.zIndexMap, windowComponent.id, this.state.zIndexMax);

    Object.keys(this.state.items)
      .sort((keyA, keyB) => this.state.zIndexMap[keyB] - this.state.zIndexMap[keyA])
      .filter(windowId => windowId !== windowComponent.id)
      .forEach((windowId, i) => {
        const zIndex = this.state.zIndexMax - (i + 1);
        Vue.set(this.state.zIndexMap, windowId, zIndex);
      });
    this.onAdded.raiseEvent(windowComponent);
  }


  /**
   * @param {string} id
   */
  bringViewToTop(id) {
    Vue.set(this.state.zIndexMap, id, this.state.zIndexMax);

    // Set other windows to back by one each.
    Object.keys(this.state.items)
      .sort((keyA, keyB) => this.state.zIndexMap[keyB] - this.state.zIndexMap[keyA])
      .filter(windowId => windowId !== id)
      .forEach((windowId, i) => {
        const zIndex = this.state.zIndexMax - (i + 1);
        Vue.set(this.state.zIndexMap, windowId, zIndex);
      });
  }

  /**
   * @param {string} id
   */
  checkIfViewRegistered = (id) => {
    if (!this.has(id)) {
      throw new Error(
        `Window with id '${id}' has not been registered!`,
      );
    }
  };
}
