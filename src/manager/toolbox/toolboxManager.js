/* eslint-disable import/prefer-default-export */
import { VcsEvent } from '@vcmap/core';
import { reactive } from '@vue/composition-api';
import { check, checkMaybe } from '@vcsuite/check';
import { v4 as uuidv4 } from 'uuid';
import { ButtonManager } from '../buttonManager.js';

/**
 * @typedef ToolboxGroupComponentOptions
 * @property {string} [id] Optional ID, If not provided an uuid will be generated.
 * @property {string} [icon] Optional group icon, for dropdowns
 * @property {string} [title] Optional group title, for dropdowns
 */

/**
 * @typedef ToolboxGroupComponent
 * @property {string} id
 * @property {string} title
 * @property {ButtonManager} buttonManager
 */

/**
 * Default groups predefining icon and title of the group
 * @type {Array<ToolboxGroupComponentOptions>}
 */
const defaultGroups = [
  {
    id: 'select',
    icon: '$vcsPen',
    title: 'select',
  },
  {
    id: 'measurement',
    icon: '$vcsDimensionsHouse',
    title: 'measurement',
  },
  {
    id: 'flight',
    icon: '$vcsVideoRecorder',
    title: 'flight',
  },
];

/**
 * Requests default groups for a toolboxManager.
 * Once requested, group id, icon and title are defined and cannot be changed or overwritten.
 * @param {ToolboxManager} toolboxManager
 * @param {Array<ToolboxGroupComponentOptions>} groups
 */
export function setupDefaultGroups(toolboxManager, groups = defaultGroups) {
  groups.forEach(({ id, icon, title }) => toolboxManager.requestGroup(id, icon, title));
}

/**
 * @class ToolboxManager
 * @description Manages a set of Toolbox Groups
 * @implements VcsComponentManager<ToolboxGroupComponent,ToolboxGroupComponentOptions>
 */
export class ToolboxManager {
  constructor() {
    /**
     * @type {import("@vcmap/core").VcsEvent<ToolboxGroupComponent>}
     */
    this.added = new VcsEvent();
    /**
     * @type {import("@vcmap/core").VcsEvent<ToolboxGroupComponent>}
     */
    this.removed = new VcsEvent();
    /**
     * reactive ordered array of ids,
     * @type {Array<string>}
     */
    this.componentIds = reactive([]);

    /**
     * @type {Map<string, ToolboxGroupComponent>}
     * @private
     */
    this._toolboxGroups = new Map();
  }

  /**
   * @param {string} id
   * @returns {ToolboxGroupComponent}
   */
  get(id) {
    return this._toolboxGroups.get(id);
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this._toolboxGroups.has(id);
  }

  /**
   * Toolbox groups should be static. Removing them can lead to undefined behavior.
   * @param {string} id
   */
  remove(id) {
    check(id, String);
    const toolboxGroupComponent = this._toolboxGroups.get(id);
    if (toolboxGroupComponent) {
      const index = this.componentIds.indexOf(id);
      this.componentIds.splice(index, 1);
      this._toolboxGroups.delete(id);
      this.removed.raiseEvent(toolboxGroupComponent);
      toolboxGroupComponent.buttonManager.destroy();
    }
  }

  /**
   * Do not call add directly. Use requestGroup for adding toolbox groups.
   * @param {ToolboxGroupComponentOptions} toolboxGroupComponentOptions
   * @throws {Error} if a buttonComponent with the same ID has already been added
   * @returns {ToolboxGroupComponent}
   */
  add(toolboxGroupComponentOptions) {
    checkMaybe(toolboxGroupComponentOptions.id, String);
    checkMaybe(toolboxGroupComponentOptions.icon, String);
    checkMaybe(toolboxGroupComponentOptions.title, String);

    if (toolboxGroupComponentOptions.id && this.has(toolboxGroupComponentOptions.id)) {
      throw new Error(`A toolGroup with id ${toolboxGroupComponentOptions.id} has already been registered.`);
    }
    const id = toolboxGroupComponentOptions.id || uuidv4();
    const icon = toolboxGroupComponentOptions.icon || undefined;
    const title = toolboxGroupComponentOptions.title || undefined;
    const buttonManager = new ButtonManager();

    /**
     * @type {ToolboxGroupComponent}
     */
    const toolboxGroupComponent = {
      get id() {
        return id;
      },
      get icon() {
        return icon;
      },
      get title() {
        return title;
      },
      get buttonManager() {
        return buttonManager;
      },
    };

    this._toolboxGroups.set(id, toolboxGroupComponent);
    this.componentIds.push(id);
    this.added.raiseEvent(toolboxGroupComponent);
    return toolboxGroupComponent;
  }

  /**
   * Returns an existing group or creates a new group. Add toolbox groups with this API.
   * @param {string} id
   * @param {string} [icon='mdi-select-group']
   * @param {string} [title='defaultGroup']
   * @returns {ToolboxGroupComponent}
   */
  requestGroup(id, icon = 'mdi-select-group', title = 'defaultGroup') {
    check(id, String);
    checkMaybe(icon, String);
    checkMaybe(title, String);

    if (this.has(id)) {
      return this.get(id);
    } else {
      return this.add({ id, icon, title });
    }
  }

  /**
   * removes all {@link ButtonComponent}s of a specific owner and fires removed Events
   * @param {string|vcsAppSymbol} owner
   */
  removeOwner(owner) {
    this.componentIds.forEach((id) => {
      this.get(id).buttonManager.removeOwner(owner);
    });
  }

  /**
   * removes all buttonComponents and fires removed Events
   */
  clear() {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => { this.remove(id); });
  }

  /**
   * destroys the ButtonManager;
   */
  destroy() {
    this.added.destroy();
    this.removed.destroy();
    this.clear();
    this.componentIds.splice(0);
    this._toolboxGroups.clear();
  }
}
