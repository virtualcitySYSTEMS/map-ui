
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
 * @property {string | number} id
 */
/**
 * @typedef PopoversState
 * @property {Array<PopoverState>} items
 */
/** @constant {PopoversState} popoversState */
const initialState = {
  items: [],
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
      this.state = reactive({ ...initialState });
    }
  }

  /**
   * @method
   * @param {PopoverState} obj
   * @returns {PopoverState}
   * */
  static createPopoverObject({
    component,
    coordinates = {},
    callback = () => { },
    id,
  }) {
    return {
      component,
      coordinates,
      callback,
      id,
    };
  }

  /**
   * @method
   * @param {PopoversState} state
   */
  setState(state) {
    Object.assign(this, state);
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
    return this.items.find(item => item.id === id);
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
        Object.assign(popover, { coordinates: { x, y } });
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
   */
  registerPopover({ name, id, element, cmp, callback }) {
    Vue.component(name, cmp.default || cmp);
    this.overlayRefs.set(id, element);


    const popover = PopoverManager.createPopoverObject({
      component: name,
      callback,
      id,
    });

    this.addPopover(popover);
  }

  /**
   * @method
   * @param {PopoverState} popover
   */
  addPopover(popover) {
    this.state.items = [...this.state.items, popover];
    this.setCoordinates(popover);
  }

  /**
   * @method
   * @param {string | number} id ID of popover to be removed
   * @returns {boolean}
   */
  removePopover(id) {
    if (this.state.items.find(item => item.id === id)) {
      this.state.items = this.state.items.filter(p => p.id !== id);
      this.overlayRefs.delete(id);
      return true;
    }
    return false;
  }

  updateCoordinates() {
    this.state.items.forEach(item => this.setCoordinates(item));
  }

  /**
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
}
