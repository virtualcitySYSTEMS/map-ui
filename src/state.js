import { check, optional } from '@vcsuite/check';
import { getLogger } from '@vcsuite/logger';
import {
  Viewpoint,
  Extent,
  getDefaultProjection,
  wgs84Projection,
  Projection,
} from '@vcmap/core';

/**
 * @typedef {Object} LayerState
 * @property {string} name
 * @property {boolean} active
 * @property {string} [styleName]
 */

/**
 * The URL state of a layer is an array. The first entry is the layer name,
 * the second its active state encoded in an integer (1 active, 0 inactive),
 * the third and optional entry, is an optional styleName to set on the layer
 * @typedef {[string,number,string|0]} UrlLayerState
 */

/**
 * @typedef {{
 *   name: string,
 *   state: T
 * }} PluginState
 * @template T
 */

/**
 * The URL state of a plugin is an array. The first entry is the plugin name, the second entry is
 * an encoded object, which is the plugins state.
 * @typedef {[string, unknown]} UrlPluginState
 */

/**
 * The URL state of a viewpoint is an array, the first entry is the camera position (or 0)
 * the second is the ground position (or 0), the third is the distance, the last three are
 * heading, pitch, roll in that order follow by an optional projection code
 * @typedef {[Array<number>|0,Array<number>|0,number,number,number,number, number?]} UrlViewpointState
 */

/**
 * The URL state of an Extent is an array, the first entry is the extent
 * the second is the projection code if needed.
 * @typedef {[import("ol/extent").Extent,number]} UrlExtentState
 */

/**
 * @typedef {Object} AppState
 * @property {import("@vcmap/core").ViewpointOptions} [activeViewpoint]
 * @property {string} [activeMap]
 * @property {Array<string>} moduleIds
 * @property {Array<LayerState>} layers
 * @property {Array<PluginState<unknown>>} plugins
 * @property {string} [activeObliqueCollection]
 */

/**
 * @typedef {AppState} CachedAppState
 * @property {() => import("@vcmap/core").Viewpoint?} [getViewpoint]
 */

/**
 * The URL state of the app is an array. To null parameters, pass in 0 instead.
 * The first entry is the viewpoint state, the second the active map name
 * The third is an array of modules to apply the state to
 * the fourth is an array of layer states
 * the fifth is an array of plugin states
 * the sixth is the currently active oblique collection or 0 if not applicable
 * @typedef {[UrlViewpointState|UrlExtentState,string,Array<string>,Array<UrlLayerState>,Array<UrlPluginState>,(string|0)]} UrlAppState
 */

/**
 * @type {number}
 */
const MAX_URL_LENGTH = 2048;

/**
 * @returns {AppState}
 */
export function createEmptyState() {
  return {
    moduleIds: [],
    layers: [],
    plugins: [],
  };
}

/**
 * @param {UrlViewpointState} state
 * @returns {import("@vcmap/core").ViewpointOptions|null}
 */
function parseUrlViewpointState(state) {
  const vp = new Viewpoint({
    cameraPosition: state[0] ?? undefined,
    groundPosition: state[1] ?? undefined,
    distance: state[2] > 0 ? state[2] : undefined,
    heading: state[3],
    pitch: state[4],
    roll: state[5],
  });

  return vp.isValid() ? vp.toJSON() : null;
}

/**
 * @param {UrlViewpointState} state
 * @returns {import("@vcmap/core").ViewpointOptions|null}
 */
export function parseUrlProjectedViewpointState(state) {
  const projection = getDefaultProjection();
  const projectionCode = parseInt(projection.epsg.split(':')[1], 10);

  let cameraPosition = state[0];
  let groundPosition = state[1];
  if (state[6] && state[6] === projectionCode) {
    if (cameraPosition) {
      // (cameraPosition instanceof Coordinate)
      cameraPosition = Projection.transform(
        wgs84Projection,
        projection,
        cameraPosition,
      );
    }
    if (groundPosition) {
      groundPosition = Projection.transform(
        wgs84Projection,
        projection,
        groundPosition,
      );
    }
  }

  const vp = new Viewpoint({
    cameraPosition: cameraPosition ?? undefined,
    groundPosition: groundPosition ?? undefined,
    distance: state[2] > 0 ? state[2] : undefined,
    heading: state[3],
    pitch: state[4],
    roll: state[5],
  });
  vp.animate = false;
  return vp.isValid() ? vp.toJSON() : null;
}

/**
 * @param {UrlExtentState} state
 * @returns {import("@vcmap/core").ViewpointOptions|null}
 */
export function parseUrlExtentState(state) {
  const projection = getDefaultProjection();
  const projectionCode = parseInt(projection.epsg.split(':')[1], 10);
  const extentOptions = { coordinates: state[0] };
  if (projectionCode === state[1]) {
    extentOptions.projection = projection;
  } else {
    extentOptions.projection = wgs84Projection;
  }
  const extent = new Extent(extentOptions);
  const vp = Viewpoint.createViewpointFromExtent(extent);
  vp.animate = false;
  return vp.isValid() ? vp.toJSON() : null;
}

/**
 * @param {UrlLayerState} state
 * @returns {LayerState}
 */
function parseUrlLayerState(state) {
  const layerState = {
    name: state[0],
    active: !!state[1],
  };
  if (state[2] !== 0) {
    layerState.styleName = state[2];
  }
  return layerState;
}

/**
 * @param {LayerState} state
 * @returns {UrlLayerState}
 */
function writeUrlLayerState(state) {
  return [state.name, state.active ? 1 : 0, state.styleName ?? 0];
}

/**
 * @param {UrlPluginState} state
 * @returns {PluginState}
 */
function parseUrlPluginState(state) {
  return {
    name: state[0],
    state: state[1],
  };
}

/**
 * @param {PluginState} state
 * @returns {UrlPluginState}
 */
function writeUrlPluginState(state) {
  return [state.name, state.state];
}

/**
 * @param {UrlAppState} urlState
 * @returns {AppState}
 */
function parseUrlAppState(urlState) {
  const state = createEmptyState();
  if (Array.isArray(urlState[0])) {
    if (urlState[0][0].length === 4) {
      state.getViewpoint = () => parseUrlExtentState(urlState[0]);
    } else if (urlState[0].length === 7) {
      state.getViewpoint = () => parseUrlProjectedViewpointState(urlState[0]);
    } else {
      state.activeViewpoint = parseUrlViewpointState(urlState[0]);
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
  return state;
}

/**
 * @param {AppState} state
 * @param {number} maxLength
 * @returns {UrlAppState}
 */
function writeUrlAppState(state, maxLength) {
  /**
   * @type {UrlAppState}
   */
  const urlState = new Array(6).fill(0);
  if (state.activeViewpoint) {
    urlState[0] = [
      state.activeViewpoint.cameraPosition?.slice() ?? 0,
      state.activeViewpoint.groundPosition?.slice() ?? 0,
      state.activeViewpoint.distance ?? 0,
      state.activeViewpoint.heading,
      state.activeViewpoint.pitch,
      state.activeViewpoint.roll,
    ];
  }

  if (state.activeMap) {
    urlState[1] = state.activeMap;
  }

  urlState[2] = state.moduleIds.slice();
  urlState[3] = [];
  urlState[4] = [];

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
    urlState[4].length !== state.plugins.length
  ) {
    getLogger('StateManagement').warning(
      'State too large for URL: Not all layers and plugins are represented',
    );
  }

  return urlState;
}

/**
 * @param {(URL)=} url
 * @returns {AppState}
 */
export function getStateFromURL(url) {
  check(url, URL);

  if (url.searchParams.has('state')) {
    try {
      return parseUrlAppState(JSON.parse(url.searchParams.get('state')));
    } catch (e) {
      getLogger('StateManager').error(
        'failed to parse the state URL parameter',
      );
    }
  }
  return createEmptyState();
}

/**
 * @param {AppState} state
 * @param {URL} url - sets the query parameter "state" on this URL
 */
export function setStateToUrl(state, url) {
  check(state, {
    activeMap: optional(String),
    activeViewpoint: optional(Object),
    activeObliqueCollection: optional(String),
    layers: Array,
    plugins: Array,
    moduleIds: [String],
  });
  check(url, URL);

  const maxLength = MAX_URL_LENGTH - url.toString().length;
  url.searchParams.set(
    'state',
    JSON.stringify(writeUrlAppState(state, maxLength)),
  );
}
