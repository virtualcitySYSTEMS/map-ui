import { reactive } from 'vue';
import { VcsEvent } from '@vcmap/core';
import { check } from '@vcsuite/check';
import { v4 as uuidv4 } from 'uuid';
import { parseBoolean } from '@vcsuite/parsers';
import { vcsAppSymbol } from '../../pluginHelper.js';

export const panelLocationSymbol = Symbol('panelLocation');
export const panelPositionSymbol = Symbol('panelPosition');

/**
 * @readonly
 * @enum {string}
 * @property {string} LEFT - left panel (vertical)
 * @property {string} RIGHT - right panel (vertical)
 * @property {string} BOTTOM - bottom panel (horizontal)
 */
export const PanelLocation = {
  LEFT: 'vcs-left',
  RIGHT: 'vcs-right',
  BOTTOM: 'vcs-bottom',
};

/**
 * @typedef {Object} VerticalPanelPositionOptions
 * @property {string} [width] Can be a css position string (e.g. '320px' or '50%')
 * @property {string} [maxWidth] Can be a css position string (e.g. '320px' or '50%')
 * @property {string} [minWidth] Can be a css position string (e.g. '320px' or '50%')
 */

/**
 * @typedef {Object} HorizontalPanelPositionOptions
 * @property {string} [height] Can be a css position string (e.g. '320px' or '50%')
 * @property {string} [maxHeight] Can be a css position string (e.g. '320px' or '50%')
 * @property {string} [minHeight] Can be a css position string (e.g. '320px' or '50%')
 */

/**
 * @typedef {Object} PanelPosition
 * @property {string?} left - The left CSS property participates in specifying the horizontal position of a panel.
 * @property {string?} top - The top CSS property participates in specifying the vertical position of a panel.
 * @property {string?} right - The right CSS property participates in specifying the horizontal position of a panel.
 * @property {string?} bottom - The bottom CSS property participates in specifying the vertical position of a panel.
 * @property {string} width - The width CSS property sets an element's width.
 * @property {string} height - The height CSS property sets an element's height.
 * @property {string} maxHeight - The maxHeight CSS property sets an element's maximal height.
 * @property {string} maxWidth - The maxWidth CSS property sets an element's maximal width.
 * @property {string} minHeight - The minHeight CSS property sets an element's minimal height.
 * @property {string} minWidth - The minWidth CSS property sets an element's minimal width.
 */

/**
 * @readonly
 * @enum {Partial<PanelPosition>}
 * @private
 */
export const DefaultPanelPositions = {
  [PanelLocation.LEFT]: {
    left: '0px',
    width: '25%',
    minWidth: '10%',
    height: '100%',
  },
  [PanelLocation.RIGHT]: {
    right: '0px',
    width: '25%',
    minWidth: '10%',
    height: '100%',
  },
  [PanelLocation.BOTTOM]: {
    bottom: '0px',
    width: '100%',
    height: '25%',
    minHeight: '10%',
    maxHeight: '75%',
  },
};

/**
 * @typedef {Object} PanelComponentOptions
 * @property {string} [id] - Optional id, which will be set as HTML container ID. If not provided an uuid will be generated.
 * @property {import("vue").Component<unknown, unknown, unknown>} [component] Optional component to be rendered in the panel.
 * @property {Partial<PanelState>} [state]
 * @property {Partial<VerticalPanelPositionOptions|HorizontalPanelPositionOptions>} [position] Will be merged with default position for panel
 * @property {Object} [props]
 * @property {Object} [provides]
 */

/**
 * @typedef {Object} PanelState
 * @property {string} id
 * @property {string|vcsAppSymbol} owner Owner of the panel, set by panelManager on add
 * @property {PanelLocation} location Location of the panel, set by panelManager on add
 * @property {boolean} [resizable=true] Whether size of panel can be adapted
 * @property {Object<string, string>} [styles] Can be used to add additional styles to the root PanelComponent. Use Vue Style Bindings Object Syntax https://vuejs.org/v2/guide/class-and-style.html
 * @property {Array<string>|Object<string,string>} [classes] Can be used to add additional classes to the root PanelComponent. Use Vue Class Bindings Syntax https://vuejs.org/v2/guide/class-and-style.html
 */

/**
 * @typedef {Object} PanelComponent
 * @property {string} id
 * @property {import("vue").Component<unknown, unknown, unknown>} component
 * @property {Partial<PanelState>} state
 * @property {Object} props
 * @property {Object} provides
 */

/**
 * @param {Partial<PanelComponent>} panelComponent
 * @returns {PanelPosition|undefined}
 */
export function getPanelPosition(panelComponent) {
  return panelComponent?.[panelPositionSymbol];
}

/**
 * @param {PanelComponent} panelComponent
 * @param {Partial<PanelPosition>} panelPosition
 */
export function setPanelPosition(panelComponent, panelPosition) {
  const position = getPanelPosition(panelComponent);
  const toUpdate = Object.keys(panelPosition).reduce((acc, key) => {
    if (position?.[key] !== panelPosition[key]) {
      acc[key] = panelPosition[key];
    }
    return acc;
  }, {});
  if (Object.keys(toUpdate).length > 0) {
    Object.assign(panelComponent[panelPositionSymbol], panelPosition);
  }
}

/**
 * @typedef {import("../../vcsUiApp.js").VcsComponentManager<PanelComponent,PanelComponentOptions>} IPanelManager
 */

/**
 * @class PanelManager
 * @description Manages a set of Panels
 * @implements {IPanelManager}
 */
class PanelManager {
  constructor() {
    /**
     * @type {import("@vcmap/core").VcsEvent<PanelComponent>}
     */
    this.added = new VcsEvent();
    /**
     * @type {import("@vcmap/core").VcsEvent<PanelComponent>}
     */
    this.removed = new VcsEvent();
    /**
     * reactive ordered array of ids,
     * @type {import("vue").UnwrapRef<string[]>}
     */
    this.componentIds = reactive([]);
    /**
     * @type {Map<PanelLocation, string>}
     * @private
     */
    this._panelLocations = new Map();
    /**
     * @type {Map<string, PanelComponent>}
     * @private
     */
    this._panelComponents = new Map();
    /**
     * @type {Map<string, PanelPosition>}
     * @private
     */
    this._panelPositionsCache = new Map();
  }

  /**
   * @param {string} id
   * @returns {PanelComponent}
   */
  get(id) {
    return this._panelComponents.get(id);
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this._panelComponents.has(id);
  }

  /**
   *
   * @param {PanelLocation} location
   * @returns {PanelComponent}
   */
  getLocation(location) {
    return this._panelComponents.get(this._panelLocations.get(location));
  }

  /**
   *
   * @param {PanelLocation} location
   * @returns {boolean}
   */
  hasLocation(location) {
    return this._panelLocations.has(location);
  }

  /**
   *
   * @param {PanelLocation} location
   */
  removePanelAtLocation(location) {
    if (this.hasLocation(location)) {
      this.remove(this.getLocation(location).id);
    }
  }

  /**
   * @param {string} id
   * @returns {Partial<PanelPosition>|undefined}
   */
  getCachedPosition(id) {
    return this._panelPositionsCache.get(id);
  }

  /**
   * removes a panel, Component will not be rendered anymore and will be destroyed. Add PanelComponent again
   * to show the component again
   * @param {string} id
   */
  remove(id) {
    check(id, String);
    const panelComponent = this._panelComponents.get(id);
    if (panelComponent) {
      const { left, right, top, bottom, ...widthAndHeightOptions } =
        getPanelPosition(panelComponent);
      this._panelPositionsCache.set(panelComponent.id, {
        ...widthAndHeightOptions,
      });
      this.componentIds.splice(this.componentIds.indexOf(id), 1);
      this._panelComponents.delete(id);
      this._panelLocations.delete(panelComponent[panelLocationSymbol]);
      this.removed.raiseEvent(panelComponent);
    }
  }

  /**
   * Set width for LEFT and RIGHT or height for BOTTOM panels
   * @param {string} id
   * @param {VerticalPanelPositionOptions|HorizontalPanelPositionOptions} panelPositionOptions
   */
  setPanelPosition(id, panelPositionOptions) {
    const panelComponent = this.get(id);
    if (panelComponent) {
      const { location } = panelComponent.state;
      let allowedKeys = [];
      if (location === PanelLocation.LEFT || location === PanelLocation.RIGHT) {
        allowedKeys = ['width', 'minWidth', 'maxWidth'];
      } else if (location === PanelLocation.BOTTOM) {
        allowedKeys = ['height', 'minHeight', 'maxHeight'];
      }
      const toUpdate = Object.keys(panelPositionOptions)
        .filter((key) => allowedKeys.includes(key))
        .reduce((acc, key) => {
          acc[key] = panelPositionOptions[key];
          return acc;
        }, {});
      if (Object.keys(toUpdate).length > 0) {
        setPanelPosition(panelComponent, toUpdate);
      }
    }
  }

  /**
   * adds a panelComponent to the PanelManager and renders the Panel
   * @param {PanelComponentOptions|PanelComponent} panelComponentOptions
   * @param {string|symbol} owner pluginName or vcsAppSymbol
   * @param {PanelLocation} location panel render position
   * @returns {PanelComponent}
   */
  add(panelComponentOptions, owner, location) {
    check(owner, [String, vcsAppSymbol]);
    check(location, Object.values(PanelLocation));

    const id = panelComponentOptions.id || uuidv4();
    const { component, position: panelPosition } = panelComponentOptions;

    const styles = { ...panelComponentOptions?.state?.styles };
    const classes = Array.isArray(panelComponentOptions?.state?.classes)
      ? [...(panelComponentOptions?.state?.classes ?? [])]
      : { ...panelComponentOptions?.state?.classes };

    const state = reactive({
      id,
      owner,
      location,
      resizable: parseBoolean(panelComponentOptions?.state?.resizable, true),
      styles,
      classes,
    });

    const props = panelComponentOptions.props || {};
    const provides = panelComponentOptions.provides || {};

    const defaultPosition = DefaultPanelPositions[location];
    const cachedPosition = this.getCachedPosition(id) || {};
    const position = reactive({
      ...defaultPosition,
      ...cachedPosition,
      ...panelPosition,
    });
    /**
     * @type {PanelComponent}
     */
    const panelComponent = {
      get id() {
        return id;
      },
      get state() {
        return state;
      },
      get component() {
        return component;
      },
      get props() {
        return props;
      },
      get provides() {
        return provides;
      },
      [panelPositionSymbol]: position,
      [panelLocationSymbol]: location,
    };

    this.remove(id);
    this.removePanelAtLocation(location);
    this._panelComponents.set(id, panelComponent);
    this._panelLocations.set(location, id);
    this.componentIds.push(id);
    this.added.raiseEvent(panelComponent);
    return panelComponent;
  }

  /**
   * removes all panelComponents of a specific owner (plugin) and fires removed Events
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
   * removes all panelComponents and fires removed Events
   */
  clear() {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
      this.remove(id);
    });
    this._panelPositionsCache.clear();
  }

  /**
   * destroys the panelManager;
   */
  destroy() {
    this.added.destroy();
    this.removed.destroy();
    this.componentIds.splice(0);
    this._panelComponents.clear();
    this._panelPositionsCache.clear();
  }
}

export default PanelManager;
