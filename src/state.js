import { check } from '@vcsuite/check';
import { getLogger } from '@vcsuite/logger';
import { Viewpoint } from '@vcmap/core';

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
 * @typedef {Object} PluginState
 * @property {string} name
 * @property {*} state
 */

/**
 * The URL state of a plugin is an array. The first entry is the plugin name, the second entry is
 * an encoded object, which is the plugins state.
 * @typedef {[string, *]} UrlPluginState
 */

/**
 * The URL state of a viewpoint is an array, the first entry is the camera position (or 0)
 * the second is the ground position (or 0), the third is the distance, the last three are
 * heading, pitch, roll in that order
 * @typedef {[Array<number>|0,Array<number>|0,number,number,number,number]} UrlViewpointState
 */

/**
 * @typedef {Object} AppState
 * @property {import("@vcmap/core").ViewpointOptions} [activeViewpoint]
 * @property {string} [activeMap]
 * @property {Array<string>} moduleIds
 * @property {Array<LayerState>} layers
 * @property {Array<PluginState>} plugins
 * @property {string} [activeObliqueCollection]
 */

/**
 * The URL state of the app is an array. To null parameters, pass in 0 instead.
 * The first entry is the viewpoint state, the second the active map name
 * The third is an array of modules to apply the state to
 * the fourth is an array of layer states
 * the fifth is an array of plugin states
 * the sixth is the currently active oblique collection or 0 if not applicable
 * @typedef {[UrlViewpointState,string,Array<string>,Array<UrlLayerState>,Array<UrlPluginState>,(string|0)]} UrlAppState
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
    state.activeViewpoint = parseUrlViewpointState(urlState[0]);
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
    if ((JSON.stringify(urlState).length + JSON.stringify(layerUrlState).length) < maxLength) {
      urlState[3].push(layerUrlState);
    }
  });

  state.plugins.forEach((pluginState) => {
    const urlPluginState = writeUrlPluginState(pluginState);
    if ((JSON.stringify(urlState).length + JSON.stringify(urlPluginState).length) < maxLength) {
      urlState[4].push(urlPluginState);
    }
  });

  if (urlState[3].length !== state.layers.length || urlState[4].length !== state.plugins.length) {
    getLogger('StateManagement').warning('State too large for URL: Not all layers and plugins are represented');
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
      getLogger('StateManager').error('failed to parse the state URL parameter');
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
    activeMap: [String, undefined],
    activeViewpoint: [Object, undefined],
    activeObliqueCollection: [String, undefined],
    layers: Array,
    plugins: Array,
    moduleIds: [String],
  });
  check(url, URL);

  const maxLength = MAX_URL_LENGTH - url.toString().length;
  url.searchParams.set('state', JSON.stringify(writeUrlAppState(state, maxLength)));
}
