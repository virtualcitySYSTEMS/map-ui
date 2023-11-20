import { VcsEvent } from '@vcmap/core';
import { check, checkMaybe } from '@vcsuite/check';
import { v4 as uuidv4 } from 'uuid';
import { reactive } from 'vue';
import { vcsAppSymbol } from '../../pluginHelper.js';
import ButtonManager from '../buttonManager.js';
import { ActionPattern } from '../../components/lists/VcsActionList.vue';
import { getActionFromOptions } from '../../actions/actionHelper.js';

/**
 * Possible group types. Define behaviour of group:
 * @property {number} SINGLE - SingleToolboxComponent with single toggle action rendered as VcsButton
 * @property {number} SELECT - SelectToolboxComponent with one selected item of a list of items
 * @property {number} GROUP - GroupToolboxComponent with multiple non-exclusive items rendered as VcsButton
 * @enum {number}
 */
export const ToolboxType = {
  SINGLE: 0,
  SELECT: 1,
  GROUP: 2,
};

/**
 * @typedef {Object} ToolboxComponentOptions
 * @property {string} [id] - Optional ID, If not provided an uuid will be generated.
 * @property {ToolboxType} type - Group type, defining the behaviour of the group
 * @property {(string|symbol)[]} [toolboxNames] - optional specific toolboxes to render this component in.
 */

/**
 * @typedef {ToolboxComponentOptions & { action: VcsAction }} SingleToolboxComponentOptions
 * @property {VcsAction} action - An action of a single tool
 */

/**
 * @typedef {ToolboxComponentOptions & { action: ToolboxSelectAction }} SelectToolboxComponentOptions
 * @property {ToolboxSelectAction} action - An action determining the behaviour of the select group
 */

/**
 * @typedef {ToolboxComponentOptions & {
 *   icon: string,
 *   title?: string,
 *   disabled?: boolean,
 *  }} GroupToolboxComponentOptions
 * @property {string} icon - Group icon
 * @property {string} [title] - Optional group title, for dropdown
 * @property {boolean} [disabled=false]
 */

/**
 * @typedef {Object} ToolboxComponent
 * @property {string} id
 * @property {ToolboxType} type - Group type, defining the behaviour of the group
 * @property {string|vcsAppSymbol} owner
 * @property {(string|symbol)[]} toolboxNames
 */

/**
 * @typedef {ToolboxComponent & { action: VcsAction }} SingleToolboxComponent
 */

/**
 * @typedef {ToolboxComponent & {
 *   icon?: string,
 *   title?: string,
 *   buttonManager: ButtonManager,
 *   disabled?: boolean
 * }} GroupToolboxComponent
 */

/**
 * @typedef {ToolboxComponent & { action: ToolboxSelectAction }} SelectToolboxComponent
 * @property {ToolboxSelectAction} action
 */

/**
 * @typedef {VcsAction & {
 *   selected: function(index:number):void,
 *   tools: ToolboxSelectItem[],
 *   currentIndex: number
 * }} ToolboxSelectAction
 * @property {function(index:number):void} selected - A callback determining the select behavior of the group. Should set the currentIndex.
 * @property {Array<ToolboxSelectItem>} tools - A list of exclusive tools belonging to the group
 * @property {number} currentIndex - Index of the current item
 */

/**
 * @typedef {Object} ToolboxSelectItem
 * @property {string} name
 * @property {string} [title]
 * @property {string} icon
 * @property {boolean} [disabled=false]
 */

/**
 * Default groups predefining icon and title of the group
 * @type {Array<ToolboxComponentOptions>}
 */
const defaultGroups = [
  {
    id: 'flight',
    type: ToolboxType.GROUP,
    icon: '$vcsVideoRecorder',
    title: 'toolbox.flight',
  },
  {
    id: 'miscellaneous',
    type: ToolboxType.GROUP,
    icon: 'mdi-dots-grid',
    title: 'toolbox.miscellaneous',
  },
];

/**
 * Default order of toolboxComponents shown in the toolbox
 * @type {string[]}
 */
const defaultOrder = ['featureInfo', 'flight'];

/**
 * The default toolbox name
 * @type {symbol}
 */
export const defaultToolboxName = Symbol('defaultToolboxName');

/**
 * sorts by owner and optionally plugin order
 * If both components are owned by vcsApp, defaultOrder is used to compare
 * @param {ToolboxComponent|ButtonComponent} compA
 * @param {ToolboxComponent|ButtonComponent} compB
 * @param {string[]} [order] order of owners to sort by
 * @returns {number}
 */
export function sortByOwner(compA, compB, order = []) {
  const sorted = [vcsAppSymbol, ...order];
  let indexA = sorted.indexOf(compA.owner);
  let indexB = sorted.indexOf(compB.owner);

  if (compA.owner === vcsAppSymbol && compB.owner === vcsAppSymbol) {
    indexA = defaultOrder.indexOf(compA.id);
    indexB = defaultOrder.indexOf(compB.id);
  }

  if (indexA === indexB) {
    return 0;
  }

  if (indexA === -1) {
    return 1;
  }

  if (indexB === -1) {
    return -1;
  }
  return indexA - indexB;
}

/**
 * returns ToolboxComponents sorted by owner (or other sort function)
 * @param {Array<ToolboxComponent|ButtonComponent>} components
 * @param {string[]} [order] optional order to sort by (plugin names)
 * @param {function(ownerA:string, ownerB:string, order: string[]):number} [compareFn=sortByOwner] Per default components are sorted by owner: app first, then plugins
 * @returns {Array<ToolboxComponent|ButtonComponent>}
 */
export function getComponentsByOrder(
  components,
  order = [],
  compareFn = sortByOwner,
) {
  return [...components].sort((a, b) => compareFn(a, b, order));
}

/**
 * Adds default groups for a toolboxManager.
 * Once requested, group id, icon and title are defined and cannot be changed or overwritten.
 * @param {ToolboxManager} toolboxManager
 * @param {Array<ToolboxComponentOptions>} groups
 */
export function setupDefaultGroups(toolboxManager, groups = defaultGroups) {
  groups.forEach((toolboxComponentOptions) =>
    toolboxManager.add(toolboxComponentOptions, vcsAppSymbol),
  );
}

/**
 * @class ToolboxManager
 * @description Manages a set of Toolbox Components
 * @implements VcsComponentManager<ToolboxComponent,ToolboxComponentOptions>
 */
class ToolboxManager {
  constructor() {
    /**
     * @type {import("@vcmap/core").VcsEvent<ToolboxComponent>}
     */
    this.added = new VcsEvent();
    /**
     * @type {import("@vcmap/core").VcsEvent<ToolboxComponent>}
     */
    this.removed = new VcsEvent();
    /**
     * reactive ordered array of ids,
     * @type {Array<string>}
     */
    this.componentIds = [];

    /**
     * @type {Map<string, ToolboxComponent>}
     * @private
     */
    this._toolboxGroups = new Map();

    /**
     * @type {symbol|string}
     * @private
     */
    this._toolboxName = defaultToolboxName;

    /**
     * @type {VcsEvent<string>}
     */
    this.toolboxNameChanged = new VcsEvent();
  }

  get toolboxName() {
    return this._toolboxName;
  }

  set toolboxName(name) {
    check(name, [String, defaultToolboxName]);

    if (this._toolboxName !== name) {
      this._toolboxName = name;
      this.toolboxNameChanged.raiseEvent(name);
    }
  }

  setDefaultToolboxName() {
    this.toolboxName = defaultToolboxName;
  }

  /**
   * @param {string} id
   * @returns {ToolboxComponent}
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
   * removes a ToolboxComponent, Component will not be rendered anymore and will be destroyed.
   * Add ToolboxComponent again to show the component again
   * @param {string} id
   */
  remove(id) {
    check(id, String);
    const toolboxComponent = this._toolboxGroups.get(id);
    if (toolboxComponent) {
      const index = this.componentIds.indexOf(id);
      this.componentIds.splice(index, 1);
      this._toolboxGroups.delete(id);
      this.removed.raiseEvent(toolboxComponent);
      if (toolboxComponent.buttonManager) {
        toolboxComponent.buttonManager.destroy();
      }
    }
  }

  /**
   * adds a ToolboxComponent
   * @param {SingleToolboxComponentOptions|SelectToolboxComponentOptions|GroupToolboxComponentOptions} toolboxComponentOptions
   * @param {string|symbol} owner pluginName or vcsAppSymbol
   * @throws {Error} if a toolboxComponent with the same ID has already been added
   * @returns {SingleToolboxComponent|SelectToolboxComponent|GroupToolboxComponent}
   */
  add(toolboxComponentOptions, owner) {
    checkMaybe(toolboxComponentOptions.id, String);
    check(toolboxComponentOptions.type, Object.values(ToolboxType));
    check(owner, [String, vcsAppSymbol]);

    if (toolboxComponentOptions.id && this.has(toolboxComponentOptions.id)) {
      throw new Error(
        `A toolGroup with id ${toolboxComponentOptions.id} has already been registered.`,
      );
    }
    const id = toolboxComponentOptions.id || uuidv4();
    const { type, toolboxNames: toolboxNamesOptions } = toolboxComponentOptions;

    const toolboxNames = toolboxNamesOptions
      ? [...toolboxNamesOptions]
      : [defaultToolboxName];
    /**
     * @type {ToolboxComponent}
     */
    let toolboxComponent = {
      get id() {
        return id;
      },
      get type() {
        return type;
      },
      get owner() {
        return owner;
      },
      get toolboxNames() {
        return toolboxNames;
      },
    };

    if (type === ToolboxType.SINGLE) {
      check(toolboxComponentOptions.action, ActionPattern);
      const action = getActionFromOptions(toolboxComponentOptions.action);
      /**
       * @type {SingleToolboxComponent}
       */
      toolboxComponent = {
        ...toolboxComponent,
        get action() {
          return reactive(action);
        },
      };
    } else if (type === ToolboxType.SELECT) {
      check(toolboxComponentOptions.action, {
        ...ActionPattern,
        selected: Function,
        currentIndex: Number,
        disabled: [undefined, Boolean],
        tools: [
          {
            name: String,
            title: [undefined, String],
            icon: String,
            disabled: [undefined, Boolean],
          },
        ],
      });
      const action = getActionFromOptions(toolboxComponentOptions.action);
      /**
       * @type {SelectToolboxComponent}
       */
      toolboxComponent = {
        ...toolboxComponent,
        get action() {
          return reactive(action);
        },
      };
    } else {
      check(toolboxComponentOptions.icon, String);
      checkMaybe(toolboxComponentOptions.title, String);
      checkMaybe(toolboxComponentOptions.disabled, Boolean);
      const { icon, title = undefined, disabled } = toolboxComponentOptions;
      const buttonManager = new ButtonManager();
      /**
       * @type {GroupToolboxComponent}
       */
      toolboxComponent = {
        ...toolboxComponent,
        disabled,
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
    }

    this._toolboxGroups.set(toolboxComponent.id, toolboxComponent);
    this.componentIds.push(toolboxComponent.id);
    this.added.raiseEvent(toolboxComponent);
    return toolboxComponent;
  }

  /**
   * removes all {@link ToolboxComponent}s of a specific owner and fires removed Events
   * @param {string|vcsAppSymbol} owner
   */
  removeOwner(owner) {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
      const toolboxComponent = this.get(id);
      if (toolboxComponent.buttonManager) {
        toolboxComponent.buttonManager.removeOwner(owner);
      }
      if (owner === toolboxComponent.owner) {
        this.remove(id);
      }
    });
  }

  /**
   * removes all toolboxComponents and fires removed Events
   */
  clear() {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
      this.remove(id);
    });
  }

  /**
   * destroys the ToolboxManager;
   */
  destroy() {
    this.added.destroy();
    this.removed.destroy();
    this.toolboxNameChanged.destroy();
    this.clear();
    this.componentIds.splice(0);
    this._toolboxGroups.clear();
  }
}

export default ToolboxManager;
