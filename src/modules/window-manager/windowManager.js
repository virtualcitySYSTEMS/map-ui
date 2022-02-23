import { reactive, ref } from '@vue/composition-api';
import { VcsEvent } from '@vcmap/core';
import { v4 as uuidv4 } from 'uuid';
import { parseEnumValue } from '@vcsuite/parsers';
import { check } from '@vcsuite/check';
import { vcsAppSymbol } from '../../vcsAppContextHelpers.js';


/**
 * @readonly
 * @enum {string}
 * @property {string} STATIC
 * @property {string} DYNAMIC_LEFT
 * @property {string} DYNAMIC_RIGHT
 * @property {string} DETACHED
 */
export const windowSlot = {
  STATIC: 'static',
  DYNAMIC_LEFT: 'dynamicLeft',
  DYNAMIC_RIGHT: 'dynamicRight',
  DETACHED: 'detached',
};


/**
 * @typedef WindowPositionOptions
 * @property {string|number|undefined} left Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} top Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} right Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} bottom Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} width Can be a css position string (e.g. '320px') number values are treated as `px` values
 * @property {string|number|undefined} height Can be pixel-value string (e.g. '320px') number values are treated as `px` values
 */

/**
 * @typedef WindowPosition
 * @property {string} left
 * @property {string} top
 * @property {string} right
 * @property {string} bottom
 * @property {string} width
 * @property {string} height
 */

/**
 * @readonly
 * @enum {WindowPositionOptions}
 * @property {Position} TOP_LEFT position of the DYNAMIC_LEFT or STATIC Slot
 * @property {Position} TOP_LEFT2 position of the DYNAMIC_LEFT Slot if a STATIC is present
 * @property {Position} TOP_RIGHT position of the DYNAMIC_RIGHT Slot
 * @property {Position} DETACHED default position of DETACHED Windows if no position is given
 * @private
 */
export const WINDOW_POSITIONS = {
  TOP_LEFT: {
    left: '0px',
    top: '48px',
  },
  TOP_LEFT2: {
    left: '320px',
    top: '48px',
  },
  TOP_RIGHT: {
    right: '0px',
    top: '48px',
  },
  DETACHED: {
    left: '200px',
    top: '200px',
  },
};

/**
 * @typedef WindowComponentOptions
 * @property {string} [id] Optional ID, If not provided a uuid will be generated.
 * @property {VueComponent} component Main Component which is shown below the header.
 * @property {VueComponent} [headerComponent] Replaces the Header Component.
 * @property {WindowPositionOptions} [position] Will be ignored if windowSlot !== DETACHED, can be given otherwise or default will be used
 * @property {WindowState} [state]
 * @property {windowSlot} [slot] If windowSlot is not detached the position will be ignored
 */

/**
 * @typedef WindowState
 * @property {string} id
 * @property {string|vcsAppSymbol} owner Owner of the window, set by windowManager on add
 * @property {boolean} [hideHeader] be used to not show the header.
 * @property {string} [headerTitle]
 * @property {string} [headerIcon]
 * @property {Object<string, string>} styles[styles] Can be used to add additional styles to the root WindowComponent. Use Vue Style Bindings Object Syntax https://vuejs.org/v2/guide/class-and-style.html
 * @property {Array<string>|Object<string,string>} [classes] Can be used to add additional classes to the root WindowComponent. Use Vue Class Bindings Syntax https://vuejs.org/v2/guide/class-and-style.html
 */

/**
 * @typedef WindowComponent
 * @property {string} id
 * @property {VueComponent} component
 * @property {VueComponent} [headerComponent]
 * @property {WindowPosition} position
 * @property {WindowState} state
 * @property {Ref<UnwrapRef<windowSlot>>} slot
 */

/**
 * @param {string|number|undefined} pos
 * @returns {string|undefined}
 */
function parsePosition(pos) {
  if (typeof pos === 'number') {
    return `${pos}px`;
  }
  return pos;
}

/**
 * @param {WindowPositionOptions} windowPositionOptions
 * @param {WindowPosition=} windowPosition
 * @returns {WindowPosition}
 */
export function windowPositionFromOptions(windowPositionOptions, windowPosition = {}) {
  let left = parsePosition(windowPositionOptions.left) || 'unset';
  const right = parsePosition(windowPositionOptions.right) || 'unset';
  let top = parsePosition(windowPositionOptions.top) || 'unset';
  const bottom = parsePosition(windowPositionOptions.bottom) || 'unset';
  let width = parsePosition(windowPositionOptions.width) || 'auto';
  let height = parsePosition(windowPositionOptions.height) || 'auto';
  if (left !== 'unset' && right !== 'unset') {
    width = 'auto'; // left + right takes precedence over configured width
  } else if (width === 'auto') {
    width = '320px'; // default width if no value is given and no value can be calculated indirectly by left+right
  }
  if (left === 'unset' && right === 'unset') {
    left = '200px'; // default value if neither a left or right value is given
  }
  if (top !== 'unset' && bottom !== 'unset') {
    height = 'auto'; // top + bottom takes precedence over configured height
  }
  if (top === 'unset' && bottom === 'unset') {
    top = '200px'; // default value if neither a top or bottom value is given
  }
  const result = {
    left,
    right,
    top,
    bottom,
    width,
    height,
  };
  return Object.assign(windowPosition, result);
}

/**
 * @class WindowManager
 * @description Manages a set of Draggable Windows
 * @implements VcsComponentManager<WindowComponent>
 */
export class WindowManager {
  constructor() {
    /**
     * @type {import("@vcmap/core").VcsEvent<WindowComponent>}
     */
    this.added = new VcsEvent();
    /**
     * @type {import("@vcmap/core").VcsEvent<WindowComponent>}
     */
    this.removed = new VcsEvent();
    /**
     * reactive ordered array of ids,
     * @type {Array<string>}
     */
    this.windowIds = reactive([]);

    /**
     * @type {Map<string, WindowComponent>}
     * @private
     */
    this._windowComponents = new Map();
  }

  /**
   * @param {string} id
   * @returns {WindowComponent}
   */
  get(id) {
    if (this.has(id)) {
      return this._windowComponents.get(id);
    }
    return undefined;
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this._windowComponents.has(id);
  }

  /**
   * removes a window, Component will not be rendered anymore and will be destroyed. Add WindowComponent again
   * to show the component again
   * @param {string} id
   */
  remove(id) {
    const windowComponent = this._windowComponents.get(id);
    if (windowComponent) {
      const index = this.windowIds.indexOf(id);
      this.windowIds.splice(index, 1);
      this._windowComponents.delete(id);
      this._handleSlotsChanged(windowComponent.slot.value);
      this.removed.raiseEvent(windowComponent);
    }
  }

  /**
   * @param {string} id
   * @param {WindowPositionOptions} windowPositionOptions
   */
  setWindowPositionOptions(id, windowPositionOptions) {
    const windowComponent = this._windowComponents.get(id);
    if (windowComponent) {
      const isSlotPosition = windowPositionOptions === WINDOW_POSITIONS.TOP_LEFT ||
        windowPositionOptions === WINDOW_POSITIONS.TOP_LEFT2 ||
        windowPositionOptions === WINDOW_POSITIONS.TOP_RIGHT;
      // not one of the default Positions, so we also have to DETACH the windowState.
      if (!isSlotPosition) {
        windowComponent.slot.value = windowSlot.DETACHED;
      }
      windowPositionFromOptions(windowPositionOptions, windowComponent.position);
    }
  }

  /**
   * handles changes in the Slots. Makes sure that a STATIC Window is positioned on the right to the DYNAMIC_LEFT Slot.
   * If a STATIC Window is removed again, the DYNAMIC_LEFT will be moved back.
   * @param {windowSlot} changedSlot
   * @private
   */
  _handleSlotsChanged(changedSlot) {
    if (changedSlot === windowSlot.STATIC) {
      const staticWindow = this._findWindowBySlot(windowSlot.STATIC);
      const dynamicWindowLeft = this._findWindowBySlot(windowSlot.DYNAMIC_LEFT);
      if (staticWindow && dynamicWindowLeft) {
        this.setWindowPositionOptions(dynamicWindowLeft.id, WINDOW_POSITIONS.TOP_LEFT2);
      } else if (!staticWindow && dynamicWindowLeft) {
        this.setWindowPositionOptions(dynamicWindowLeft.id, WINDOW_POSITIONS.TOP_LEFT);
      }
    }
  }

  /**
   * @param {windowSlot} slot
   * @returns {WindowComponent}
   * @private
   */
  _findWindowBySlot(slot) {
    return Array.from(this._windowComponents.values()).find(item => item.slot.value === slot);
  }

  /**
   * @param {windowSlot} slot
   * @param {WindowPositionOptions=} position
   * @returns {WindowPositionOptions}
   * @private
   */
  _getPositionOptionsForSlot(slot, position) {
    if (slot === windowSlot.STATIC) {
      return WINDOW_POSITIONS.TOP_LEFT;
    }
    if (slot === windowSlot.DYNAMIC_LEFT) {
      const windowAtStatic = this._findWindowBySlot(windowSlot.STATIC);
      if (windowAtStatic) {
        return WINDOW_POSITIONS.TOP_LEFT2;
      } else {
        return WINDOW_POSITIONS.TOP_LEFT;
      }
    }
    if (slot === windowSlot.DYNAMIC_RIGHT) {
      return WINDOW_POSITIONS.TOP_RIGHT;
    }
    return position || WINDOW_POSITIONS.DETACHED;
  }

  /**
   * removes the window at the given slot if it exists (not for DETACHED)
   * @param {windowSlot} slot
   * @private
   */
  _removeWindowAtSlot(slot) {
    if (slot !== windowSlot.DETACHED) {
      const toRemove = this._findWindowBySlot(slot);
      if (toRemove) {
        this.remove(toRemove.id);
      }
    }
  }

  /**
   * adds a windowComponent to the WindowManager and renders the Window at the provided position/slot.
   * The reactive WindowState Object can be used to watch Changes on position/windowSlot.
   * The WindowState Object can also be used to change hideHeader, headerTitle, headerIcon, styles and classes
   * @param {WindowComponentOptions|WindowComponent} windowComponentOptions
   * @param {string|symbol} owner pluginName or vcsAppSymbol
   * @throws {Error} if a windowComponent with the same ID has already been added
   * @returns {WindowComponent}
   */
  add(windowComponentOptions, owner) {
    check(owner, [String, vcsAppSymbol]);

    if (windowComponentOptions.id && this.has(windowComponentOptions.id)) {
      throw new Error(`A window with id ${windowComponentOptions.id} has already been registered.`);
    }
    const id = windowComponentOptions.id || uuidv4();
    const slotOption = windowComponentOptions.slot?.value || windowComponentOptions.slot;
    const slot = parseEnumValue(slotOption, windowSlot, windowSlot.DETACHED);
    const windowPositionOptions = this._getPositionOptionsForSlot(slot, windowComponentOptions.position);
    const windowPosition = windowPositionFromOptions(windowPositionOptions);

    const slotRef = ref(slot);
    const {
      component, headerComponent,
    } = windowComponentOptions;
    const styles = { ...windowComponentOptions?.state?.styles };
    const classes = Array.isArray(windowComponentOptions?.state?.classes) ?
      [...(windowComponentOptions?.state?.classes ?? [])] :
      { ...windowComponentOptions?.state?.classes };

    const state = reactive({
      id,
      owner,
      hideHeader: !!windowComponentOptions?.state?.hideHeader,
      headerTitle: windowComponentOptions?.state?.headerTitle,
      headerIcon: windowComponentOptions?.state?.headerIcon,
      classes,
      styles,
    });

    const position = reactive(windowPosition);
    /**
     * @type {WindowComponent}
     */
    const windowComponent = {
      get id() {
        return id;
      },
      get state() {
        return state;
      },
      get component() {
        return component;
      },
      get headerComponent() {
        return headerComponent;
      },
      get slot() {
        return slotRef;
      },
      get position() {
        return position;
      },
    };
    this._removeWindowAtSlot(slot);
    this._windowComponents.set(id, windowComponent);
    this.windowIds.push(id);
    this._handleSlotsChanged(slot);
    this.added.raiseEvent(windowComponent);
    return windowComponent;
  }

  /**
   * reorders the order of all windows to bring the given ID on top
   * @param {string} id
   */
  bringWindowToTop(id) {
    if (this.has(id)) {
      const index = this.windowIds.indexOf(id);
      if (index >= 0 && index !== this.windowIds.length - 1) {
        this.windowIds.push(id);
        this.windowIds.splice(index, 1);
      }
    }
  }

  /**
   * removes all windowComponents of a specific owner (plugin) and fires removed Events
   * @param {string|vcsAppSymbol} owner
   */
  removeOwner(owner) {
    const windowIds = [...this.windowIds];
    windowIds.forEach((id) => {
      const { state } = this.get(id);
      if (owner === state.owner) {
        this.remove(id);
      }
    });
  }

  /**
   * removes all windowComponents and fires removed Events
   */
  clear() {
    const windowIds = [...this.windowIds];
    windowIds.forEach((id) => { this.remove(id); });
  }

  /**
   * destroys the windowManager;
   */
  destroy() {
    this.added.destroy();
    this.removed.destroy();
    this.windowIds.splice(0);
    this._windowComponents.clear();
  }
}
