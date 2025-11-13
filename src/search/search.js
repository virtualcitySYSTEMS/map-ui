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
import { ref, shallowRef } from 'vue';
import { check, oneOf } from '@vcsuite/check';
import { Icon } from 'ol/style.js';
import { getLogger } from '@vcsuite/logger';
import { vcsAppSymbol } from '../pluginHelper.js';
import {
  getDefaultPrimaryColor,
  getColorByKey,
} from '../vuePlugins/vuetify.js';
import { getColoredMapIcon } from '../components/icons/+all.js';
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
 * @property {function(string):Promise<Array<string>>} [suggest] - optional, provides suggestions for autocomplete.
 * @property {function():void} abort - should abort any ongoing requests to search or suggest without throwing an error
 * @property {function():void} destroy
 */

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
    image: getColoredMapIcon(getDefaultPrimaryColor(app)),
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
    style.image = new Icon(getColoredMapIcon(color));
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
     * @type {import("vue").Ref<string>}
     * @private
     */
    this._query = ref('');

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
   * @type {import("vue").Ref<string>}
   */
  get query() {
    return this._query;
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
    check(owner, oneOf(String, vcsAppSymbol));
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
              viewpoint.pitch =
                this._app.uiConfig.config?.searchViewpointPitch ?? -35;
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
    this.clearResults();
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
      this._app.featureInfo.clearSelection();
    }
  }

  /**
   * Clears the search query, the results and aborts running request
   */
  clearSearch() {
    this.clearResults();
    this._query.value = '';
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
