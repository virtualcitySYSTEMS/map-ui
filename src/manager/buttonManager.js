import { reactive } from 'vue';
import { VcsEvent } from '@vcmap/core';
import { v4 as uuidv4 } from 'uuid';
import { check, maybe, oneOf } from '@vcsuite/check';
import { vcsAppSymbol } from '../pluginHelper.js';
import { ActionPattern } from '../components/lists/VcsActionList.vue';
import { getActionFromOptions } from '../actions/actionHelper.js';

/**
 * @param {number} weightA
 * @param {number} weightB
 * @returns {number}
 */
export function sortByWeight(weightA = 0, weightB = 0) {
  return weightB - weightA;
}

/**
 * @typedef ButtonComponentOptions
 * @property {string} [id] Optional ID, If not provided an uuid will be generated.
 * @property {import("../actions/actionHelper.js").VcsAction} action Action performed by button.
 * @property {number} [weight=0] Optional weight affecting the displaying order
 */

/**
 * @typedef ButtonComponent
 * @property {string} id
 * @property {string|vcsAppSymbol} owner
 * @property {import("../actions/actionHelper.js").VcsAction} action
 * @property {number} weight
 */

/**
 * @typedef {import("../vcsUiApp.js").VcsComponentManager<ButtonComponent,ButtonComponentOptions>} IButtonManager
 */

/**
 * @class ButtonManager
 * @description Manages a set of Map Buttons
 * @implements {IButtonManager}
 */
class ButtonManager {
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
     * @type {import("vue").UnwrapRef<string[]>}
     */
    this.componentIds = reactive([]);
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
    return this._buttonComponents.get(id);
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
    check(id, String);
    const buttonComponent = this._buttonComponents.get(id);
    if (buttonComponent) {
      const index = this.componentIds.indexOf(id);
      this.componentIds.splice(index, 1);
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
    check(buttonComponentOptions.id, maybe(String));
    check(buttonComponentOptions.weight, maybe(Number));
    check(buttonComponentOptions.action, ActionPattern);
    check(owner, oneOf(String, vcsAppSymbol));

    if (buttonComponentOptions.id && this.has(buttonComponentOptions.id)) {
      throw new Error(
        `A button with id ${buttonComponentOptions.id} has already been registered.`,
      );
    }
    const id = buttonComponentOptions.id || uuidv4();
    const action = reactive(
      getActionFromOptions(buttonComponentOptions.action),
    );

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
      get action() {
        return action;
      },
      get weight() {
        return buttonComponentOptions.weight || 0;
      },
      set weight(value) {
        check(value, Number);
        buttonComponentOptions.weight = value;
      },
    };

    this._buttonComponents.set(id, buttonComponent);
    this.componentIds.push(id);
    this.added.raiseEvent(buttonComponent);
    return buttonComponent;
  }

  /**
   * removes all buttonComponents of a specific owner and fires removed Events
   * @param {string|vcsAppSymbol} owner
   */
  removeOwner(owner) {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
      if (owner === this.get(id).owner) {
        this.remove(id);
      }
    });
  }

  /**
   * removes all buttonComponents and fires removed Events
   */
  clear() {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
      this.remove(id);
    });
  }

  /**
   * destroys the ButtonManager;
   */
  destroy() {
    this.added.destroy();
    this.removed.destroy();
    this.componentIds.splice(0);
    this._buttonComponents.clear();
  }
}

export default ButtonManager;
