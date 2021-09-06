/* eslint-disable import/prefer-default-export */
import { VcsEvent } from '@vcmap/core';
import { reactive } from '@vue/composition-api';
import Vue from 'vue';

/**
 * @typedef ToolboxManagerState
 * @property {boolean} visible
 * @property {Object.<string, ToolboxItem[]>} items
 */

/**
 * @typedef ToolboxItem
 * @property {string | number} id
 * @property {string} icon
 * @property {boolean} active
 * @property {boolean} disabled
 * @property {number} slot
 */

export class ToolboxManager {
  constructor() {
    this.onAdded = new VcsEvent();
    this.onRemoved = new VcsEvent();
    /** @type {ToolboxManagerState} */
    this.state = reactive({
      visible: true,
      items: {
        // Categories?
        1: [
          { id: 'foo' },
        ],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
        7: [],
        8: [],
      },
    });
  }

  /** @method */
  toggle() {
    Vue.set(this.state, 'visible', !this.state.visible);
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
    return Object
      .values(this.state.items)
      .flat()
      .find(item => item.id === id);
  }

  /**
   * @method
   * @param {string} id
   * @returns {number}
   */
  getSlotIndexFor(id) {
    return Object
      .keys(this.state.items)
      .map((i) => {
        if (this.get(id)) {
          return +i;
        }
        return null;
      })
      .filter(i => i !== null)[0];
  }

  /** @returns {number} */
  getNumberOfUsedSlots() {
    return Object.values(this.state.items).reduce((acc, curr) => {
      if (curr.length) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }

  /**
   * @method
   * @param {ToolboxItem} toolboxItem
   */
  add(toolboxItem) {
    if (this.has(toolboxItem.id)) {
      throw new Error(`Toolbox-Item with id ${toolboxItem.id} has already been registered`);
    }
    Vue.set(this.state.items, toolboxItem.slot, [...this.state.items[toolboxItem.slot], toolboxItem]);
    this.onAdded.raiseEvent(toolboxItem.id);
  }


  /**
   * @method
   * @param {string | number} id ID of popover to be removed
   */
  remove(id) {
    const item = this.get(id);
    const slotIndex = this.getSlotIndexFor(id);
    if (!slotIndex) {
      throw new Error(`Cannot find slot index for toolbar item with id ${id}`);
    }

    Vue.set(this.state.items, item.slot, [...this.state.items[item.slot].filter(s => s.id !== id)]);
    this.onRemoved.raiseEvent(id);
  }
}
