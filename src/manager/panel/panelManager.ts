import type { Component } from 'vue';
import { reactive } from 'vue';
import { VcsEvent } from '@vcmap/core';
import { check, ofEnum, oneOf } from '@vcsuite/check';
import { v4 as uuidv4 } from 'uuid';
import { parseBoolean } from '@vcsuite/parsers';
import { vcsAppSymbol } from '../../pluginHelper.js';
import type { VcsComponentManager } from '../../vcsUiApp.js';

export const panelLocationSymbol = Symbol('panelLocation');
export const panelPositionSymbol = Symbol('panelPosition');

export enum PanelLocation {
  /** left panel (vertical) */
  LEFT = 'vcs-left',
  /** right panel (vertical) */
  RIGHT = 'vcs-right',
  /** bottom panel (horizontal) */
  BOTTOM = 'vcs-bottom',
}

type VerticalPanelPositionOptions = {
  /** Can be a css position string (e.g. '320px' or '50%') */
  width?: string;
  /** Can be a css position string (e.g. '320px' or '50%') */
  maxWidth?: string;
  /** Can be a css position string (e.g. '320px' or '50%') */
  minWidth?: string;
};

type HorizontalPanelPositionOptions = {
  /** Can be a css position string (e.g. '320px' or '50%') */
  height?: string;
  /** Can be a css position string (e.g. '320px' or '50%') */
  maxHeight?: string;
  /** Can be a css position string (e.g. '320px' or '50%') */
  minHeight?: string;
};

export type PanelPosition<T extends string | number = string> = {
  /** The left CSS property participates in specifying the horizontal position of a panel. */
  left?: T;
  /** The top CSS property participates in specifying the vertical position of a panel. */
  top?: T;
  /** The right CSS property participates in specifying the horizontal position of a panel. */
  right?: T;
  /** The bottom CSS property participates in specifying the vertical position of a panel. */
  bottom?: T;
  /** The width CSS property sets an element's width. */
  width?: T;
  /** The height CSS property sets an element's height. */
  height?: T;
  /** The maxHeight CSS property sets an element's maximal height. */
  maxHeight?: T;
  /** The maxWidth CSS property sets an element's maximal width. */
  maxWidth?: T;
  /** The minHeight CSS property sets an element's minimal height. */
  minHeight?: T;
  /** The minWidth CSS property sets an element's minimal width. */
  minWidth?: T;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const DefaultPanelPositions: Record<PanelLocation, PanelPosition> = {
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

type PanelComponentOptions = {
  /** Optional id, which will be set as HTML container ID. If not provided an uuid will be generated. */
  id?: string;
  /** Optional component to be rendered in the panel. */
  component?: Component;
  state?: Partial<PanelState>;
  /** Partial position of the panel, will be merged with default position for panel. */
  position?: Partial<
    VerticalPanelPositionOptions | HorizontalPanelPositionOptions
  >;
  props?: Record<string, unknown>;
  provides?: Record<string, unknown>;
};

export type PanelState = {
  id: string;
  /** Owner of the panel, set by panelManager on add */
  owner: string | typeof vcsAppSymbol;
  /** Location of the panel, set by panelManager on add */
  location: PanelLocation | 'vcs-main';
  resizable?: boolean;
  /** Can be used to add additional styles to the root PanelComponent. Use Vue Style Bindings Object Syntax https://vuejs.org/v2/guide/class-and-style.html */
  styles?: Record<string, string>;
  /** Can be used to add additional classes to the root PanelComponent. Use Vue Class Bindings Syntax https://vuejs.org/v2/guide/class-and-style.html */
  classes?: Array<string> | Record<string, string>;
};

export type PanelComponent = {
  id: string;
  component?: Component;
  state: PanelState;
  props: Record<string, unknown>;
  provides: Record<string, unknown>;
  [panelPositionSymbol]: PanelPosition;
  [panelLocationSymbol]: PanelLocation | 'vcs-main';
};

export function getPanelPosition(
  panelComponent: Partial<PanelComponent>,
): PanelPosition | undefined {
  return panelComponent?.[panelPositionSymbol];
}

export function setPanelPosition(
  panelManager: PanelManager,
  panelComponent: Partial<PanelComponent>,
  panelPosition: Partial<PanelPosition>,
): void {
  const position = getPanelPosition(panelComponent);
  const toUpdate = (
    Object.keys(panelPosition) as (keyof PanelPosition)[]
  ).reduce<Partial<PanelPosition>>((acc, key) => {
    if (position?.[key] !== panelPosition[key]) {
      acc[key] = panelPosition[key];
    }
    return acc;
  }, {});
  if (Object.keys(toUpdate).length > 0) {
    if (!panelComponent[panelPositionSymbol]) {
      return;
    }
    const newPosition = Object.assign(
      panelComponent[panelPositionSymbol],
      panelPosition,
    );
    panelManager.positionChanged.raiseEvent({
      panelId: panelComponent.id!,
      panelPosition: newPosition,
    });
  }
}

/**
 * @typedef {import("../../vcsUiApp.js").VcsComponentManager<PanelComponent,PanelComponentOptions>} IPanelManager
 */

type IPanelManager = VcsComponentManager<PanelComponent, PanelComponentOptions>;

/**
 * @description Manages a set of Panels
 */
class PanelManager implements IPanelManager {
  added = new VcsEvent<PanelComponent>();
  removed = new VcsEvent<PanelComponent>();
  positionChanged = new VcsEvent<{
    panelId: string;
    panelPosition: PanelPosition;
  }>();
  /** Reactive array of panel component IDs */
  componentIds = reactive<string[]>([]);
  private _panelLocations = new Map<PanelLocation | 'vcs-main', string>();
  private _panelComponents = new Map<string, PanelComponent>();
  private _panelPositionsCache = new Map<string, PanelPosition>();

  get(id: string): PanelComponent {
    return this._panelComponents.get(id)!;
  }
  has(id: string): boolean {
    return this._panelComponents.has(id);
  }
  getLocation(location: PanelLocation): PanelComponent {
    return this._panelComponents.get(this._panelLocations.get(location)!)!;
  }

  hasLocation(location: PanelLocation): boolean {
    return this._panelLocations.has(location);
  }
  removePanelAtLocation(location: PanelLocation): void {
    if (this.hasLocation(location)) {
      this.remove(this.getLocation(location).id);
    }
  }
  getCachedPosition(id: string): Partial<PanelPosition> | undefined {
    return this._panelPositionsCache.get(id);
  }

  /**
   * removes a panel, Component will not be rendered anymore and will be destroyed. Add PanelComponent again
   * to show the component again
   */
  remove(id: string): void {
    check(id, String);
    const panelComponent = this._panelComponents.get(id);
    if (panelComponent) {
      const { left, right, top, bottom, ...widthAndHeightOptions } =
        getPanelPosition(panelComponent)!;
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
   */
  setPanelPosition(
    id: string,
    panelPositionOptions:
      | VerticalPanelPositionOptions
      | HorizontalPanelPositionOptions,
  ): void {
    const panelComponent = this.get(id);
    if (panelComponent) {
      const { location } = panelComponent.state;
      let allowedKeys: Array<keyof PanelPosition> = [];
      if (location === PanelLocation.LEFT || location === PanelLocation.RIGHT) {
        allowedKeys = ['width', 'minWidth', 'maxWidth'];
      } else if (location === PanelLocation.BOTTOM) {
        allowedKeys = ['height', 'minHeight', 'maxHeight'];
      }
      const toUpdate = (
        Object.keys(panelPositionOptions) as (keyof PanelPosition)[]
      )
        .filter((key) => allowedKeys.includes(key))
        .reduce<Partial<PanelPosition>>((acc, key) => {
          acc[key] = (panelPositionOptions as Partial<PanelPosition>)[key];
          return acc;
        }, {});
      if (Object.keys(toUpdate).length > 0) {
        setPanelPosition(this, panelComponent, toUpdate);
      }
    }
  }

  /**
   * adds a panelComponent to the PanelManager and renders the Panel=
   * @param owner pluginName or vcsAppSymbol
   * @param location panel render position
   */
  add(
    panelComponentOptions: PanelComponentOptions | PanelComponent,
    owner: string | typeof vcsAppSymbol,
    location?: PanelLocation,
  ): PanelComponent {
    check(owner, oneOf(String, vcsAppSymbol));
    check(location, ofEnum(PanelLocation));

    const id = panelComponentOptions.id || uuidv4();
    const { component } = panelComponentOptions;
    const panelPosition =
      'position' in panelComponentOptions
        ? panelComponentOptions.position
        : undefined;

    const styles = { ...panelComponentOptions?.state?.styles };
    const classes = Array.isArray(panelComponentOptions?.state?.classes)
      ? [...(panelComponentOptions?.state?.classes ?? [])]
      : { ...panelComponentOptions?.state?.classes };

    const state = reactive<PanelState>({
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

    const panelComponent: PanelComponent = {
      get id(): string {
        return id;
      },
      get state(): PanelState {
        return state;
      },
      get component(): Component | undefined {
        return component;
      },
      get props(): Record<string, unknown> {
        return props;
      },
      get provides(): Record<string, unknown> {
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
   */
  removeOwner(owner: string | typeof vcsAppSymbol): void {
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
  clear(): void {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
      this.remove(id);
    });
    this._panelPositionsCache.clear();
  }

  /**
   * destroys the panelManager;
   */
  destroy(): void {
    this.added.destroy();
    this.removed.destroy();
    this.componentIds.splice(0);
    this._panelComponents.clear();
    this._panelPositionsCache.clear();
  }
}

export default PanelManager;
