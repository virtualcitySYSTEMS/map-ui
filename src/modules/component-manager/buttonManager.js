import { reactive } from '@vue/composition-api';
import { VcsEvent } from '@vcmap/core';
import { v4 as uuidv4 } from 'uuid';
import { check, checkMaybe } from '@vcsuite/check';
import { vcsAppSymbol } from '../../pluginHelper.js';

/**
 * sorts by owner and optionally plugin order
 * @param {ButtonComponent} a
 * @param {ButtonComponent} b
 * @param {string[]} [order] order of owners to sort by
 * @returns {number}
 */
function sortByOwner(a, b, order = []) {
  const sorted = [vcsAppSymbol, ...order];
  return sorted.indexOf(b.owner) -
    sorted.indexOf(a.owner);
}

/**
 * filters actions by button location and returns actions (optionally sorted)
 * @param {Array<ButtonComponent>} buttonComponents
 * @param {ButtonLocation} location Button render position
 * @param {string[]} [order] optional order to sort by (plugin names)
 * @param {function(a: ButtonComponent, b: ButtonComponent, order: string[]):number} [compareFn=sortByOwner] Per default components are sorted by owner: app first, then plugins
 * @returns {Array<VcsAction>}
 */
export function getActionsByLocation(buttonComponents, location, order = [], compareFn = sortByOwner) {
  return buttonComponents
    .filter(b => b.location === location)
    .sort((a, b) => compareFn(a, b, order))
    .map(b => b.action);
}

/**
 * Possible render positions of buttons in navbar from left to right
 * @enum
 */
export const ButtonLocation = {
  MAP: 0,
  CONTENT: 1,
  TOOL: 2,
  PROJECT: 3,
  MENU: 4,
};

/**
 * @typedef ButtonComponentOptions
 * @property {string} [id] Optional ID, If not provided a uuid will be generated.
 * @property {ButtonLocation} location Button render position
 * @property {VcsAction} action Action performed by button.
 */

/**
 * @typedef ButtonComponent
 * @property {string} id
 * @property {string|vcsAppSymbol} owner
 * @property {ButtonLocation} location
 * @property {VcsAction} action
 */

/**
 * @class ButtonManager
 * @description Manages a set of Map Buttons
 * @implements VcsComponentManager<ButtonComponent>
 */
export default class ButtonManager {
  constructor() {
    /**
     * @type {import("@vcmap/core").VcsEvent<ButtonComponent>}
     */
    this.added = new VcsEvent();
    /**
     * @type {import("@vcmap/core").VcsEvent<ButtonComponent>}
     */
    this.removed = new VcsEvent();
    /**
     * reactive ordered array of ids,
     * @type {Array<string>}
     */
    this.buttonIds = reactive([]);

    /**
     * @type {Map<string, ButtonComponent>}
     * @private
     */
    this._buttonComponents = new Map();
  }


  /**
   * @param {string} id
   * @returns {ButtonComponent}
   */
  get(id) {
    if (this.has(id)) {
      return this._buttonComponents.get(id);
    }
    return undefined;
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this._buttonComponents.has(id);
  }

  /**
   * removes a button, Component will not be rendered anymore and will be destroyed. Add ButtonComponent again
   * to show the component again
   * @param {string} id
   */
  remove(id) {
    const buttonComponent = this._buttonComponents.get(id);
    if (buttonComponent) {
      const index = this.buttonIds.indexOf(id);
      this.buttonIds.splice(index, 1);
      this._buttonComponents.delete(id);
      this.removed.raiseEvent(buttonComponent);
    }
  }

  /**
   * adds a buttonComponent
   * @param {ButtonComponentOptions} buttonComponentOptions
   * @param {string|symbol} owner pluginName or vcsAppSymbol
   * @throws {Error} if a buttonComponent with the same ID has already been added
   * @returns {ButtonComponent}
   */
  add(buttonComponentOptions, owner) {
    checkMaybe(buttonComponentOptions.id, String);
    check(buttonComponentOptions.location, Object.values(ButtonLocation));
    check(buttonComponentOptions.action, {
      name: String,
      title: [undefined, String],
      icon: [undefined, String],
      callback: Function,
      active: [undefined, Boolean],
    });
    check(owner, [String, vcsAppSymbol]);

    if (buttonComponentOptions.id && this.has(buttonComponentOptions.id)) {
      throw new Error(`A button with id ${buttonComponentOptions.id} has already been registered.`);
    }
    const id = buttonComponentOptions.id || uuidv4();

    /**
     * @type {ButtonComponent}
     */
    const buttonComponent = {
      get id() {
        return id;
      },
      get owner() {
        return owner;
      },
      get location() {
        return buttonComponentOptions.location;
      },
      get action() {
        return reactive(buttonComponentOptions.action);
      },
    };

    this._buttonComponents.set(id, buttonComponent);
    this.buttonIds.push(id);
    this.added.raiseEvent(buttonComponent);
    return buttonComponent;
  }

  /**
   * removes all buttonComponents of a specific owner and fires removed Events
   * @param {string|vcsAppSymbol} owner
   */
  removeOwner(owner) {
    const buttonIds = [...this.buttonIds];
    buttonIds.forEach((id) => {
      if (owner === this.get(id).owner) {
        this.remove(id);
      }
    });
  }

  /**
   * removes all buttonComponents and fires removed Events
   */
  clear() {
    const buttonIds = [...this.buttonIds];
    buttonIds.forEach((id) => { this.remove(id); });
  }

  /**
   * destroys the ButtonManager;
   */
  destroy() {
    this.added.destroy();
    this.removed.destroy();
    this.buttonIds.splice(0);
    this._buttonComponents.clear();
  }
}
