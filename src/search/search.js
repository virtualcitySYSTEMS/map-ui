import {
  IndexedCollection,
  markVolatile,
  maxZIndex,
  mercatorProjection,
  VcsEvent,
  vcsLayerName,
  VectorLayer,
  VectorStyleItem,
  Viewpoint,
} from '@vcmap/core';
import { shallowRef } from 'vue';
import { check } from '@vcsuite/check';
import { Icon } from 'ol/style.js';
import { getLogger } from '@vcsuite/logger';
import { vcsAppSymbol } from '../pluginHelper.js';
import {
  getDefaultPrimaryColor,
  getColorByKey,
} from '../vuePlugins/vuetify.js';
import { getViewpointFromFeature } from '../actions/actionHelper.js';

/**
 * A readonly rendering interface of a ResultItem.
 * A ResultItem must provide either a feature, a clicked handler or both.
 * @typedef {Object} ResultItem
 * @property {string} title
 * @property {string} [icon] An optional icon
 * @property {Array<import("../actions/actionHelper.js").VcsAction>} [actions]
 * @property {function():Promise<void>} [clicked] Obligatory, if no feature is provided. Can overwrite default zoom to feature behaviour.
 * @property {import("ol").Feature|undefined} [feature] If a feature (in web mercator) is provided, the feature is added to the result layer and search zooms to the layer's extent. Default clicked handler is zoom to feature, highlight feature and select feature, if feature has a FeatureInfoView.
 */

/**
 * @typedef {Object} SearchImpl
 * @property {string} name Name of the implementation. Must be unique, best practice is to prefix with your plugin name to ensure uniqueness or use a uuid.
 * @property {function(string):Promise<Array<ResultItem>>} search
 * @property {function(string):Promise<Array<string>>} [suggest] // XXX currently not implemented in UI at Beta state
 * @property{function():void} abort - should abort any ongoing requests to search or suggest without throwing an error
 * @property {function():void} destroy
 */

/**
 * @param {string} color
 * @returns {import("ol/style/Icon").Options}
 */
function getPointResultIcon(color) {
  return {
    src: `data:image/svg+xml,%3Csvg xmlns:dc='http://purl.org/dc/elements/1.1/' xmlns:cc='http://creativecommons.org/ns%23' xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns%23' xmlns:svg='http://www.w3.org/2000/svg' xmlns='http://www.w3.org/2000/svg' xmlns:sodipodi='http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd' xmlns:inkscape='http://www.inkscape.org/namespaces/inkscape' id='icon_24_poi' width='24' height='23.994' viewBox='0 0 24 23.994' sodipodi:docname='mapIcon.svg'%3E%3Cg id='Gruppe_1972' transform='translate(-571 -609.477)'%3E%3Cpath id='Pfad_773' d='M583,611a8.009,8.009,0,0,0-8,8c0,5.314,6.952,13.32,7.248,13.658a1,1,0,0,0,1.5,0c.3-.338,7.248-8.344,7.248-13.658A8.009,8.009,0,0,0,583,611Zm0,19.444c-2.18-2.685-6-8.09-6-11.444a6,6,0,0,1,12,0C589,622.354,585.18,627.759,583,630.444Z' fill='currentColor' /%3E%3Cpath id='Pfad_774' d='M583,615a4,4,0,1,0,4,4A4,4,0,0,0,583,615Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,583,621Z' fill='currentColor' /%3E%3C/g%3E%3Cpath fill='${encodeURIComponent(
      color,
    )}' d='M 11.672998,20.526286 C 8.5115524,16.526958 6.4310003,12.714969 6.0702695,10.260963 6.0109099,9.8571482 6.0115821,9.1201807 6.0716855,8.7084104 6.4424582,6.1682348 8.3335069,4.1603103 10.828528,3.6575721 c 1.904966,-0.383844 3.881822,0.1903514 5.289639,1.5364231 0.993092,0.9495349 1.610829,2.1488769 1.810148,3.5144152 0.0601,0.4117703 0.06077,1.1487378 0.0014,1.5525526 -0.357076,2.429138 -2.337816,6.081898 -5.487559,10.119822 -0.224045,0.287223 -0.415188,0.530536 -0.424763,0.540696 -0.0096,0.01016 -0.16456,-0.167678 -0.344411,-0.395195 z m 0.990366,-7.047968 c 0.894914,-0.146674 1.762065,-0.627065 2.349286,-1.301476 0.86707,-0.995812 1.194989,-2.3427819 0.880571,-3.6170541 -0.379849,-1.5394474 -1.596396,-2.6842781 -3.173401,-2.9863277 -0.368703,-0.070619 -1.070937,-0.070619 -1.43964,0 C 9.7056173,5.875042 8.48604,7.0227247 8.1067793,8.5597879 7.8410265,9.6368274 8.0329903,10.787029 8.6317551,11.705317 c 0.5717674,0.876885 1.4205679,1.474277 2.4457369,1.721329 0.47704,0.114961 1.079877,0.134602 1.585872,0.05167 z' id='path1432' /%3E%3C/svg%3E`,
    scale: 1,
    color,
  };
}

/**
 * sets up result layer for displaying search results
 * @param {import("@src/vcsUiApp.js").default} app
 * @returns {{ resultLayer: import("@vcmap/core").VectorLayer, destroy: (function(): void)}}
 */
function setupSearchResultLayer(app) {
  const resultLayer = new VectorLayer({
    projection: mercatorProjection.toJSON(),
    vectorProperties: {
      altitudeMode: 'clampToGround',
      classificationType: 'both',
    },
    properties: {
      title: 'search.title',
    },
    zIndex: maxZIndex,
  });
  markVolatile(resultLayer);
  app.layers.add(resultLayer);

  const style = new VectorStyleItem({
    image: getPointResultIcon(getDefaultPrimaryColor(app)),
    fill: {
      color: 'rgba(237, 237, 237, 0.1)',
    },
    stroke: {
      color: getDefaultPrimaryColor(app),
      width: 5,
    },
  });
  resultLayer.setStyle(style);

  function setResultColor() {
    const color = getColorByKey(app, 'primary');
    style.stroke?.setColor(color);
    style.image = new Icon(getPointResultIcon(color));
    resultLayer.forceRedraw();
  }

  const themChangedListener = app.themeChanged.addEventListener(setResultColor);

  const destroy = () => {
    resultLayer.destroy();
    themChangedListener();
  };

  return { resultLayer, destroy };
}

/**
 * Symbol added to search implementations to specify the implementation's owner
 * @type {symbol}
 */
const searchImplOwnerSymbol = Symbol('featureInfoView');

/**
 * Collection of SearchImpl
 * @extends {IndexedCollection<SearchImpl>}
 */
class Search extends IndexedCollection {
  /**
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(app) {
    super();

    /**
     * @type {import("@src/vcsUiApp.js").default}
     * @private
     */
    this._app = app;

    /**
     * An event triggered every time the currentResults array changes,
     * either by a new search providing the new results or
     * on clearing, if the results array has not been empty already.
     * @type {import("@vcmap/core").VcsEvent<Array<ResultItem>>}
     * @private
     */
    this._resultsChanged = new VcsEvent();

    /**
     * @type {import("vue").Ref<Array<ResultItem>>}
     * @private
     */
    this._currentResults = shallowRef([]);
    const { resultLayer, destroy } = setupSearchResultLayer(app);
    /**
     * @type {import("@vcmap/core").VectorLayer}
     * @private
     */
    this._resultLayer = resultLayer;
    /**
     * @type {function():void}
     * @private
     */
    this._destroyResultLayer = destroy;
  }

  /**
   * An event triggered every time the currentResults array changes,
   * either by a new search providing the new results or
   * on clearing, if the results array has not been empty already.
   * @type {import("@vcmap/core").VcsEvent<Array<ResultItem>>}
   */
  get resultsChanged() {
    return this._resultsChanged;
  }

  /**
   * @type {import("vue").Ref<Array<ResultItem>>}
   */
  get currentResults() {
    return this._currentResults;
  }

  /**
   * @type {VectorLayer}
   */
  get resultLayer() {
    return this._resultLayer;
  }

  /**
   * @param {SearchImpl} item
   * @param {string|symbol} owner pluginName or vcsAppSymbol
   * @param {number=} index
   */
  add(item, owner, index) {
    check(owner, [String, vcsAppSymbol]);
    check(item.search, Function);

    item[searchImplOwnerSymbol] = owner;
    super.add(item, index);
  }

  /**
   * removes all search implementations of a specific owner (plugin) and fires removed Events
   * @param {string|vcsAppSymbol} owner
   */
  removeOwner(owner) {
    this._array.forEach((impl) => {
      if (impl[searchImplOwnerSymbol] === owner) {
        super.remove(impl);
      }
    });
  }

  /**
   * Get the results for a given query string.
   * Available features are added to results layer and map is zoomed to all results (extent of result layer).
   * Adds default clicked handler to result items with feature, which zooms to and highlights said feature. If feature has FeatureInfoView, feature is selected by featureInfo.
   * @param {string} q
   * @returns {Promise<Array<ResultItem>>}
   */
  async search(q) {
    this.clearResults();
    const promises = await Promise.allSettled(
      [...this._array].map((impl) => impl.search(q)),
    );
    const isAborted = promises.some(
      (r) => r.status === 'rejected' && r.reason?.name === 'AbortError',
    );
    if (!isAborted) {
      const results = promises
        .map((o) => {
          if (o.status === 'rejected') {
            getLogger('Search').warning(o.reason);
            return [];
          }
          return o.value;
        })
        .flat();

      this._currentResults.value = results
        .filter((r) => r.feature || r.clicked)
        .map((item) => {
          if (item.feature) {
            this._resultLayer.addFeatures([item.feature]);
            if (!item.clicked) {
              const viewpoint = getViewpointFromFeature(item.feature);
              item.clicked = () => {
                this._app.maps.activeMap.gotoViewpoint(viewpoint);
                return this._app.featureInfo.selectFeature(item.feature);
              };
            }
          }
          return item;
        });
      if (this._currentResults.value.length > 0) {
        await this._resultLayer.activate();
        this.resultsChanged.raiseEvent(this._currentResults.value.slice(0));
      }
    }
    return this._currentResults.value;
  }

  /**
   * Get the suggestions for a given query string
   * @param {string} q
   * @returns {Promise<Array<string>>}
   */
  async suggest(q) {
    const promises = await Promise.allSettled(
      [...this._array].map((impl) => {
        if (impl.suggest) {
          return impl.suggest(q);
        }
        return Promise.resolve([]);
      }),
    );
    const isAborted = promises.some(
      (r) => r.status === 'rejected' && r.reason?.name === 'AbortError',
    );
    if (isAborted) {
      return [];
    }
    const suggestions = promises
      .map((o) => {
        if (o.status === 'rejected') {
          getLogger('Search').warning(o.reason);
          return [];
        }
        return o.value;
      })
      .flat();
    return suggestions;
  }

  /**
   * Aborting any ongoing request
   */
  abort() {
    [...this._array].forEach((impl) => impl.abort?.());
  }

  /**
   * Zooms to the extent of all available result features
   * @returns {Promise<void>}
   */
  async zoomToAll() {
    if (this._resultLayer.getFeatures().length > 0) {
      const extent = this._resultLayer.getZoomToExtent();
      const viewpoint = Viewpoint.createViewpointFromExtent(extent);
      await this._app.maps.activeMap.gotoViewpoint(viewpoint);
    }
  }

  /**
   * Clears the results and aborts running request
   */
  clearResults() {
    this.abort();
    if (this._currentResults.value.length > 0) {
      this._currentResults.value = [];
      this.resultsChanged.raiseEvent(this._currentResults.value.slice(0));
    }
    this._resultLayer.removeAllFeatures();
    this._resultLayer.deactivate();
    if (
      this._app.featureInfo.selectedFeature?.[vcsLayerName] ===
      this._resultLayer.name
    ) {
      this._app.featureInfo.clear();
    }
  }

  /**
   * @inheritDoc
   */
  destroy() {
    [...this._array].forEach((impl) => impl.destroy());
    this.resultsChanged.destroy();
    this._destroyResultLayer();
    super.destroy();
  }
}

export default Search;
