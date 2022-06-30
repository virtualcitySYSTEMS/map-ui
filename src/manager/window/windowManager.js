import { reactive, ref } from '@vue/composition-api';
import { VcsEvent } from '@vcmap/core';
import { v4 as uuidv4 } from 'uuid';
import { parseEnumValue } from '@vcsuite/parsers';
import { check } from '@vcsuite/check';
import { vcsAppSymbol } from '../../pluginHelper.js';

/**
 * @readonly
 * @enum {string}
 * @property {string} STATIC
 * @property {string} DYNAMIC_LEFT
 * @property {string} DYNAMIC_RIGHT
 * @property {string} DETACHED
 */
export const WindowSlot = {
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
 * @property {string} left - absolute to map container
 * @property {string} top - absolute to map container
 * @property {string} right - absolute to map container
 * @property {string} bottom - absolute to map container
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
export const WindowPositions = {
  TOP_LEFT: {
    left: '0px',
    top: '0px',
  },
  TOP_LEFT2: {
    left: '320px',
    top: '0px',
  },
  TOP_RIGHT: {
    right: '0px',
    top: '0px',
  },
  DETACHED: {
    left: '200px',
    top: '200px',
  },
};

/**
 * @typedef WindowComponentOptions
 * @property {string} [id] Optional ID, If not provided an uuid will be generated.
 * @property {VueComponent} component Main Component which is shown below the header.
 * @property {VueComponent} [headerComponent] Replaces the Header Component.
 * @property {WindowPositionOptions} [position] Will be ignored if WindowSlot !== DETACHED, can be given otherwise or default will be used
 * @property {WindowState} [state]
 * @property {WindowSlot} [slot] If WindowSlot is not detached the position will be ignored
 * @property {Object} [props]
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
 * @property {Ref<UnwrapRef<WindowSlot>>} slot
 * @property {Object} props
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
 * @enum {number}
 * @property {number} TOP_LEFT
 * @property {number} TOP_RIGHT
 * @property {number} BOTTOM_LEFT
 * @property {number} BOTTOM_RIGHT
 */
export const WindowAlignment = {
  TOP_LEFT: 1,
  TOP_RIGHT: 2,
  BOTTOM_LEFT: 3,
  BOTTOM_RIGHT: 4,
};

/**
 * WindowPositionOptions from client position relative to a HTMLElement
 * @param {number} x - client pixel position
 * @param {number} y - client pixel position
 * @param {string|HTMLElement} [element='mapElement'] - the element or a class name. the _first_ item of said class name will be taken.
 * @param {WindowAlignment} [alignment=WindowAlignment.TOP_LEFT]
 * @returns {WindowPositionOptions}
 */
export function getWindowPositionOptions(x, y, element = 'mapElement', alignment = WindowAlignment.TOP_LEFT) {
  let mapElement = element;
  if (typeof mapElement === 'string') {
    mapElement = document.getElementsByClassName(element).item(0);
  }
  const { left, top, width, height } = mapElement.getBoundingClientRect();
  if (alignment === WindowAlignment.TOP_LEFT) {
    return { left: x - left, top: y - top };
  } else if (alignment === WindowAlignment.TOP_RIGHT) {
    return { right: width - x, top: y - top };
  } else if (alignment === WindowAlignment.BOTTOM_LEFT) {
    return { left: x - left, bottom: height - y };
  }
  return { right: width - x, bottom: height - y };
}

/**
 * Fits a window aligned top left so it fits into the parent. this will change the alignment to be bottom or right depending
 * on if the window would not fit into the parent.
 * @param {number} x - client pixel position
 * @param {number} y - client pixel position
 * @param {number} width - window width to fit
 * @param {number} height - window height to fit
 * @param {string|HTMLElement} [element='mapElement'] - the element or a class name. the _first_ item of said class name will be taken.
 * @returns {WindowPositionOptions}
 */
export function getFittedWindowPositionOptions(x, y, width, height, element = 'mapElement') {
  let mapElement = element;
  if (typeof mapElement === 'string') {
    mapElement = document.getElementsByClassName(element).item(0);
  }

  const { width: parentWidth, height: parentHeight } = mapElement.getBoundingClientRect();
  const bottom = y + height > parentHeight;
  const right = x + width > parentWidth;
  let alignment = WindowAlignment.TOP_LEFT;
  if (bottom) {
    if (right) {
      alignment = WindowAlignment.BOTTOM_RIGHT;
    } else {
      alignment = WindowAlignment.BOTTOM_LEFT;
    }
  } else if (right) {
    alignment = WindowAlignment.TOP_RIGHT;
  }
  return getWindowPositionOptions(x, y, mapElement, alignment);
}

/**
 * @class WindowManager
 * @description Manages a set of Draggable Windows
 * @implements VcsComponentManager<WindowComponent,WindowComponentOptions>
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
    this.componentIds = reactive([]);

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
    return this._windowComponents.get(id);
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
    check(id, String);
    const windowComponent = this._windowComponents.get(id);
    if (windowComponent) {
      const index = this.componentIds.indexOf(id);
      this.componentIds.splice(index, 1);
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
      const isSlotPosition = windowPositionOptions === WindowPositions.TOP_LEFT ||
        windowPositionOptions === WindowPositions.TOP_LEFT2 ||
        windowPositionOptions === WindowPositions.TOP_RIGHT;
      // not one of the default Positions, so we also have to DETACH the windowState.
      if (!isSlotPosition) {
        windowComponent.slot.value = WindowSlot.DETACHED;
      }
      windowPositionFromOptions(windowPositionOptions, windowComponent.position);
    }
  }

  /**
   * handles changes in the Slots. Makes sure that a STATIC Window is positioned on the right to the DYNAMIC_LEFT Slot.
   * If a STATIC Window is removed again, the DYNAMIC_LEFT will be moved back.
   * @param {WindowSlot} changedSlot
   * @private
   */
  _handleSlotsChanged(changedSlot) {
    if (changedSlot === WindowSlot.STATIC) {
      const staticWindow = this._findWindowBySlot(WindowSlot.STATIC);
      const dynamicWindowLeft = this._findWindowBySlot(WindowSlot.DYNAMIC_LEFT);
      if (staticWindow && dynamicWindowLeft) {
        this.setWindowPositionOptions(dynamicWindowLeft.id, WindowPositions.TOP_LEFT2);
      } else if (!staticWindow && dynamicWindowLeft) {
        this.setWindowPositionOptions(dynamicWindowLeft.id, WindowPositions.TOP_LEFT);
      }
    }
  }

  /**
   * @param {WindowSlot} slot
   * @returns {WindowComponent}
   * @private
   */
  _findWindowBySlot(slot) {
    return Array.from(this._windowComponents.values()).find(item => item.slot.value === slot);
  }

  /**
   * @param {WindowSlot} slot
   * @param {WindowPositionOptions=} position
   * @returns {WindowPositionOptions}
   * @private
   */
  _getPositionOptionsForSlot(slot, position) {
    if (slot === WindowSlot.STATIC) {
      return WindowPositions.TOP_LEFT;
    }
    if (slot === WindowSlot.DYNAMIC_LEFT) {
      const windowAtStatic = this._findWindowBySlot(WindowSlot.STATIC);
      if (windowAtStatic) {
        return WindowPositions.TOP_LEFT2;
      } else {
        return WindowPositions.TOP_LEFT;
      }
    }
    if (slot === WindowSlot.DYNAMIC_RIGHT) {
      return WindowPositions.TOP_RIGHT;
    }
    return position || WindowPositions.DETACHED;
  }

  /**
   * removes the window at the given slot if it exists (not for DETACHED)
   * @param {WindowSlot} slot
   * @private
   */
  _removeWindowAtSlot(slot) {
    if (slot !== WindowSlot.DETACHED) {
      const toRemove = this._findWindowBySlot(slot);
      if (toRemove) {
        this.remove(toRemove.id);
      }
    }
  }

  /**
   * adds a windowComponent to the WindowManager and renders the Window at the provided position/slot.
   * The reactive WindowState Object can be used to watch Changes on position/WindowSlot.
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
    const slot = parseEnumValue(slotOption, WindowSlot, WindowSlot.DETACHED);
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

    const props = windowComponentOptions.props || {};

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
      get props() {
        return props;
      },
    };
    this._removeWindowAtSlot(slot);
    this._windowComponents.set(id, windowComponent);
    this.componentIds.push(id);
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
      const index = this.componentIds.indexOf(id);
      if (index >= 0 && index !== this.componentIds.length - 1) {
        this.componentIds.push(id);
        this.componentIds.splice(index, 1);
      }
    }
  }

  /**
   * removes all windowComponents of a specific owner (plugin) and fires removed Events
   * @param {string|vcsAppSymbol} owner
   */
  removeOwner(owner) {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
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
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => { this.remove(id); });
  }

  /**
   * destroys the windowManager;
   */
  destroy() {
    this.added.destroy();
    this.removed.destroy();
    this.componentIds.splice(0);
    this._windowComponents.clear();
  }
}
