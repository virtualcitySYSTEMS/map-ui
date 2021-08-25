/* eslint-disable import/prefer-default-export */
import { VcsEvent } from '@vcmap/core';
import { reactive } from '@vue/composition-api';
import Vue from 'vue';

/**
 * @typedef ToolboxManagerState
 * @property {Object.<string, ToolboxItemState>} items
 */

/**
 * @typedef ToolboxItemState
 * @property {string | number} id
 * @property {string} icon
 */

export class ToolboxManager {
  constructor() {
    this.onAdded = new VcsEvent();
    /** @type {ToolboxManagerState} */
    this.state = reactive({
      items: {},
    });
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
   * @param {ToolboxItemState} toolboxItem
   */
  add(toolboxItem) {
    Vue.set(this.state.items, toolboxItem.id, toolboxItem);
    this.onAdded.raiseEvent(toolboxItem);
  }


  /**
   * @method
   * @param {string | number} id ID of popover to be removed
   * @returns {boolean}
   */
  remove(id) {
    if (this.get(id)) {
      Vue.delete(this.state.items, id);
      return true;
    }
    return false;
  }
}
