import {
  OpenlayersMap,
  ObliqueMap,
  VectorLayer,
  VectorStyleItem,
  Projection,
  mercatorProjection,
  EventHandler,
  DataState,
  emptyStyle,
  Extent,
  Viewpoint,
  deserializeLayer,
} from '@vcmap/core';
import Point from 'ol/geom/Point.js';
import Feature from 'ol/Feature.js';
import { Math as CesiumMath, Color } from '@vcmap-cesium/engine';
import { unByKey } from 'ol/Observable.js';
import VectorSource from 'ol/source/Vector.js';
import { Icon } from 'ol/style.js';
import { WindowSlot } from '../manager/window/windowManager.js';
import OverviewMapClickedInteraction from './overviewMapClickedInteraction.js';
import { getDefaultPrimaryColor, getColorByKey } from '../vuePlugins/vuetify.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import VcsMap from '../application/VcsMap.vue';

/**
 * @returns {WindowComponentOptions}
 */
export function getWindowComponentOptions() {
  return {
    component: VcsMap,
    props: { mapId: 'overview-map-container' },
    slot: WindowSlot.DETACHED,
    id: 'overview-map-container',
    state: {
      hideHeader: true,
      classes: ['overview-map'],
    },
    position: {
      right: '100px',
      bottom: '25px',
      width: '300px',
      height: '240px',
    },
  };
}

/**
 * @param {string} color
 * @returns {import("ol/style/Icon").Options}
 */
function getCameraIcon(color) {
  return {
    src: `data:image/svg+xml,%3C?xml version='1.0' encoding='UTF-8'?%3E%3Csvg id='cam' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 81.06 49.47'%3E%3Cdefs%3E%3ClinearGradient id='1' x1='40.53' y1='48.97' x2='40.53' y2='.25' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='${encodeURIComponent(color)}'/%3E%3Cstop offset='.46' stop-color='${encodeURIComponent(color)}' stop-opacity='.60'/%3E%3Cstop offset='.65' stop-color='${encodeURIComponent(color)}' stop-opacity='.40'/%3E%3Cstop offset='.83' stop-color='${encodeURIComponent(color)}' stop-opacity='.20'/%3E%3Cstop offset='.89' stop-color='${encodeURIComponent(color)}' stop-opacity='.15'/%3E%3Cstop offset='1' stop-color='transparent' stop-opacity='0'/%3E%3C/linearGradient%3E%3ClinearGradient id='2' x1='40.53' y1='49.37' x2='40.53' y2='0' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.24' stop-color='${encodeURIComponent(color)}'/%3E%3Cstop offset='.38' stop-color='${encodeURIComponent(color)}' stop-opacity='.93'/%3E%3Cstop offset='.57' stop-color='${encodeURIComponent(color)}' stop-opacity='.70'/%3E%3Cstop offset='.78' stop-color='${encodeURIComponent(color)}' stop-opacity='.38'/%3E%3Cstop offset='1' stop-color='transparent' stop-opacity='0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpolygon points='40.53 48.97 80.53 .25 .53 .25 40.53 48.97' fill='url(%231)' stroke='url(%232)' stroke-miterlimit='10' stroke-width='.5px'/%3E%3Ccircle cx='40.53' cy='42.97' r='6' fill='${encodeURIComponent(color)}' stroke='%23fff' stroke-miterlimit='10'/%3E%3C/svg%3E`,
    scale: 0.5,
    color,
  };
}

/**
 * A 2D OverviewMap for cesium, openlayers and oblique map.
 * Baselayers are added to the OverviewMap using `showInOverviewMap` flag within the properties bag of a layer configuration.
 * @class
 */
class OverviewMap {
  /**
   * @param {VcsUiApp} app
   */
  constructor(app) {
    /**
     * @type {VcsUiApp}
     * @private
     */
    this._app = app;

    /**
     * @type {boolean}
     * @private
     */
    this._active = false;

    /**
     * @type {import("@vcmap/core").OpenlayersMap||null}
     * @private
     */
    this._map = new OpenlayersMap({
      target: 'overview-map-container',
    });

    /**
     * @private
     * @type {import("@vcmap/core").Viewpoint|null}
     */
    this._cachedViewpoint = null;

    /**
     * @type {import("@vcmap/core").VectorLayer}
     * @private
     */
    this._obliqueTileLayer = null;

    /**
     * @type {import("@vcmap/core").VectorLayer}
     * @private
     */
    this._obliqueImageLayer = null;

    /**
     * @type {import("@vcmap/core").VectorLayer}
     * @private
     */
    this._obliqueSelectedImageLayer = null;

    const primary = app.uiConfig.config.value.primaryColor ?? getDefaultPrimaryColor();
    const fillColor = Color.fromCssColorString('#EDEDED');

    /**
     * @type {VectorStyleItem}
     */
    this.obliqueUnselectedStyle = new VectorStyleItem({
      fill: {
        color: fillColor.withAlpha(0.1).toCssColorString(),
      },
      stroke: {
        color: primary,
        width: 1,
      },
    });

    /**
     * @type {VectorStyleItem}
     */
    this.obliqueSelectedStyle = new VectorStyleItem({
      fill: {
        color: fillColor.withAlpha(0.8).toCssColorString(),
      },
      stroke: {
        color: primary,
        width: 3,
      },
    });

    /**
     * A factor by witch to multiply the resolution when zooming to a single oblique image.
     * @type {number}
     * @private
     */
    this._obliqueResolutionFactor = 2;

    /**
     * @type {import("@vcmap/core").ObliqueViewDirection}
     * @private
     */
    this._obliqueViewDirection = null;

    /**
     * @type {import("@vcmap/core").VectorLayer}
     * @private
     */
    this._cameraIconLayer = null;

    /**
     * The style of the camera icon in 2D and 3D
     * @type {import("@vcmap/core").VectorStyleItem}
     */
    this.cameraIconStyle = new VectorStyleItem({
      image: getCameraIcon(getDefaultPrimaryColor()),
    });

    /**
     * The minimum height to give to the overview map when synchronizing the view in 2D and 3D
     * @type {number}
     */
    this.minimumHeight = 150;

    /**
     * Handles the events from the overview map. Available after first activation.
     * @type {EventHandler|null}
     * @private
     */
    this._eventHandler = null;

    /**
     * An event, available after first activation, which is triggered whenever the overview map is clicked.
     * Is passed a {@link InteractionEvent} as its only argument
     * @type {import("@vcmap/core").VcsEvent<import("@vcmap/core").InteractionEvent>|null}
     * @private
     */
    this._mapClicked = null;

    /**
     * @type {Function}
     */
    this._mapPointerListener = null;

    /**
     * @type {Array<function():void>}
     * @private
     */
    this._listeners = [];
    /**
     * @type {function():void}
     * @private
     */
    this._mapActivatedListener = null;

    /**
     * @type {Array<function():void>}
     * @private
     */
    this._collectionListeners = [
      this._app.maps.layerCollection.added.addEventListener((layer) => {
        if (layer.properties.showInOverviewMap) {
          const clone = deserializeLayer(this._app, layer.toJSON());
          clone.activate();
          const idx = this._map.layerCollection.indexOf(clone);
          if (idx < 0) {
            this._map.layerCollection.add(clone, 0);
          } else {
            this._map.layerCollection.remove(clone);
            this._map.layerCollection.add(clone, idx);
          }
        }
      }),
      this._app.maps.layerCollection.removed.addEventListener((layer) => {
        if (this._map.layerCollection.hasKey(layer.name)) {
          const clone = this._map.layerCollection.getByKey(layer.name);
          this._map.layerCollection.remove(clone);
        }
      }),
      this._app.themeChanged.addEventListener(this._updatePrimaryColor.bind(this)),
    ];
  }

  /**
   * @type {boolean}
   * @readonly
   */
  get active() {
    return this._active;
  }

  /**
   * @type {import("@vcmap/core").OpenlayersMap|null}
   * @readonly
   */
  get map() {
    return this._map;
  }

  /**
   * @type {EventHandler|null}
   * @readonly
   */
  get eventHandler() {
    return this._eventHandler;
  }

  /**
   * @type {import("@vcmap/core").VcsEvent<import("@vcmap/core").InteractionEvent>|null}
   * @readonly
   */
  get mapClicked() {
    return this._mapClicked;
  }

  /**
   * @private
   */
  _updatePrimaryColor() {
    const color = getColorByKey('primary');
    this.obliqueUnselectedStyle?.stroke?.setColor(color);
    this.obliqueSelectedStyle?.stroke?.setColor(color);
    this._obliqueTileLayer?.forceRedraw?.();
    this._obliqueImageLayer?.forceRedraw?.();
    this._obliqueSelectedImageLayer?.forceRedraw?.();
    const rotation = this.cameraIconStyle.image.getRotation();
    this.cameraIconStyle.image = new Icon(getCameraIcon(color));
    this.cameraIconStyle.image.setRotation(rotation);
    this._cameraIconLayer?.getFeatureById('cameraFeature')?.setStyle(this.cameraIconStyle.style);
  }

  /**
   * @private
   */
  _setupMapInteraction() {
    this._eventHandler = new EventHandler();
    const overviewMapClickedInteraction = new OverviewMapClickedInteraction();
    this._mapClicked = overviewMapClickedInteraction.mapClicked;
    this._eventHandler.addPersistentInteraction(overviewMapClickedInteraction);
    this._mapPointerListener = this._map.pointerInteractionEvent.addEventListener((e) => {
      this._eventHandler.handleMapEvent(e);
    });
  }

  /**
   * activates the overview map and initializes handlers for current active map
   * @private
   * @returns {Promise<void>}
   */
  async _activate() {
    if (!this._mapClicked) {
      this._setupMapInteraction();
    }
    await this._map.activate();
    this.map.setTarget('overview-map-container');
    this._map.target?.firstChild?.classList?.add('overviewMapElement');
    if (!this._active) {
      this._mapActivatedListener = this._app.maps.mapActivated.addEventListener(() => {
        this._clearListeners();
        this._cachedViewpoint = null;
        this._activate();
      });
    }
    this._active = true;
    const { activeMap } = this._app.maps;
    if (activeMap instanceof ObliqueMap) {
      await this._initializeForOblique(activeMap);
    } else {
      await this._initializePostRenderHandler(activeMap);
    }
  }

  /**
   * opens window and sets target
   * @returns {Promise<void>}
   */
  async activate() {
    if (!this._app.windowManager.has('overview-map-container')) {
      this._app.windowManager.add(getWindowComponentOptions(), vcsAppSymbol);
    }
    await this._activate();
  }

  /**
   * closes window and clears all listeners
   */
  deactivate() {
    this._app.windowManager.remove('overview-map-container');
    this._clearListeners();
    if (this._mapActivatedListener) {
      this._mapActivatedListener();
      this._mapActivatedListener = null;
    }
    this._active = false;
  }

  /**
   * @param {import("@vcmap/core").VcsMap} map
   * @returns {Promise<void>}
   * @private
   */
  async _initializePostRenderHandler(map) {
    if (!this._cameraIconLayer) {
      this._setupCameraIconLayer();
      this._syncCameraViewAndFeature();
    }
    const navRemover = this._addNavigationListener(map);
    const prRemover = map.postRender.addEventListener(this._syncCameraViewAndFeature.bind(this));
    const cleanupTasks = () => {
      prRemover();
      navRemover();
      this._cameraIconLayer.deactivate();
    };
    this._listeners.push(cleanupTasks);
    await this._cameraIconLayer.activate();
  }

  /**
   * @param {import("@vcmap/core").ObliqueMap} obliqueMap
   * @returns {Promise<void>}
   * @private
   */
  async _initializeForOblique(obliqueMap) {
    if (!this._obliqueTileLayer) {
      this._setupObliqueLayers();
    }
    const mapClickedListener = this._mapClicked.addEventListener(async (e) => {
      if (e.feature) {
        const id = e.feature.getId().toString();
        if (this._obliqueTileLayer.getFeatureById(id)) {
          const image = await obliqueMap.collection
            .loadImageForCoordinate(e.positionOrPixel, this._obliqueViewDirection);
          if (image) {
            await obliqueMap.setImageByName(image.name);
          }
        } else {
          await obliqueMap.setImageByName(id);
        }
      }
    });

    const listeners = [
      mapClickedListener,
      obliqueMap.imageChanged.addEventListener(this._obliqueImageChange.bind(this)),
      obliqueMap.collectionChanged.addEventListener(this._obliqueCollectionChanged.bind(this)),
    ];

    const prUnKey = this._map.olMap.once('postrender', () => {
      this._obliqueCollectionChanged(obliqueMap.collection);
      this._obliqueImageChange(obliqueMap.currentImage);
    });

    const cleanupTasks = () => {
      this._obliqueTileLayer.deactivate();
      this._obliqueImageLayer.deactivate();
      this._obliqueSelectedImageLayer.deactivate();
      unByKey(prUnKey);
      listeners.forEach((l) => { l(); });
    };
    this._listeners.push(cleanupTasks);
    await this._obliqueTileLayer.activate();
    await this._obliqueImageLayer.activate();
    await this._obliqueSelectedImageLayer.activate();
  }

  /**
   * @param {import("@vcmap/core").ObliqueCollection} collection
   * @private
   */
  _obliqueCollectionChanged(collection) {
    this._obliqueTileLayer.source = collection.tileFeatureSource;
    this._obliqueTileLayer.forceRedraw();
    this._obliqueImageLayer.source = collection.imageFeatureSource;
    this._obliqueImageLayer.forceRedraw();
    this._obliqueSelectedImageLayer.removeAllFeatures();
  }

  /**
   * @param {import("@vcmap/core").ObliqueImage=} image
   * @private
   */
  _obliqueImageChange(image) {
    const { source } = this._obliqueImageLayer;
    if (this._obliqueViewDirection !== image.viewDirection) {
      this._obliqueViewDirection = image.viewDirection;
      source.changed();
    }
    const activeFeature = source.getFeatureById(image.name);
    if (activeFeature) {
      this._obliqueSelectedImageLayer.removeAllFeatures();
      this._obliqueSelectedImageLayer.addFeatures([activeFeature]);
      const extent = new Extent({
        coordinates: activeFeature.getGeometry().getExtent(),
        projection: mercatorProjection.toJSON(),
      });

      const vp = Viewpoint.createViewpointFromExtent(extent);
      vp.distance /= this._obliqueResolutionFactor;
      this._map.gotoViewpoint(vp);
    }
  }

  /**
   * @private
   */
  _setupObliqueLayers() {
    const obliqueTileStyle = new VectorStyleItem({});
    obliqueTileStyle.style = (feature) => {
      if (feature.get('state') === DataState.PENDING) {
        return /** @type {ol/style/Style} */ (this.obliqueUnselectedStyle.style);
      }
      return emptyStyle;
    };

    this._obliqueTileLayer = new VectorLayer({
      projection: mercatorProjection.toJSON(),
      style: obliqueTileStyle,
      zIndex: 1,
    });

    const obliqueImageStyle = new VectorStyleItem({});
    obliqueImageStyle.style = (feature) => {
      if (feature.get('viewDirection') === this._obliqueViewDirection) {
        return this.obliqueUnselectedStyle.style;
      }
      return emptyStyle;
    };

    this._obliqueImageLayer = new VectorLayer({
      projection: mercatorProjection.toJSON(),
      style: obliqueImageStyle,
    });
    this._obliqueSelectedImageLayer = new VectorLayer({
      projection: mercatorProjection.toJSON(),
      style: this.obliqueSelectedStyle,
    });
    this._map.layerCollection.add(this._obliqueImageLayer);
    this._map.layerCollection.add(this._obliqueSelectedImageLayer);
    this._map.layerCollection.add(this._obliqueTileLayer);
  }

  /**
   * @param {import("@vcmap/core").VcsMap} activeMap
   * @returns {Function}
   * @private
   */
  _addNavigationListener(activeMap) {
    return this._mapClicked.addEventListener((e) => {
      const vp = activeMap.getViewpointSync();
      const height = vp.groundPosition[2] ? vp.groundPosition[2] : 0.0;
      vp.groundPosition = Projection.mercatorToWgs84(e.positionOrPixel);
      vp.groundPosition[2] = height;
      vp.cameraPosition = null;
      activeMap.gotoViewpoint(vp);
    });
  }

  _setupCameraIconLayer() {
    if (!this._cameraIconLayer) {
      this._cameraIconLayer = new VectorLayer({
        projection: mercatorProjection.toJSON(),
        zIndex: 50,
      });
      this._map.layerCollection.add(this._cameraIconLayer);
    }
  }

  /**
   * Adds and maintains the view and camera feature
   * @private
   */
  _syncCameraViewAndFeature() {
    const viewpoint = this._app.maps.activeMap?.getViewpointSync();
    if (!viewpoint || !viewpoint.isValid() || viewpoint.equals(this._cachedViewpoint)) {
      return;
    }
    this._cachedViewpoint = viewpoint.clone();
    const gp = viewpoint.groundPosition;
    const position = viewpoint.cameraPosition || gp;
    const { heading } = viewpoint;
    let { distance } = viewpoint;
    if (position[2] && !(distance && distance < position[2] * 4)) {
      distance = position[2] * 4;
    }

    distance = distance > this.minimumHeight ? distance : this.minimumHeight;
    if (heading == null || distance == null) {
      return;
    }
    let cameraFeature = this._cameraIconLayer.getFeatureById('cameraFeature');
    if (!cameraFeature) {
      const cameraGeometry = new Point([position[0], position[1]]);
      cameraFeature = new Feature({
        geometry: cameraGeometry,
      });
      cameraFeature.setId('cameraFeature');
      cameraFeature.setStyle(this.cameraIconStyle.style);
      this._cameraIconLayer.addFeatures([cameraFeature]);
    }
    cameraFeature.getGeometry().setCoordinates(Projection.wgs84ToMercator(position));

    const rotationDegrees = viewpoint.heading;
    const rotationRadians = CesiumMath.toRadians(rotationDegrees);

    this.cameraIconStyle.image.setRotation(rotationRadians);

    viewpoint.heading = 0;
    if (viewpoint.cameraPosition) {
      viewpoint.cameraPosition = position;
      viewpoint.groundPosition = null;
      viewpoint.distance = distance * 4;
    }
    this._map.gotoViewpoint(viewpoint);
  }

  /**
   * @private
   */
  _clearListeners() {
    this._listeners.forEach(cb => cb());
    this._listeners.splice(0);
  }

  destroy() {
    this._clearListeners();
    this._collectionListeners.forEach(cb => cb());
    this._collectionListeners = [];
    if (this._mapPointerListener) {
      this._mapPointerListener();
      this._mapPointerListener = null;
    }
    if (this._mapActivatedListener) {
      this._mapActivatedListener();
      this._mapActivatedListener = null;
    }
    if (this._map) {
      this._map.destroy();
    }
    if (this._obliqueTileLayer) {
      this._obliqueTileLayer.source = new VectorSource({});
      this._obliqueTileLayer.destroy();
    }
    if (this._obliqueImageLayer) {
      this._obliqueImageLayer.source = new VectorSource({});
      this._obliqueImageLayer.destroy();
    }
    if (this._obliqueSelectedImageLayer) {
      this._obliqueSelectedImageLayer.source = new VectorSource({});
      this._obliqueSelectedImageLayer.destroy();
    }
    if (this._cameraIconLayer) {
      this._cameraIconLayer.destroy();
    }
    if (this._eventHandler) {
      this._eventHandler.destroy();
    }
    this.cameraIconStyle.destroy();
    this.obliqueUnselectedStyle.destroy();
    this.obliqueSelectedStyle.destroy();
    this._cachedViewpoint = null;
    this._mapClicked = null;
  }
}

export default OverviewMap;
