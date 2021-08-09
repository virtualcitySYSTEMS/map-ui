
import { reactive, nextTick } from '@vue/composition-api';
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
 * @property {Object.<string, string>} styles
 */

const zIndexMax = 50;

/** @type {Object<string, PositionParser>} */
export const WINDOW_POSITIONS = {
  topLeft: new PositionParser({
    left: 0,
    top: '48px',
  }),
  topLeft2: new PositionParser({
    left: '320px',
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


export const WINDOW_SLOTS = {
  static: 'static',
  dymanicLeft: 'dymanicLeft',
  dynamicRight: 'dynamicRight',
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

  getAll() {
    return Object.values(this.state.items);
  }

  /**
   * @param {string | number} id
   * @description
   * when this method is called the window needs to be re-registered in order to be shown again.
   * Use this only to destroy a window, for hiding it call toggleViewVisible
   */
  remove(id) {
    const windowComponent = this.state.items[id];
    if (!windowComponent) {
      throw new Error(`Cannot remove window with id '${id}' as it is not present.`);
    }
    this.onRemoved.raiseEvent(windowComponent);
    Vue.delete(this.state.items, id);
    this.getOrderedZIndex()
      .forEach((windowId, i) => {
        const zIndex = this.state.zIndexMax - i;
        Vue.set(this.state.zIndexMap, windowId, zIndex);
      });

    if (!windowComponent.isDocked) {
      nextTick(() => {
        Object.keys(this.state.items).forEach(() => this.pullWindowsIn());
      });
    }
  }


  /**
   * @param {Window} windowComponent
   */
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

  // Only pulls right to left right now
  pullWindowsIn() {
    const items = Object.values(this.state.items);
    items.forEach((item) => {
      const newRight = item.position.asNumber.right - item.width;
      if (parseInt(item.position.right, 10) === 0) {
        return;
      }
      const newPosition = new PositionParser({ ...item.position, right: `${newRight}px` });
      if (items.some(i => i.position.isEqualTo(newPosition) && (i.id !== item.id))) {
        return;
      }
      Vue.set(this.state.items, item.id, {
        ...item,
        position: newPosition,
      });
    });
  }

  /**
   * @param {Window} windowComponent
   */
  moveWindows(windowComponent) {
    switch (windowComponent.windowSlot) {
      case WINDOW_SLOTS.static: {
        this.getAll().forEach((item) => {
          if (item.windowSlot === WINDOW_SLOTS.static || item.position.isEqualTo(WINDOW_POSITIONS.topLeft)) {
            this.remove(item.id);
          }
        });

        windowComponent.position = WINDOW_POSITIONS.topLeft;
        const windowAtSamePosition = this.getAll().find(item => item.position.isEqualTo(WINDOW_POSITIONS.topLeft));

        if (windowAtSamePosition) {
          this.remove(windowAtSamePosition.id);
        }
        break;
      }
      case WINDOW_SLOTS.dymanicLeft: {
        const staticWindow = this.getAll().find(item => item.windowSlot === WINDOW_SLOTS.static);
        const dynamicWindow1 = this.getAll().find(item => item.windowSlot === WINDOW_SLOTS.dymanic1);
        if (dynamicWindow1) {
          this.remove(dynamicWindow1.id);
        }

        if (staticWindow) {
          windowComponent.position = WINDOW_POSITIONS.topLeft2;
          return;
        }

        windowComponent.position = WINDOW_POSITIONS.topLeft;
        break;
      }
      case WINDOW_SLOTS.dynamicRight: {
        const existing = this.getAll().find(item => item.windowSlot === WINDOW_SLOTS.dynamicRight);

        if (existing) {
          this.remove(existing.id);
        }
        windowComponent.position = WINDOW_POSITIONS.topRight;
        break;
      }
      default:
        break;
    }
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

    this.moveWindows(windowComponent);

    Vue.set(this.state.items, windowComponent.id, windowComponent);
    Vue.set(this.state.zIndexMap, windowComponent.id, this.state.zIndexMax);

    this.getOrderedZIndex()
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
    this.getOrderedZIndex()
      .filter(windowId => windowId !== id)
      .forEach((windowId, i) => {
        const zIndex = this.state.zIndexMax - (i + 1);
        Vue.set(this.state.zIndexMap, windowId, zIndex);
      });
  }

  getOrderedZIndex() {
    return Object.keys(this.state.items)
      .sort((keyA, keyB) => this.state.zIndexMap[keyB] - this.state.zIndexMap[keyA]);
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
