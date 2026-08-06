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
import type { Ref } from 'vue';
import { ref, shallowRef } from 'vue';
import { check, oneOf } from '@vcsuite/check';
import type Feature from 'ol/Feature.js';
import { Icon } from 'ol/style.js';
import { getLogger } from '@vcsuite/logger';
import type VcsUiApp from '../vcsUiApp.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import {
  getDefaultPrimaryColor,
  getColorByKey,
} from '../vuePlugins/vuetify.js';
import { getColoredMapIcon } from '../components/icons/+all.js';
import type { VcsAction } from '../actions/actionHelper.js';
import { getViewpointFromFeature } from '../actions/actionHelper.js';

/** A ResultItem must provide either a feature, a clicked handler or both. */
export type ResultItem = {
  title: string;
  icon?: string;
  actions?: Array<VcsAction>;
  /** Obligatory, if no feature is provided. Can overwrite default zoom to feature behaviour. */
  clicked?: () => Promise<void>;
  /** If a feature (in web mercator) is provided, the feature is added to the result layer and search zooms to the layer's extent. Default clicked handler is zoom to and highlight feature and select feature, if feature has a FeatureInfoView. */
  feature?: Feature | undefined;
};

export type SearchImpl = {
  /** Name of the implementation. Must be unique, best practice is to prefix with your plugin name to ensure uniqueness or use a uuid. */
  name: string;
  search: (query: string) => Promise<Array<ResultItem>>;
  /** Optional, provides suggestions for autocomplete. */
  suggest?: (query: string) => Promise<Array<string>>;
  /** Should abort any ongoing requests to search or suggest without throwing an error */
  abort?: () => void;
  destroy: () => void;
};

/**
 * sets up result layer for displaying search results
 */
function setupSearchResultLayer(app: VcsUiApp): {
  resultLayer: VectorLayer;
  destroy: () => void;
} {
  const resultLayer = new VectorLayer({
    projection: mercatorProjection.toJSON(),
    vectorProperties: {
      altitudeMode: 'clampToGround',
      classificationType: 'both',
    },
    properties: { title: 'search.title' },
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

  function setResultColor(): void {
    const color = getColorByKey(app, 'primary');
    style.stroke?.setColor(color);
    style.image = new Icon(getColoredMapIcon(color));
    resultLayer.forceRedraw().catch(() => {});
  }

  const themeChangedListener =
    app.themeChanged.addEventListener(setResultColor);

  const destroy = (): void => {
    resultLayer.destroy();
    themeChangedListener();
  };

  return { resultLayer, destroy };
}

/**
 * Symbol added to search implementations to specify the implementation's owner
 */
const searchImplOwnerSymbol = Symbol('featureInfoView');

/**
 * Collection of SearchImpl
 */
class Search extends IndexedCollection<SearchImpl> {
  private _app: VcsUiApp;
  private _query = ref('');
  /**
   * An event triggered every time the currentResults array changes,
   * either by a new search providing the new results or
   * on clearing, if the results array has not been empty already.
   */
  private _resultsChanged = new VcsEvent<Array<ResultItem>>();
  private _currentResults = shallowRef<Array<ResultItem>>([]);
  private _resultLayer: VectorLayer;
  private _destroyResultLayer: () => void;
  constructor(app: VcsUiApp) {
    super();
    this._app = app;
    const { resultLayer, destroy } = setupSearchResultLayer(app);
    this._resultLayer = resultLayer;
    this._destroyResultLayer = destroy;
  }

  /**
   * An event triggered every time the currentResults array changes,
   * either by a new search providing the new results or
   * on clearing, if the results array has not been empty already.
   */
  get resultsChanged(): VcsEvent<Array<ResultItem>> {
    return this._resultsChanged;
  }

  get query(): Ref<string> {
    return this._query;
  }

  get currentResults(): Ref<Array<ResultItem>> {
    return this._currentResults;
  }

  get resultLayer(): VectorLayer {
    return this._resultLayer;
  }

  // @ts-expect-error not the same signature
  add(item: SearchImpl, owner: string | symbol, index?: number): void {
    check(owner, oneOf(String, vcsAppSymbol));
    check(item.search, Function);

    // @ts-expect-error missing searchImplOwnerSymbol property
    item[searchImplOwnerSymbol] = owner;
    super.add(item, index);
  }

  /**
   * removes all search implementations of a specific owner (plugin) and fires removed Events
   */
  removeOwner(owner: string | symbol): void {
    this._array.forEach((impl) => {
      // @ts-expect-error missing searchImplOwnerSymbol property
      if (impl[searchImplOwnerSymbol] === owner) {
        super.remove(impl);
      }
    });
  }

  /**
   * Get the results for a given query string.
   * Available features are added to results layer and map is zoomed to all results (extent of result layer).
   * Adds default clicked handler to result items with feature, which zooms to and highlights said feature. If feature has FeatureInfoView, feature is selected by featureInfo.
   */
  async search(q: string): Promise<Array<ResultItem>> {
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
              const viewpoint = getViewpointFromFeature(item.feature)!;
              viewpoint.pitch =
                this._app.uiConfig.config?.searchViewpointPitch ?? -35;
              item.clicked = (): Promise<void> => {
                this._app.maps.activeMap
                  ?.gotoViewpoint(viewpoint)
                  .catch(() => {});
                return this._app.featureInfo.selectFeature(item.feature!);
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
   */
  async suggest(q: string): Promise<Array<string>> {
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
  abort(): void {
    [...this._array].forEach((impl) => impl.abort?.());
  }

  /**
   * Zooms to the extent of all available result features
   */
  async zoomToAll(): Promise<void> {
    if (this._resultLayer.getFeatures().length > 0) {
      const extent = this._resultLayer.getZoomToExtent()!;
      const viewpoint = Viewpoint.createViewpointFromExtent(extent)!;
      await this._app.maps.activeMap?.gotoViewpoint(viewpoint);
    }
  }

  /**
   * Clears the results and aborts running request
   */
  clearResults(): void {
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
  clearSearch(): void {
    this.clearResults();
    this._query.value = '';
  }

  destroy(): void {
    [...this._array].forEach((impl) => {
      impl.destroy();
    });
    this.resultsChanged.destroy();
    this._destroyResultLayer();
    super.destroy();
  }
}

export default Search;
