import { computed, reactive, ref } from 'vue';
import { VcsEvent } from '@vcmap/core';
import { v4 as uuidv4 } from 'uuid';
import { parseEnumValue } from '@vcsuite/parsers';
import { check, oneOf } from '@vcsuite/check';
import { vcsAppSymbol } from '../../pluginHelper.js';

/**
 * @readonly
 * @enum {string}
 * @property {string} STATIC - Static windows cannot be moved and will be positioned top-left.
 * @property {string} DYNAMIC_LEFT - Positioned top-left, if no static window is present. Can be moved by user interaction.
 * @property {string} DYNAMIC_RIGHT - Positioned top-right. Can be moved by user interaction.
 * @property {string} DYNAMIC_CHILD - Positioned top-right of a parent window. Can be moved by user interaction. Will be moved with parent window, if docked. Requires parentId.
 * @property {string} DETACHED - Positioned at initial provided position. Can be moved by user interaction.
 */
export const WindowSlot = {
  STATIC: 'static',
  DYNAMIC_LEFT: 'dynamicLeft',
  DYNAMIC_RIGHT: 'dynamicRight',
  DYNAMIC_CHILD: 'dynamicChild',
  DETACHED: 'detached',
};

/**
 * @typedef {Object} WindowPositionOptions
 * @property {string|number|undefined} [left] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [top] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [right] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [bottom] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [width] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [height] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [maxHeight] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [maxWidth] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [minHeight] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [minWidth] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 */

/**
 * @typedef {Object} WindowPosition
 * @property {string} left - The left CSS property participates in specifying the horizontal position of a window.
 * @property {string} top - The top CSS property participates in specifying the vertical position of a window.
 * @property {string} right - The right CSS property participates in specifying the horizontal position of a window.
 * @property {string} bottom - The bottom CSS property participates in specifying the vertical position of a window.
 * @property {string} width - The width CSS property sets an element's width.
 * @property {string} height - The height CSS property sets an element's height.
 * @property {string} [maxHeight] -  It prevents the used value of the height property from becoming larger than the value specified for max-height. (max is target height, will be automatically updated)
 * @property {string} [maxWidth] - It prevents the used value of the width property from becoming larger than the value specified by max-width. (max is target width, will be automatically updated)
 * @property {string} [minHeight] - It prevents the used value of the height property from becoming smaller than the value specified for min-height.
 * @property {string} [minWidth] - It prevents the used value of the width property from becoming smaller than the value specified for min-width.
 */

/**
 * @readonly
 * @enum {WindowPosition}
 * @property {WindowPosition} TOP_LEFT position of the DYNAMIC_LEFT or STATIC Slot
 * @property {WindowPosition} TOP_LEFT2 position of the DYNAMIC_LEFT Slot if a STATIC is present
 * @property {WindowPosition} TOP_RIGHT position of the DYNAMIC_RIGHT Slot
 * @property {WindowPosition} DETACHED default position of DETACHED Windows if no position is given
 * @private
 */
export const WindowPositions = {
  TOP_LEFT: {
    left: '0px',
    top: '0px',
  },
  TOP_LEFT2: {
    left: '322px', // 2px space
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
 * Return true, if all values of pos1 match with the corresponding values of pos2
 * @param {WindowPosition} pos1
 * @param {WindowPosition} pos2
 * @returns {boolean}
 */
export function compareWindowPositions(pos1, pos2) {
  return !Object.keys(pos1).some((key) => pos1[key] !== pos2[key]);
}

/**
 * Returns true, if the provided position is a slot position
 * @param {WindowPosition} windowPosition
 * @returns {boolean}
 */
export function isSlotPosition(windowPosition) {
  return [
    WindowPositions.TOP_LEFT,
    WindowPositions.TOP_LEFT2,
    WindowPositions.TOP_RIGHT,
  ].some((s) => compareWindowPositions(s, windowPosition));
}

/**
 * @typedef {{
 *   id?: string,
 *   parentId?: string,
 *   component: import("vue").Component<T, unknown, unknown>,
 *   headerComponent?: import("vue").Component<T, unknown, unknown>,
 *   state? : Partial<WindowState>,
 *   position? : Partial<WindowPositionOptions>,
 *   slot: WindowSlot,
 *   props?: T,
 *   provides?: Record<string, unknown>
 * }} WindowComponentOptions
 * @template {Object} [T=Object]
 * @property {string} [id] Optional ID, If not provided an uuid will be generated.
 * @property {string} [parentId] An optional ID of a parent window for 'dynamicChild' slot. Parent windows with slot dynamicRight are not supported.
 * @property {import("vue").Component<T, unknown, unknown>} component Main Component which is shown below the header.
 * @property {import("vue").Component<T, unknown, unknown>} [headerComponent] Replaces the Header Component.
 * @property {Partial<WindowState>} [state]
 * @property {Partial<WindowPositionOptions>} [position] Will be merged with default position for slot
 * @property {WindowSlot} [slot]
 * @property {T} [props]
 * @property {Object} [provides]
 */

/**
 * @typedef {Object} WindowState
 * @property {string} id
 * @property {string|vcsAppSymbol} owner Owner of the window, set by windowManager on add
 * @property {boolean} [hideHeader] be used to not show the header.
 * @property {boolean} [hidePin] be used to not show the pin button.
 * @property {string|string[]} [headerTitle] An optional translatable header. If an array is provided all elements are translated and joined afterward.
 * @property {string} [headerIcon]
 * @property {Array<import("../../actions/actionHelper.js").VcsAction>} [headerActions]
 * @property {number} [headerActionsOverflow]
 * @property {string} [infoUrl] An optional url referencing help or further information on the window's content.
 * @property {function():string} [infoUrlCallback] An optional function returning an url referencing help or further information. Can be used for urls depending on the app's locale, e.g. app.getHelpUrl()
 * @property {boolean} [dockable] Auto derived from hidePin, current slot, current position and initial position.
 * @property {Object<string, string>} [styles] Can be used to add additional styles to the root WindowComponent. Use Vue Style Bindings Object Syntax https://vuejs.org/v2/guide/class-and-style.html
 * @property {Array<string>|Object<string,string>} [classes] Can be used to add additional classes to the root WindowComponent. Use Vue Class Bindings Syntax https://vuejs.org/v2/guide/class-and-style.html
 */

/**
 * @typedef {{
 *   id: string,
 *   parentId?: string,
 *   component: import("vue").Component<T, unknown, unknown>,
 *   headerComponent?: import("vue").Component<T, unknown, unknown>,
 *   state : Partial<WindowState>,
 *   position : Partial<WindowPositionOptions>,
 *   slot: WindowSlot,
 *   props: T,
 *   provides: Record<string, unknown>,
 *   zIndex: import("vue").ComputedGetter<number>
 * }} WindowComponent
 * @template {Object} [T=Object]
 * @property {string} id
 * @property {string} [parentId]
 * @property {import("vue").Component<T, unknown, unknown>} component
 * @property {import("vue").Component<T, unknown, unknown>} [headerComponent]
 * @property {WindowState} state
 * @property {WindowPosition} [position]
 * @property {WindowPositionOptions} initialPositionOptions
 * @property {import("vue").Ref<WindowSlot>} slot
 * @property {WindowSlot} initialSlot
 * @property {T} props
 * @property {Object} provides
 * @property {import("vue").ComputedGetter<number>} zIndex
 */

/**
 * @param {string|number|undefined} pos
 * @returns {string|undefined}
 */
export function posToPixel(pos) {
  if (typeof pos === 'number') {
    return `${pos}px`;
  }
  // if a string with just a number, add a px example: "220"
  if (/^\d+$/.test(pos)) {
    return `${pos}px`;
  }
  return pos;
}

/**
 * Returns CSS position string properties
 * @param {WindowPositionOptions} windowPositionOptions
 * @param {WindowPosition=} windowPosition
 * @returns {WindowPosition}
 */
export function windowPositionFromOptions(
  windowPositionOptions,
  windowPosition = {},
) {
  let left = posToPixel(windowPositionOptions.left) || 'unset';
  const right = posToPixel(windowPositionOptions.right) || 'unset';
  let top = posToPixel(windowPositionOptions.top) || 'unset';
  const bottom = posToPixel(windowPositionOptions.bottom) || 'unset';
  let width = posToPixel(windowPositionOptions.width) || 'auto';
  let height = posToPixel(windowPositionOptions.height) || 'auto';
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
  if (windowPositionOptions.maxWidth) {
    result.maxWidth = posToPixel(windowPositionOptions.maxWidth);
  }
  if (windowPositionOptions.maxHeight) {
    result.maxHeight = posToPixel(windowPositionOptions.maxHeight);
  }
  if (windowPositionOptions.minHeight) {
    result.minHeight = posToPixel(windowPositionOptions.minHeight);
  }
  if (windowPositionOptions.minWidth) {
    result.minWidth = posToPixel(windowPositionOptions.minWidth);
  }

  return Object.assign(windowPosition, result);
}

/**
 * Sets a position on a component. Updates dockable state.
 * @param {WindowComponent} windowComponent
 * @param {WindowPositionOptions} windowPositionOptions
 */
function setWindowPosition(windowComponent, windowPositionOptions) {
  const windowPosition = windowPositionFromOptions(
    windowPositionOptions,
    windowComponent.position,
  );
  // not one of the default Positions, so we also have to DETACH the windowState.
  if (!isSlotPosition(windowPosition)) {
    windowComponent.slot.value = WindowSlot.DETACHED;
  }
  // check dockable state
  const initialWindowPosition = windowPositionFromOptions(
    windowComponent.initialPositionOptions,
  );
  const isInitialPosition = compareWindowPositions(
    windowPosition,
    initialWindowPosition,
  );
  windowComponent.state.dockable =
    windowComponent.slot.value === WindowSlot.DETACHED && !isInitialPosition;

  if (isInitialPosition) {
    windowComponent.slot.value = windowComponent.initialSlot;
  }
}

/**
 * @typedef {import("../../vcsUiApp.js").VcsComponentManager<WindowComponent,WindowComponentOptions>} IWindowManager
 */

/**
 * @class WindowManager
 * @description Manages a set of Draggable Windows
 * @implements {IWindowManager}
 */
class WindowManager {
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
     * @type {import("vue").UnwrapRef<string[]>}
     */
    this.componentIds = reactive([]);
    /**
     * reactive ordered array of ids, defining the zIndex of a component
     * @type {import("vue").Ref<Array<string>>}
     * @private
     */
    this._zIndices = ref([]);

    /**
     * Map of <id, owner> for external zIndexIds
     * @type {Map<string, string>}
     * @private
     */
    this._externalZIndexIds = new Map();

    /**
     * @type {Map<string, WindowComponent>}
     * @private
     */
    this._windowComponents = new Map();

    /**
     * @type {Map<string, WindowPosition>}
     * @private
     */
    this._windowPositionsCache = new Map();
  }

  /**
   * @type {number}
   */
  get maxZIndex() {
    return this._zIndices.value.length - 1;
  }

  /**
   * @return {string[]}
   */
  get externalZIndexIds() {
    return [...this._externalZIndexIds.keys()];
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
      this._cachePosition(windowComponent);
      this.componentIds.splice(this.componentIds.indexOf(id), 1);
      this._zIndices.value.splice(this._zIndices.value.indexOf(id), 1);
      this._windowComponents.delete(id);
      this._handleSlotsChanged(windowComponent.slot.value);
      this.removed.raiseEvent(windowComponent);
      const childs = Array.from(this._windowComponents.values()).filter(
        ({ parentId }) => id === parentId,
      );
      if (childs.length) {
        childs.forEach((child) => {
          this.remove(child.id);
        });
      }
    }
  }

  /**
   * @param {string} id
   * @param {WindowPositionOptions} windowPositionOptions
   */
  setWindowPositionOptions(id, windowPositionOptions) {
    const windowComponent = this._windowComponents.get(id);
    if (windowComponent) {
      setWindowPosition(windowComponent, windowPositionOptions);
    }
  }

  /**
   * handles changes in the Slots. Makes sure that a STATIC Window is positioned on the right to the DYNAMIC_LEFT Slot.
   * If a STATIC Window is removed again, the DYNAMIC_LEFT will be moved back.
   * @param {WindowSlot} changedSlot
   * @private
   */
  _handleSlotsChanged(changedSlot, parentId) {
    if (
      changedSlot === WindowSlot.STATIC ||
      changedSlot === WindowSlot.DYNAMIC_LEFT ||
      (parentId != null &&
        changedSlot === WindowSlot.DETACHED &&
        !this.has(parentId))
    ) {
      const staticWindow = this._findWindowBySlot(WindowSlot.STATIC);
      const dynamicWindowLeft =
        this._findWindowBySlot(WindowSlot.DYNAMIC_LEFT) ??
        [...this._windowComponents.values()].find(
          (c) => parentId != null && c.parentId === parentId,
        );

      if (staticWindow && dynamicWindowLeft) {
        this.setWindowPositionOptions(dynamicWindowLeft.id, {
          ...dynamicWindowLeft.position,
          ...WindowPositions.TOP_LEFT2,
        });
      } else if (!staticWindow && dynamicWindowLeft) {
        this.setWindowPositionOptions(dynamicWindowLeft.id, {
          ...dynamicWindowLeft.position,
          ...WindowPositions.TOP_LEFT,
        });
      }
    }
  }

  /**
   * @param {WindowSlot} slot
   * @param {string=} parentId
   * @param {string=} id
   * @returns {WindowComponent}
   * @private
   */
  _findWindowBySlot(slot, parentId, id) {
    const components = /** @type {WindowComponent[]} */ (
      Array.from(this._windowComponents.values())
    );
    let parent;
    let usedSlot = slot;
    if (parentId) {
      parent = components.find((i) => i.id === parentId);
      usedSlot = parent ? slot : WindowSlot.DYNAMIC_LEFT;
    }

    return components.find((item) => {
      if (item.id === id) {
        return false;
      }
      if (parent) {
        return item.parentId === parentId && item.slot.value === usedSlot;
      } else if (
        item.slot.value === WindowSlot.DYNAMIC_CHILD &&
        !this.has(item.parentId) &&
        item.parentId !== id &&
        usedSlot === WindowSlot.DYNAMIC_LEFT
      ) {
        return true;
      }

      if (id != null) {
        return item.slot.value === usedSlot && item.parentId !== id;
      }
      return item.slot.value === usedSlot;
    });
  }

  /**
   * @param {WindowSlot} slot
   * @param {WindowPositionOptions=} position
   * @param {string=} parentId
   * @returns {WindowPositionOptions}
   * @private
   */
  _getPositionOptionsForSlot(slot, position, parentId) {
    if (slot === WindowSlot.STATIC) {
      return { ...WindowPositions.TOP_LEFT, maxWidth: '320px' };
    }
    if (
      slot === WindowSlot.DYNAMIC_LEFT ||
      (parentId != null &&
        slot === WindowSlot.DYNAMIC_CHILD &&
        !this.has(parentId))
    ) {
      const windowAtStatic = this._findWindowBySlot(WindowSlot.STATIC);
      if (windowAtStatic) {
        return { ...position, ...WindowPositions.TOP_LEFT2 };
      } else {
        return { ...position, ...WindowPositions.TOP_LEFT };
      }
    }
    if (slot === WindowSlot.DYNAMIC_RIGHT) {
      return { ...position, ...WindowPositions.TOP_RIGHT };
    }
    if (slot === WindowSlot.DYNAMIC_CHILD) {
      return { ...position, ...WindowPositions.TOP_LEFT };
    }
    return position || WindowPositions.DETACHED;
  }

  /**
   * removes the window at the given slot if it exists (not for DETACHED)
   * @param {WindowSlot} slot
   * @param {string} parentId
   * @param {string} id
   * @private
   */
  _removeWindowAtSlot(slot, parentId, id) {
    if (slot !== WindowSlot.DETACHED) {
      const toRemove = this._findWindowBySlot(slot, parentId, id);
      if (toRemove) {
        this.remove(toRemove.id);
      }
    }
  }

  /**
   * @param {string} id
   * @returns {WindowPosition|undefined}
   */
  getCachedPosition(id) {
    return this._windowPositionsCache.get(id);
  }

  /**
   * Caches the position, if it differs from the initial position
   * @param {WindowComponent} windowComponent
   * @private
   */
  _cachePosition(windowComponent) {
    const initialWindowPosition = windowPositionFromOptions(
      windowComponent.initialPositionOptions,
    );
    if (
      !compareWindowPositions(initialWindowPosition, windowComponent.position)
    ) {
      this._windowPositionsCache.set(windowComponent.id, {
        ...windowComponent.position,
      });
    }
  }

  /**
   * Returns true, if cached position was assigned.
   * @param {WindowComponent} windowComponent
   * @returns {boolean}
   * @private
   */
  _assignCachedPosition(windowComponent) {
    if (this._windowPositionsCache.has(windowComponent.id)) {
      const windowPosition = this.getCachedPosition(windowComponent.id);
      setWindowPosition(windowComponent, windowPosition);
      this._windowPositionsCache.delete(windowComponent.id);
      return true;
    }
    return false;
  }

  /**
   * adds a windowComponent to the WindowManager and renders the Window at the provided position/slot.
   * The reactive WindowState Object can be used to watch Changes on position/WindowSlot.
   * The WindowState Object can also be used to change hideHeader, headerTitle, headerIcon, headerActions, styles and classes
   * @param {WindowComponentOptions|WindowComponent} windowComponentOptions
   * @param {string|symbol} owner pluginName or vcsAppSymbol
   * @throws {Error} if a windowComponent with the same ID has already been added
   * @returns {WindowComponent}
   */
  add(windowComponentOptions, owner) {
    check(owner, oneOf(String, vcsAppSymbol));

    if (
      windowComponentOptions.id &&
      (this.has(windowComponentOptions.id) ||
        this._externalZIndexIds.has(windowComponentOptions.id))
    ) {
      throw new Error(
        `A window with id ${windowComponentOptions.id} has already been registered.`,
      );
    }
    if (
      windowComponentOptions.slot === WindowSlot.DYNAMIC_CHILD &&
      !windowComponentOptions.parentId
    ) {
      throw new Error('A child window must have a parent id');
    }
    const id = windowComponentOptions.id || uuidv4();
    const parentId = windowComponentOptions?.parentId;
    const slotOption =
      windowComponentOptions.slot?.value || windowComponentOptions.slot;
    const slot = parseEnumValue(slotOption, WindowSlot, WindowSlot.DETACHED);
    const windowPositionOptions = this._getPositionOptionsForSlot(
      slot,
      windowComponentOptions.position,
      parentId,
    );
    const windowPosition = windowPositionFromOptions(windowPositionOptions);

    const slotRef = ref(slot);
    const { component, headerComponent } = windowComponentOptions;
    const styles = { ...windowComponentOptions?.state?.styles };
    const classes = Array.isArray(windowComponentOptions?.state?.classes)
      ? [...(windowComponentOptions?.state?.classes ?? [])]
      : { ...windowComponentOptions?.state?.classes };

    const state = reactive({
      id,
      parentId,
      owner,
      hideHeader: !!windowComponentOptions?.state?.hideHeader,
      hidePin: !!windowComponentOptions?.state?.hidePin,
      headerTitle: windowComponentOptions?.state?.headerTitle,
      headerIcon: windowComponentOptions?.state?.headerIcon,
      headerActions: windowComponentOptions?.state?.headerActions,
      headerActionsOverflow:
        windowComponentOptions?.state?.headerActionsOverflow,
      dockable: false,
      infoUrl: windowComponentOptions?.state?.infoUrl,
      infoUrlCallback: windowComponentOptions?.state?.infoUrlCallback,
      classes,
      styles,
    });

    const props = windowComponentOptions.props || {};
    const provides = windowComponentOptions.provides || {};

    const position = reactive(windowPosition);
    const initialPosition = { ...windowPositionOptions };
    const zIndex = computed(() => this._zIndices.value.indexOf(id));

    /**
     * @type {WindowComponent}
     */
    const windowComponent = {
      get id() {
        return id;
      },
      get parentId() {
        return parentId;
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
      get initialSlot() {
        return slot;
      },
      get position() {
        return position;
      },
      get initialPositionOptions() {
        return initialPosition;
      },
      get props() {
        return props;
      },
      get provides() {
        return provides;
      },
      get zIndex() {
        return zIndex;
      },
    };
    const cached = this._assignCachedPosition(windowComponent);
    if (!cached) {
      this._removeWindowAtSlot(slot, state.parentId, state.id);
    }
    this._windowComponents.set(id, windowComponent);
    this.componentIds.push(id);
    this._zIndices.value.push(id);
    this._handleSlotsChanged(slot);
    this.added.raiseEvent(windowComponent);
    return windowComponent;
  }

  /**
   * reorders the order of all windows to bring the given ID on top
   * @param {string} id
   */
  bringWindowToTop(id) {
    if (this.has(id) || this._externalZIndexIds.has(id)) {
      const index = this._zIndices.value.indexOf(id);
      if (index >= 0 && index !== this._zIndices.value.length - 1) {
        this._zIndices.value.push(id);
        this._zIndices.value.splice(index, 1);
      }
    }
  }

  /**
   * Docks a window by resetting detached to its initial slot.
   * Updates position according to its initial slot or initial position.
   * Clears any cached position for this window.
   * @param {string} id
   */
  pinWindow(id) {
    const component = this.get(id);
    if (!component?.state?.dockable) {
      return;
    }
    this._removeWindowAtSlot(
      component.initialSlot,
      component.parentId,
      component.id,
    );
    component.slot.value = component.initialSlot;
    component.state.dockable = false;
    const dockedPosition = this._getPositionOptionsForSlot(
      component.initialSlot,
      component.initialPositionOptions,
      component.parentId,
    );
    windowPositionFromOptions(dockedPosition, component.position);
    this._windowPositionsCache.delete(id);
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
    this._externalZIndexIds.forEach((externalOwner, id) => {
      if (externalOwner === owner) {
        this.removeExternalIdFromZIndex(id);
      }
    });
  }

  /**
   * Adds a string id to the z index handling of windows. The returned computed
   * will give you the current z index of the id. Use bringToTop with the id to bring it
   * to the top, just like a window.
   * @param {string} id
   * @param {string|vcsAppSymbol} owner
   * @return {import("vue").ComputedRef<number>}
   */
  addExternalIdToZIndex(id, owner) {
    check(id, String);
    check(owner, oneOf(String, vcsAppSymbol));

    if (this.has(id)) {
      throw new Error(`Id ${id} already belongs to a window id`);
    }

    if (this._externalZIndexIds.has(id)) {
      throw new Error(`Id ${id} is already added`);
    }
    this._externalZIndexIds.set(id, owner);
    this._zIndices.value.push(id);
    return computed(() => this._zIndices.value.indexOf(id));
  }

  /**
   * Removes an external z index id
   * @param {string} id
   */
  removeExternalIdFromZIndex(id) {
    this._externalZIndexIds.delete(id);
    const index = this._zIndices.value.indexOf(id);
    if (index > -1) {
      this._zIndices.value.splice(index, 1);
    }
  }

  /**
   * removes all windowComponents and fires removed Events
   */
  clear() {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
      this.remove(id);
    });
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

export default WindowManager;
