/* eslint-disable import/prefer-default-export */
import { VcsEvent } from '@vcmap/core';
import { reactive } from '@vue/composition-api';
import Vue from 'vue';


/**
 * @typedef ToolboxGroup
 * @property {string} icon
 * @property {string | number} id
 * @property {boolean} open
 * @property {ToolboxItem[]} options
 */
/**
 * @typedef ToolboxManagerState
 * @property {boolean} visible
 * @property {Object.<string, ToolboxGroup>} groups
 */

/**
 * @typedef ToolboxItem
 * @property {string | number} id
 * @property {string} icon
 * @property {boolean} active
 * @property {boolean} selected
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
      groups: {},
    });
  }

  setGroupOpen(id, open) {
    Object.values(this.state.groups).forEach(group => {
      if (group.id ===  id) {
        Vue.set(this.state.groups, group.id, {
          ...group,
          open
        })
      } else {
        Vue.set(this.state.groups, group.id, {
          ...group,
          open: false
        })
      }
    })
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
      .values(this.state.groups)
      .map(group => group.options)
      .flat()
      .find(item => item.id === id);
  }

  /**
   * @param {string} id
   * @param {boolean} disabled
   */
  setDisabled(id, disabled) {
    const [key, slot] = this.getSlotIndexAndEntry(id);
    const entry = slot.options.find(s => s.id === id);
    entry.disabled = disabled;

    Vue.set(this.state.groups, key, slot);
  }

  /**
   * TODO: return item as well
   * @param {string} id
   * @returns {[string, ToolboxGroup]}
   */
  getSlotIndexAndEntry(id) {
    return Object
      .entries(this.state.groups)
      .find(entry => entry[1] &&
        entry[1].options &&
        entry[1].options.find(v => v.id === id));
  }


  /** @param {string} id */
  selectOption(id) {
    const [key, slot] = this.getSlotIndexAndEntry(id);
    const option = slot.options.find(opt => opt.id === id);
    if (option) {
      option.selected = !option.selected;
    }

    Vue.set(this.state.groups, key, { ...slot });
  }

  /**
   * @param {string} id
   * @returns {number}
   */
  getSlotIndexFor(id) {
    const [index] =  Object
      .entries(this.state.groups)
      .find(([key, group]) => group.options.find(o => o.id === id));
    return index;
  }

  /** @returns {number} */
  getNumberOfUsedSlots() {
    return Object
      .values(this.state.groups)
      .reduce((acc, curr) => (curr.options && curr.options.length ? acc + 1 : acc), 0);
  }


  /**  @param {string} id  */
  bringToTop(id) {
    const [key, slot] = this.getSlotIndexAndEntry(id);

    const updated = [
      slot.options.find(i => i.id === id),
      ...slot.options.filter(i => i.id !== id),
    ];

    Vue.set(this.state.groups, key, {
      ...slot,
      options: updated,
    });
  }

  /** @param {ToolboxItem} toolboxItem */
  addToolboxItem(toolboxItem, slot) {
    if (this.has(toolboxItem.id)) {
      throw new Error(`Toolbox-Item with id ${toolboxItem.id} has already been registered`);
    }
    Vue.set(this.state.groups, slot, {
      ...this.state.groups[slot],
      options: [...this.state.groups[slot].options, toolboxItem]
    });
    this.onAdded.raiseEvent(toolboxItem.id);
  }

  /**
   * @param {ToolboxGroup} group 
   * @param {string | number} slot 
   */
  addToolboxGroup(group, slot) {
    if (this.state.groups[slot]) {
      throw new Error(`Toolbox-Group with slot-id ${slot} has already been registered`);
    }
    Vue.set(this.state.groups, slot, group);
  }


  /**
   * @method
   * @param {string | number} id ID of popover to be removed
   */
  removeToolboxItem(id) {
    const slotIndex = this.getSlotIndexFor(id);
    if (!slotIndex) {
      throw new Error(`Cannot find slot index for toolbar item with id ${id}`);
    }

    Vue.set(this.state.groups, slotIndex, {
      ...this.state.groups[slotIndex],
      options: [...this.state.groups[slotIndex].options.filter(s => s.id !== id)]
    });
    this.onRemoved.raiseEvent(id);
  }
}
