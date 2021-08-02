
import { reactive, nextTick } from '@vue/composition-api';
import { VcsEvent } from '@vcmap/core';
import Vue from 'vue';
import PositionParser from './util/position-parser';

const OPPOSING_DIR = {
  left: 'right',
  right: 'left',
};

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
   */
  remove(id) {
    const windowComponent = this.state.items[id];
    if (!windowComponent) {
      throw new Error(`Cannot remove window with id '${id}' as it is not present.`);
    }
    this.onRemoved.raiseEvent(windowComponent);
    Vue.delete(this.state.items, id);
    Object.keys(this.state.items)
      .sort((keyA, keyB) => this.state.zIndexMap[keyB] - this.state.zIndexMap[keyA])
      .forEach((windowId, i) => {
        const zIndex = this.state.zIndexMax - i;
        Vue.set(this.state.zIndexMap, windowId, zIndex);
      });

    if (!windowComponent.isDocked) {
      nextTick(() => {
        this.pullWindowsIn();
      });
    }
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

  // Only pulls right to left right now
  pullWindowsIn() {
    Object.values(this.state.items).forEach((item) => {
      Vue.set(this.state.items, item.id, {
        ...item,
        position: new PositionParser({ ...item.position, right: `${item.position.asNumber.right - item.width}px` }),
      });
    });
  }

  static areBothCoveringTopLeft(windowA, windowB) {
    return (
      parseInt(windowA.position.top, 10) === parseInt(windowB.position.top, 10) &&
      parseInt(windowA.position.left, 10) === parseInt(windowB.position.left, 10));
  }

  static areBothCoveringTopRight(windowA, windowB) {
    return (
      parseInt(windowA.position.top, 10) === parseInt(windowB.position.top, 10) &&
      parseInt(windowA.position.right, 10) === parseInt(windowB.position.right, 10)
    );
  }

  static areBothCoveringBottomLeft(windowA, windowB) {
    return (
      parseInt(windowA.position.bottom, 10) === parseInt(windowB.position.bottom, 10) &&
      parseInt(windowA.position.left, 10) === parseInt(windowB.position.left, 10)
    );
  }

  static areBothCoveringBottomRight(windowA, windowB) {
    return (
      parseInt(windowA.position.bottom, 10) === parseInt(windowB.position.bottom, 10) &&
      parseInt(windowA.position.right, 10) === parseInt(windowB.position.right, 10)
    );
  }

  getWindowsWhichCover(windowComponent, dir) {
    const opposingDir = OPPOSING_DIR[dir];
    return Object.values(this.state.items).map((item) => {
      if (
        (parseInt(windowComponent.position.top, 10) === parseInt(item.position.top, 10) ||
        (windowComponent.position.top === 'unset' && item.position.top === 'unset')
        ) && (
          parseInt(windowComponent.position[opposingDir], 10) === parseInt(item.position[opposingDir], 10) ||
        (parseInt(windowComponent.position[opposingDir], 10) +
          windowComponent.width) === parseInt(item.position[opposingDir], 10)
        )
      ) {
        return item;
      }
      return undefined;
    }).filter(f => !!f);
  }

  pushWindowFrom(windowComponent) {
    ['left', 'right'].forEach((dir) => {
      const needPull = this.getWindowsWhichCover(windowComponent, dir);
      needPull.forEach((item) => {
        const opposingDir = OPPOSING_DIR[dir];
        const newRight = item.position.asNumber[opposingDir] + item.width;
        const dockingRef = {
          element: windowComponent,
          from: opposingDir,
        };
        Vue.set(this.state.items, item.id, {
          ...item,
          position: new PositionParser({ ...item.position, [opposingDir]: `${newRight}px` }),
          dockingRef,
        });
      });
    });
  }

  removeWindowAtSamePositionAs(windowComponent) {
    Object.values(this.state.items).forEach((item) => {
      if (item.position.top !== windowComponent.position.top) {
        return;
      }
      if (
        item.position.right === windowComponent.position.right ||
        item.position.left === windowComponent.position.left
      ) {
        this.remove(item.id);
      }
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
