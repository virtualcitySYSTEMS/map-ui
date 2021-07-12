import { reactive } from '@vue/composition-api';
import Vue from 'vue';
/**
 * @typedef Coordinates
 * @property {number} x
 * @property {number} y
 */
/**
 * @typedef PopoverState
 * @property {string | VueComponent} component
 * @property {Coordinates} coordinates
 * @property {Function} callback
 * @property {boolean} visible
 * @property {string | number} id
 */
/**
 * @typedef PopoversState
 * @property {Object.<string, PopoverState>} items
 */
/** @constant {PopoversState} popoversState */
const initialState = {
  items: {},
};

/* eslint-disable import/prefer-default-export */
/**
 * @class PopoverManager
 * @description Manages a set of popovers. Should be instanciated with a reactive state and injected at root.
 */
export class PopoverManager {
  /**
   * @type {Map<string, HTMLElement>} overlayRefs
   */
  overlayRefs = new Map();

  /**
   * @type {PopoversState} state
   */
  state;

  /**
   * @constructor
   * @param {PopoversState} state
   * @description state must be reactive
   */
  constructor(state) {
    if (state) {
      this.state = state;
    } else {
      this.state = reactive(initialState);
    }
  }

  /**
   * @method
   * @param {PopoverState} obj
   * @returns {PopoverState}
   * */
  static createPopoverObject({
    component,
    parent,
    id,
    coordinates = {},
    callback = () => {},
    visible = false,
  }) {
    return {
      component,
      coordinates,
      callback,
      id,
      visible,
      parent,
    };
  }

  /**
   * @method
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return !!this.get(id);
  }

  /**
   * @method
   * @param {string} id
   * @returns {Object}
   */
  get(id) {
    return this.state.items[id];
  }

  /**
   * @method
   * @description
   * @param {PopoverState} popover
   * Assigns the current x and v value of a popover to the ref.
   */
  setCoordinates(popover) {
    if (this.overlayRefs.has(popover.id)) {
      const overlayRef = this.overlayRefs.get(popover.id);
      if (document.contains(overlayRef)) {
        const { x, y } = overlayRef.getBoundingClientRect();
        Vue.set(this.state.items, popover.id, {
          ...popover,
          coordinates: {
            x,
            y,
          },
        });
      } else {
        this.overlayRefs.delete(popover.id);
      }
    }
  }

  /**
   * @method
   * @param {Object} obj
   * @param {string} obj.name
   * @param {string | number} obj.id
   * @param {HTMLElement} obj.element
   * @param {Vue.Component} obj.cmp
   * @param {Function} obj.callback
   * @returns {Object}
   */
  registerPopover({ name, id, element, cmp, callback }) {
    Vue.component(name, cmp.default || cmp);
    this.overlayRefs.set(id, element);

    const popover = PopoverManager.createPopoverObject({
      component: name,
      callback,
      id,
      visible: true,
      parent: element,
    });

    return popover;
  }

  /**
   * @method
   * @param {PopoverState} popover
   * @param {Element} parent
   */
  addPopover(popover, parent) {
    Object.values(this.state.items).forEach((item) => {
      if (parent.contains(item.parent)) {
        this.removePopover(item.id);
      }
    });
    Vue.set(this.state.items, popover.id, popover);
    this.setCoordinates(this.state.items[popover.id]);
  }

  /**
   * @method
   * @param {string | number} id ID of popover to be removed
   * @returns {boolean}
   */
  removePopover(id) {
    if (this.state.items[id]) {
      Vue.delete(this.state.items, id);
      this.overlayRefs.delete(id);
      return true;
    }
    return false;
  }

  /**
   * @method
   */
  updateCoordinates() {
    Object.values(this.state.items).forEach(this.setCoordinates);
  }

  /**
   * @method
   * @description
   * Removes all popovers whose parent elements have been removed from the DOM
   */
  removeOrphaned() {
    Array.from(this.overlayRefs.keys()).forEach((key) => {
      if (!document.contains(this.overlayRefs.get(key))) {
        this.removePopover(key);
      }
    });
  }

  /**
   * @method
   * @param {Node} ref parent node of the nodes which shall be removed
   */
  removeAllFrom(ref) {
    Array.from(this.overlayRefs).forEach(([key, popover]) => {
      if (ref.contains(popover)) {
        this.removePopover(key);
      }
    });
  }
}
