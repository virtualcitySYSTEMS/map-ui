import type { Component, ComputedRef, Ref } from 'vue';
import { computed, isRef, reactive, ref } from 'vue';
import { VcsEvent } from '@vcmap/core';
import { v4 as uuidv4 } from 'uuid';
import { check, oneOf } from '@vcsuite/check';
import type { VcsAction } from '../../actions/actionHelper.js';
import type { VcsComponentManager } from '../../vcsUiApp.js';
import { vcsAppSymbol } from '../../pluginHelper.js';

export type WindowSlot =
  /** Static windows cannot be moved and will be positioned top-left. */
  | 'static'
  /** Dynamic windows positioned top-left, if no static window is present. Can be moved by user interaction. */
  | 'dynamicLeft'
  /** Dynamic windows positioned top-right. Can be moved by user interaction. */
  | 'dynamicRight'
  /** Dynamic windows positioned top-right of a parent window. Can be moved by user interaction. Will be moved with parent window, if docked. Requires parentId. */
  | 'dynamicChild'
  /** Dynamic windows positioned at initial provided position. Can be moved by user interaction. */
  | 'detached';

/**
 * Template for window position properties. `T` is the raw value type, defaults to `string`.
 */
type WindowPositionTemplate<T = string> = {
  /** Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values */
  left: T;
  /** Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values */
  top: T;
  /** Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values */
  right: T;
  /** Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values */
  bottom: T;
  /** Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values */
  width: T;
  /** Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values */
  height: T;
  /** Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values */
  maxHeight?: T;
  /** Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values */
  maxWidth?: T;
  /** Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values */
  minHeight?: T;
  /** Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values */
  minWidth?: T;
};

export type WindowPositionOptions = Partial<
  WindowPositionTemplate<string | number>
>;

export type WindowPosition = WindowPositionTemplate;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const WindowPositions = {
  /** position of the DYNAMIC_LEFT or STATIC Slot */
  TOP_LEFT: {
    left: '0px',
    top: '0px',
  },
  /** position of the DYNAMIC_LEFT Slot if a STATIC is present */
  TOP_LEFT2: {
    left: '322px', // 2px space
    top: '0px',
  },
  /** position of the DYNAMIC_RIGHT Slot */
  TOP_RIGHT: {
    right: '0px',
    top: '0px',
  },
  /** default position of DETACHED Windows if no position is given */
  DETACHED: {
    left: '200px',
    top: '200px',
  },
} as const;

/**
 * Return true, if all values of pos1 match with the corresponding values of pos2
 */
function windowPositionsAreEqual(
  pos1: Partial<WindowPosition>,
  pos2: WindowPosition,
): boolean {
  return !(Object.keys(pos1) as (keyof WindowPosition)[]).some(
    (key) => pos1[key] !== pos2[key],
  );
}

/**
 * Returns true, if the provided position is a slot position
 */
export function isSlotPosition(windowPosition: WindowPosition): boolean {
  return [
    WindowPositions.TOP_LEFT,
    WindowPositions.TOP_LEFT2,
    WindowPositions.TOP_RIGHT,
  ].some((s) => windowPositionsAreEqual(s, windowPosition));
}

export type WindowComponentOptions<T = Record<string, unknown>> = {
  /** optional ID, if not provided an uuid will be generated */
  id?: string;
  /** An optional ID of a parent window for 'dynamicChild' slot. Parent windows with slot dynamicRight are not supported. */
  parentId?: string;
  /** Main Component which is shown below the header. */
  component: Component;
  /** Replaces the Header Component. */
  headerComponent?: Component;
  state?: WindowStateOptions;
  /** Window position options, will be merged with default position for slot */
  position?: Partial<WindowPositionOptions>;
  slot?: WindowSlot;
  props?: T;
  provides?: Record<string, unknown>;
};

type OptionOrRef<T> = T | Ref<T> | ComputedRef<T>;

export type WindowStateOptions = {
  hideHeader?: OptionOrRef<boolean>;
  hidePin?: OptionOrRef<boolean>;
  /**An optional translatable header. If an array is provided all elements are translated and joined afterward */
  headerTitle?: OptionOrRef<string | string[]>;
  headerIcon?: OptionOrRef<string>;
  headerActions?: OptionOrRef<Array<VcsAction>>;
  headerActionsOverflow?: OptionOrRef<number>;
  /**An optional url referencing help or further information on the window's content. */
  infoUrl?: OptionOrRef<string>;
  /** An optional function returning an url referencing help or further information. Can be used for urls depending on the app's locale, e.g. app.getHelpUrl() */
  infoUrlCallback?: OptionOrRef<() => string>;
  /** Can be used to add additional styles to the root WindowComponent. Use Vue Style Bindings Object Syntax https://vuejs.org/guide/essentials/class-and-style.html */
  styles?: Record<string, string>;
  /**  * @property {Array<string>|Record<string,string>} [classes] Can be used to add additional classes to the root WindowComponent. Use Vue Class Bindings Syntax https://vuejs.org/guide/essentials/class-and-style.html
   */
  classes?: Array<string> | Record<string, string>;
};

export type WindowState = {
  id: string;
  /** Owner of the window, set by windowManager on add */
  owner: string | typeof vcsAppSymbol;
  parentId?: string;
  hideHeader?: boolean;
  hidePin?: boolean;
  /** An optional translatable header. If an array is provided all elements are translated and joined afterward. */
  headerTitle?: string | string[];
  headerIcon?: string;
  headerActions?: Array<VcsAction>;
  headerActionsOverflow?: number;
  /** An optional url referencing help or further information on the window's content. */
  infoUrl?: string;
  /** An optional function returning an url referencing help or further information. Can be used for urls depending on the app's locale, e.g. app.getHelpUrl() */
  infoUrlCallback?: () => string;
  /** Auto derived from hidePin, current slot, current position and initial position. */
  dockable?: boolean;
  /** Can be used to add additional styles to the root WindowComponent. Use Vue Style Bindings Object Syntax https://vuejs.org/guide/essentials/class-and-style.html */
  styles?: Record<string, string>;
  /** Can be used to add additional classes to the root WindowComponent. Use Vue Class Bindings Syntax https://vuejs.org/guide/essentials/class-and-style.html */
  classes?: Array<string> | Record<string, string>;
};

export type WindowComponent<T = Record<string, unknown>> = {
  id: string;
  owner: string | typeof vcsAppSymbol;
  parentId?: string;
  component: Component;
  headerComponent?: Component;
  state: WindowState;
  position: WindowPosition;
  initialPositionOptions: WindowPositionOptions;
  slot: Ref<WindowSlot>;
  initialSlot: WindowSlot;
  props: T;
  provides: Record<string, unknown>;
  zIndex: ComputedRef<number>;
};

export function posToPixel(
  pos: string | number | undefined,
): string | undefined {
  if (typeof pos === 'number') {
    return `${pos}px`;
  }
  // if a string with just a number, add a px example: "220"
  if (typeof pos === 'string' && /^\d+$/.test(pos)) {
    return `${pos}px`;
  }
  return pos;
}

/**
 * Returns CSS position string properties
 */
export function windowPositionFromOptions(
  windowPositionOptions: WindowPositionOptions,
  windowPosition: Partial<WindowPosition> = {},
): WindowPosition {
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
  const result: WindowPosition = {
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
 */
function setWindowPosition(
  windowComponent: WindowComponent,
  windowPositionOptions: WindowPositionOptions,
): void {
  const windowPosition = windowPositionFromOptions(
    windowPositionOptions,
    windowComponent.position,
  );
  // not one of the default Positions, so we also have to DETACH the windowState.
  if (!isSlotPosition(windowPosition)) {
    windowComponent.slot.value = 'detached';
  }
  // check dockable state
  const initialWindowPosition = windowPositionFromOptions(
    windowComponent.initialPositionOptions,
  );
  const isInitialPosition = windowPositionsAreEqual(
    windowPosition,
    initialWindowPosition,
  );
  windowComponent.state.dockable =
    windowComponent.slot.value === 'detached' && !isInitialPosition;

  if (isInitialPosition) {
    windowComponent.slot.value = windowComponent.initialSlot;
  }
}

type IWindowManager = VcsComponentManager<
  WindowComponent,
  WindowComponentOptions
>;

/**
 * @description Manages a set of Draggable Windows
 */
class WindowManager implements IWindowManager {
  added = new VcsEvent<WindowComponent>();
  removed = new VcsEvent<WindowComponent>();
  /** reactive ordered array of ids */
  componentIds = reactive<string[]>([]);
  /** reactive ordered array of ids, defining the zIndex of a component */
  private _zIndices = ref<string[]>([]);
  /** Map of <id, owner> for external zIndexIds */
  private _externalZIndexIds = new Map<string, string | typeof vcsAppSymbol>();
  private _windowComponents = new Map<string, WindowComponent>();
  private _windowPositionsCache = new Map<string, WindowPosition>();

  get maxZIndex(): number {
    return this._zIndices.value.length - 1;
  }

  get externalZIndexIds(): string[] {
    return [...this._externalZIndexIds.keys()];
  }

  get(id: string): WindowComponent {
    if (this.has(id)) {
      return this._windowComponents.get(id)!;
    }
    throw new Error(`Window with id ${id} does not exist`);
  }

  has(id: string): boolean {
    return this._windowComponents.has(id);
  }

  /**
   * removes a window, Component will not be rendered anymore and will be destroyed. Add WindowComponent again
   * to show the component again
   */
  remove(id: string): void {
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

  setWindowPositionOptions(
    id: string,
    windowPositionOptions: WindowPositionOptions,
  ): void {
    const windowComponent = this._windowComponents.get(id);
    if (windowComponent) {
      setWindowPosition(windowComponent, windowPositionOptions);
    }
  }

  /**
   * handles changes in the Slots. Makes sure that a STATIC Window is positioned on the right to the DYNAMIC_LEFT Slot.
   * If a STATIC Window is removed again, the DYNAMIC_LEFT will be moved back.
   */
  private _handleSlotsChanged(
    changedSlot: WindowSlot,
    parentId?: string,
  ): void {
    if (
      changedSlot === 'static' ||
      changedSlot === 'dynamicLeft' ||
      (parentId != null && changedSlot === 'detached' && !this.has(parentId))
    ) {
      const staticWindow = this._findWindowBySlot('static');
      const dynamicWindowLeft =
        this._findWindowBySlot('dynamicLeft') ??
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

  private _findWindowBySlot(
    slot: WindowSlot,
    parentId?: string,
    id?: string,
  ): WindowComponent | undefined {
    const components = Array.from(this._windowComponents.values());
    let parent: WindowComponent | undefined;
    let usedSlot = slot;
    if (parentId) {
      parent = components.find((i) => i.id === parentId);
      usedSlot = parent ? slot : 'dynamicLeft';
    }

    return components.find((item) => {
      if (item.id === id) {
        return false;
      }
      if (parent) {
        return item.parentId === parentId && item.slot.value === usedSlot;
      } else if (
        item.slot.value === 'dynamicChild' &&
        item.parentId != null &&
        !this.has(item.parentId) &&
        item.parentId !== id &&
        usedSlot === 'dynamicLeft'
      ) {
        return true;
      }

      if (id != null) {
        return item.slot.value === usedSlot && item.parentId !== id;
      }
      return item.slot.value === usedSlot;
    });
  }

  private _getPositionOptionsForSlot(
    slot: WindowSlot,
    position?: WindowPositionOptions,
    parentId?: string,
  ): WindowPositionOptions {
    if (slot === 'static') {
      return { ...WindowPositions.TOP_LEFT, maxWidth: '320px' };
    }
    if (
      slot === 'dynamicLeft' ||
      (parentId != null && slot === 'dynamicChild' && !this.has(parentId))
    ) {
      const windowAtStatic = this._findWindowBySlot('static');
      if (windowAtStatic) {
        return { ...position, ...WindowPositions.TOP_LEFT2 };
      } else {
        return { ...position, ...WindowPositions.TOP_LEFT };
      }
    }
    if (slot === 'dynamicRight') {
      return { ...position, ...WindowPositions.TOP_RIGHT };
    }
    if (slot === 'dynamicChild') {
      return { ...position, ...WindowPositions.TOP_LEFT };
    }
    return position || WindowPositions.DETACHED;
  }

  /**
   * removes the window at the given slot if it exists (not for DETACHED)
   */
  private _removeWindowAtSlot(
    slot: WindowSlot,
    parentId?: string,
    id?: string,
  ): void {
    if (slot !== 'detached') {
      const toRemove = this._findWindowBySlot(slot, parentId, id);
      if (toRemove) {
        this.remove(toRemove.id);
      }
    }
  }

  getCachedPosition(id: string): WindowPositionOptions | undefined {
    return this._windowPositionsCache.get(id);
  }

  /**
   * Caches the position, if it differs from the initial position
   */
  private _cachePosition(windowComponent: WindowComponent): void {
    if (windowComponent.slot.value === 'detached') {
      const initialWindowPosition = windowPositionFromOptions(
        windowComponent.initialPositionOptions,
      );
      if (
        !windowPositionsAreEqual(
          initialWindowPosition,
          windowComponent.position,
        )
      ) {
        this._windowPositionsCache.set(windowComponent.id, {
          ...windowComponent.position,
        });
      }
    }
  }

  /**
   * Returns true, if cached position was assigned.
   */
  private _assignCachedPosition(windowComponent: WindowComponent): boolean {
    if (this._windowPositionsCache.has(windowComponent.id)) {
      const windowPosition = this.getCachedPosition(windowComponent.id)!;
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
   * @throws {Error} if a windowComponent with the same ID has already been added
   */
  add(
    windowComponentOptions: WindowComponentOptions | WindowComponent,
    owner: string | typeof vcsAppSymbol,
  ): WindowComponent {
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
      windowComponentOptions.slot === 'dynamicChild' &&
      !windowComponentOptions.parentId
    ) {
      throw new Error('A child window must have a parent id');
    }
    const id = windowComponentOptions.id || uuidv4();
    const parentId = windowComponentOptions?.parentId;
    const slotOption = isRef(windowComponentOptions.slot)
      ? windowComponentOptions.slot?.value
      : windowComponentOptions.slot;
    const slot = slotOption ?? 'detached';
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
    }) as WindowState;

    const props = windowComponentOptions.props || {};
    const provides = windowComponentOptions.provides || {};

    const position = reactive(windowPosition);
    const initialPosition = { ...windowPositionOptions };
    const zIndex = computed(() => this._zIndices.value.indexOf(id));

    const windowComponent: WindowComponent = {
      get id() {
        return id;
      },
      get owner() {
        return owner;
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
   */
  bringWindowToTop(id: string): void {
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
   */
  pinWindow(id: string): void {
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
   */
  removeOwner(owner: string | typeof vcsAppSymbol): void {
    const toRemove = this.componentIds.filter(
      (id) => this.get(id)?.state?.owner === owner,
    );
    toRemove.forEach((id) => {
      this.remove(id);
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
   */
  addExternalIdToZIndex(
    id: string,
    owner: string | typeof vcsAppSymbol,
  ): ComputedRef<number> {
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
   */
  removeExternalIdFromZIndex(id: string): void {
    this._externalZIndexIds.delete(id);
    const index = this._zIndices.value.indexOf(id);
    if (index > -1) {
      this._zIndices.value.splice(index, 1);
    }
  }

  /**
   * removes all windowComponents and fires removed Events
   */
  clear(): void {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
      this.remove(id);
    });
  }

  /**
   * destroys the windowManager;
   */
  destroy(): void {
    this.added.destroy();
    this.removed.destroy();
    this.componentIds.splice(0);
    this._windowComponents.clear();
  }
}

export default WindowManager;
