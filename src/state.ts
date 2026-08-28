import { check, optional } from '@vcsuite/check';
import { getLogger } from '@vcsuite/logger';
import type {
  ViewpointOptions,
  ExtentOptions,
  VcsModuleConfig,
  WMSLayer,
  WMSOptions,
} from '@vcmap/core';
import {
  Viewpoint,
  Extent,
  getDefaultProjection,
  wgs84Projection,
  Projection,
  getCaughtError,
} from '@vcmap/core';
import type { Extent as OLExtent } from 'ol/extent.js';

export type LayerState = {
  name: string;
  active: boolean;
  styleName?: string;
};

/**
 * The URL state of a layer is an array. The first entry is the layer name,
 * the second its active state encoded in an integer (1 active, 0 inactive),
 * the third and optional entry, is an optional styleName to set on the layer
 */
type UrlLayerState = [string, number, string | 0];

export type PluginState<T> = {
  name: string;
  state: T;
};

/**
 * The URL state of a plugin is an array. The first entry is the plugin name, the second entry is
 * an encoded object, which is the plugins state.
 */
type UrlPluginState = [string, unknown];

export type ClippingPolygonState = {
  name: string;
  active: boolean;
};
/**
 * The URL state of a ClippingPolygon is an array. The first entry is the ClippingPolygon name,
 * the second its active state encoded in an integer (1 active, 0 inactive).
 */
type UrlClippingPolygonState = [string, number];

/**
 * The URL state of a viewpoint is an array, the first entry is the camera position (or 0)
 * the second is the ground position (or 0), the third is the distance, the last three are
 * heading, pitch, roll in that order follow by an optional projection code
 */
type UrlViewpointState = [
  Array<number> | 0,
  Array<number> | 0,
  number,
  number,
  number,
  number,
  number?,
];

/**
 * The URL state of an Extent is an array, the first entry is the extent
 * the second is the projection code if needed.
 */
type UrlExtentState = [OLExtent, number];

export type AppState = {
  activeViewpoint?: ViewpointOptions;
  activeMap?: string;
  moduleIds: Array<string>;
  layers: Array<LayerState>;
  plugins: Array<PluginState<unknown>>;
  activeObliqueCollection?: string;
  clippingPolygons: Array<ClippingPolygonState>;
};

export type CachedAppState = AppState & {
  getViewpoint?: (moduleId: string) => ViewpointOptions | null;
};

/**
 * The URL state of the app is an array. To null parameters, pass in 0 instead.
 * The first entry is the viewpoint state or an extent state
 * The second the active map name
 * The third is an array of modules to apply the state to
 * the fourth is an array of layer states
 * the fifth is an array of plugin states
 * the sixth is the currently active oblique collection or 0 if not applicable
 * the seventh is an array of ClippingPolygons states
 */
type UrlAppState = [
  UrlViewpointState | UrlExtentState,
  string,
  Array<string>,
  Array<UrlLayerState>,
  Array<UrlPluginState>,
  string | 0,
  Array<UrlClippingPolygonState>,
];

const MAX_URL_LENGTH = 2048;

export function createEmptyState(): CachedAppState {
  return {
    moduleIds: [],
    layers: [],
    plugins: [],
    clippingPolygons: [],
  };
}

function parseUrlViewpointState(
  state: UrlViewpointState,
): ViewpointOptions | null {
  const vp = new Viewpoint({
    cameraPosition: state[0] || undefined,
    groundPosition: state[1] || undefined,
    distance: state[2] > 0 ? state[2] : undefined,
    heading: state[3],
    pitch: state[4],
    roll: state[5],
  });

  if (vp.isValid()) {
    return vp.toJSON();
  } else {
    getLogger('StateManagement').warning(
      'The provided viewpoint options are not valid. Viewpoint will be ignored.',
    );
    return null;
  }
}

export function parseUrlProjectedViewpointState(
  state: UrlViewpointState,
  moduleId: string,
): ViewpointOptions | null {
  const projection = getDefaultProjection();
  const projectionCode = parseInt(projection.epsg.split(':')[1], 10);

  if (state[6] === projectionCode) {
    let cameraPosition;
    let groundPosition;
    if (state[0]) {
      // (cameraPosition instanceof Coordinate)
      cameraPosition = Projection.transform(
        wgs84Projection,
        projection,
        state[0],
      );
    }
    if (state[1]) {
      groundPosition = Projection.transform(
        wgs84Projection,
        projection,
        state[1],
      );
    }
    return parseUrlViewpointState([
      cameraPosition ?? 0,
      groundPosition ?? 0,
      state[2],
      state[3],
      state[4],
      state[5],
      state[6],
    ]);
  } else {
    getLogger('StateManagement').warning(
      `The provided viewpoint epsg code (${state[6]}) does not equal epsg code (${projectionCode}) of module '${moduleId}' and therefore can not be handled. Camera and ground position will be ignored.`,
    );
    return null;
  }
}

export function parseUrlExtentState(
  state: UrlExtentState,
  moduleId: string,
): ViewpointOptions | null {
  const projection = getDefaultProjection();
  const projectionCode = parseInt(projection.epsg.split(':')[1], 10);
  const extentOptions: ExtentOptions = { coordinates: state[0] };
  if (!state[1]) {
    extentOptions.projection = wgs84Projection;
  } else if (state[1] && state[1] === projectionCode) {
    extentOptions.projection = projection;
  } else {
    getLogger('StateManagement').warning(
      `The provided extent epsg code (${state[1]}) does not equal epsg code (${projectionCode}) of module '${moduleId}' and therefore can not be handled. The provided extent will be ignored.`,
    );
    return null;
  }
  const extent = new Extent(extentOptions);

  if (extent.isValid()) {
    const vp = Viewpoint.createViewpointFromExtent(extent);
    if (vp) {
      vp.animate = false;
      return vp.toJSON();
    }
  }
  getLogger('StateManagement').warning(
    'The provided extent options are not valid. Extent will be ignored.',
  );
  return null;
}

export function parseWMSStyle(style: string): {
  layers: string;
  styles: string;
} {
  const [layerLengthString, parts] = style.split(';');
  const layerLength = parseInt(layerLengthString, 10);
  return {
    layers: parts.substring(0, layerLength),
    styles: parts.substring(layerLength),
  };
}

export function writeWMSStyleForLayer(
  layer: WMSLayer,
  moduleConfig?: VcsModuleConfig,
): string | undefined {
  const config = (moduleConfig?.layers?.find(
    (m) => m.name === layer.name,
  ) as WMSOptions) ?? {
    layers: '',
    parameters: {},
  };
  let currentLayers = layer.getLayers().join(',');
  if (currentLayers === config.layers) {
    currentLayers = '';
  }

  let currentStyle = layer.parameters.STYLES || '';
  if (
    config.parameters instanceof Object &&
    config.parameters !== null &&
    (currentStyle === config.parameters?.STYLES ||
      currentStyle === config.parameters?.styles)
  ) {
    currentStyle = '';
  }
  if (currentLayers || currentStyle) {
    return `${currentLayers.length};${currentLayers}${currentStyle}`;
  }
  return undefined;
}

function parseUrlLayerState(state: UrlLayerState): LayerState {
  const layerState: LayerState = {
    name: state[0],
    active: !!state[1],
  };
  if (state[2] !== 0) {
    layerState.styleName = state[2];
  }
  return layerState;
}

function writeUrlLayerState(state: LayerState): UrlLayerState {
  return [state.name, state.active ? 1 : 0, state.styleName ?? 0];
}

function parseUrlPluginState(state: UrlPluginState): PluginState<unknown> {
  return {
    name: state[0],
    state: state[1],
  };
}

function writeUrlPluginState(state: PluginState<unknown>): UrlPluginState {
  return [state.name, state.state];
}

function parseUrlClippingPolygonState(
  state: UrlClippingPolygonState,
): ClippingPolygonState {
  return { name: state[0], active: !!state[1] };
}

function writeUrlClippingPolygonState(
  state: ClippingPolygonState,
): UrlClippingPolygonState {
  return [state.name, state.active ? 1 : 0];
}

function isUrlExtentState(
  state: UrlViewpointState | UrlExtentState,
): state is UrlExtentState {
  return Array.isArray(state[0]) && state[0].length === 4;
}
function isUrlViewpointState(
  state: UrlViewpointState | UrlExtentState,
): state is UrlViewpointState {
  return Array.isArray(state[0]) && state[0].length >= 6;
}

function parseUrlAppState(urlState: UrlAppState): CachedAppState {
  const state = createEmptyState();
  if (Array.isArray(urlState[0])) {
    const state0 = urlState[0];
    if (isUrlExtentState(state0)) {
      state.getViewpoint = (moduleId): ViewpointOptions | null =>
        parseUrlExtentState(state0, moduleId);
    } else if (isUrlViewpointState(state0)) {
      state.getViewpoint = (moduleId): ViewpointOptions | null =>
        parseUrlProjectedViewpointState(state0, moduleId);
    } else {
      state.activeViewpoint = parseUrlViewpointState(state0) ?? undefined;
    }
  }
  if (typeof urlState[1] === 'string') {
    state.activeMap = urlState[1];
  }
  if (Array.isArray(urlState[2])) {
    state.moduleIds = urlState[2].slice();
  }
  if (Array.isArray(urlState[3])) {
    urlState[3].forEach((urlLayerState) => {
      if (Array.isArray(urlLayerState)) {
        state.layers.push(parseUrlLayerState(urlLayerState));
      }
    });
  }
  if (Array.isArray(urlState[4])) {
    urlState[4].forEach((urlPluginState) => {
      if (Array.isArray(urlPluginState)) {
        state.plugins.push(parseUrlPluginState(urlPluginState));
      }
    });
  }
  if (typeof urlState[5] === 'string') {
    state.activeObliqueCollection = urlState[5];
  }
  if (Array.isArray(urlState[6])) {
    urlState[6].forEach((urlClippingPolygonState) => {
      if (Array.isArray(urlClippingPolygonState)) {
        state.clippingPolygons.push(
          parseUrlClippingPolygonState(urlClippingPolygonState),
        );
      }
    });
  }
  return state;
}

function writeUrlAppState(state: AppState, maxLength: number): UrlAppState {
  const urlState: UrlAppState = new Array(7).fill(0) as UrlAppState;
  if (state.activeViewpoint) {
    const { cameraPosition, groundPosition, distance, heading, pitch, roll } =
      state.activeViewpoint;
    function toFixed(num: number, digits: number): number {
      return Math.round(num * 10 ** digits) / 10 ** digits;
    }
    function formatCoord(coord: number[]): number[] {
      if (coord[2] === undefined) {
        return [toFixed(coord[0], 6), toFixed(coord[1], 6)];
      }
      return [toFixed(coord[0], 6), toFixed(coord[1], 6), toFixed(coord[2], 2)];
    }
    const overwriteRoll =
      !roll || Math.abs(roll - 360) < 1e-4 || Math.abs(roll) < 1e-4;
    urlState[0] = [
      cameraPosition ? formatCoord(cameraPosition) : 0,
      groundPosition ? formatCoord(groundPosition) : 0,
      distance ? toFixed(distance, 2) : 0,
      heading ? toFixed(heading, 4) : 0,
      pitch ? toFixed(pitch, 4) : -90,
      overwriteRoll ? 0 : toFixed(roll, 4),
    ];
  }

  if (state.activeMap) {
    urlState[1] = state.activeMap;
  }

  urlState[2] = state.moduleIds.slice();
  urlState[3] = [];
  urlState[4] = [];
  urlState[6] = [];

  if (state.activeObliqueCollection) {
    urlState[5] = state.activeObliqueCollection;
  }

  state.layers.forEach((layerState) => {
    const layerUrlState = writeUrlLayerState(layerState);
    if (
      JSON.stringify(urlState).length + JSON.stringify(layerUrlState).length <
      maxLength
    ) {
      urlState[3].push(layerUrlState);
    }
  });

  state.clippingPolygons.forEach((clippingPolygonState) => {
    const clippingPolygonUrlState =
      writeUrlClippingPolygonState(clippingPolygonState);
    if (
      JSON.stringify(urlState).length +
        JSON.stringify(clippingPolygonUrlState).length <
      maxLength
    ) {
      urlState[6].push(clippingPolygonUrlState);
    }
  });

  state.plugins.forEach((pluginState) => {
    const urlPluginState = writeUrlPluginState(pluginState);
    if (
      JSON.stringify(urlState).length + JSON.stringify(urlPluginState).length <
      maxLength
    ) {
      urlState[4].push(urlPluginState);
    }
  });

  if (
    urlState[3].length !== state.layers.length ||
    urlState[4].length !== state.plugins.length ||
    urlState[6].length !== state.clippingPolygons.length
  ) {
    getLogger('StateManagement').warning(
      'State too large for URL: Not all layers, clipping polygons and plugins are represented',
    );
  }

  return urlState;
}

export function getStateFromURL(url: URL): CachedAppState {
  check(url, URL);

  if (url.searchParams.has('state')) {
    try {
      return parseUrlAppState(JSON.parse(url.searchParams.get('state')!));
    } catch (e: unknown) {
      getLogger('StateManager').error(
        'failed to parse the state URL parameter',
        getCaughtError(e).message,
      );
    }
  }
  return createEmptyState();
}

/**
 * @param url - sets the query parameter "state" on this URL
 */
export function setStateToUrl(state: AppState, url: URL): void {
  check(state, {
    activeMap: optional(String),
    activeViewpoint: optional(Object),
    activeObliqueCollection: optional(String),
    layers: Array,
    plugins: Array,
    clippingPolygons: Array,
    moduleIds: [String],
  });
  check(url, URL);

  const maxLength = MAX_URL_LENGTH - url.toString().length;
  url.searchParams.set(
    'state',
    JSON.stringify(writeUrlAppState(state, maxLength)),
  );
}
