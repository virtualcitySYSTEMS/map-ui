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
  maxZIndex,
  CesiumMap,
} from '@vcmap/core';
import Point from 'ol/geom/Point.js';
import Feature from 'ol/Feature.js';
import { Math as CesiumMath, Color, Cartographic } from '@vcmap-cesium/engine';
import { unByKey } from 'ol/Observable.js';
import VectorSource from 'ol/source/Vector.js';
import { Icon } from 'ol/style.js';
import { watch } from 'vue';
import { WindowSlot } from '../manager/window/windowManager.js';
import OverviewMapClickedInteraction from './overviewMapClickedInteraction.js';
import {
  getDefaultPrimaryColor,
  getColorByKey,
} from '../vuePlugins/vuetify.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import VcsMap from '../application/VcsMap.vue';

export const overviewMapWindowId = 'overview-map-container';
export const overviewMapLayerSymbol = Symbol('overviewMapLayerSymbol');

/**
 * @returns {import("../manager/window/windowManager.js").WindowComponentOptions}
 */
export function getWindowComponentOptions() {
  return {
    component: VcsMap,
    props: { mapId: 'overview-map-container' },
    slot: WindowSlot.DETACHED,
    id: overviewMapWindowId,
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
    src: `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Asvg%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22121.58616%22%20height%3D%2274.204994%22%20viewBox%3D%220%200%2032.169671%2019.633405%22%20version%3D%221.1%22%20id%3D%22svg216%22%3E%3Cdefs%20id%3D%22defs213%22%3E%3ClinearGradient%20id%3D%221-0%22%20x1%3D%2240.529999%22%20y1%3D%2248.970001%22%20x2%3D%2240.529999%22%20y2%3D%220.25%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22${encodeURIComponent(
      color,
    )}%22%20id%3D%22stop399%22%2F%3E%3Cstop%20offset%3D%22.46%22%20stop-color%3D%22${encodeURIComponent(
      color,
    )}%22%20stop-opacity%3D%22.60%22%20id%3D%22stop401%22%2F%3E%3Cstop%20offset%3D%22.65%22%20stop-color%3D%22${encodeURIComponent(
      color,
    )}%22%20stop-opacity%3D%22.40%22%20id%3D%22stop403%22%2F%3E%3Cstop%20offset%3D%22.83%22%20stop-color%3D%22${encodeURIComponent(
      color,
    )}%22%20stop-opacity%3D%22.20%22%20id%3D%22stop405%22%2F%3E%3Cstop%20offset%3D%22.89%22%20stop-color%3D%22${encodeURIComponent(
      color,
    )}%22%20stop-opacity%3D%22.15%22%20id%3D%22stop407%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22transparent%22%20stop-opacity%3D%220%22%20id%3D%22stop409%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%222-9%22%20x1%3D%2240.529999%22%20y1%3D%2249.369999%22%20x2%3D%2240.529999%22%20y2%3D%220%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20offset%3D%22.24%22%20stop-color%3D%22${encodeURIComponent(
      color,
    )}%22%20id%3D%22stop412%22%2F%3E%3Cstop%20offset%3D%22.38%22%20stop-color%3D%22${encodeURIComponent(
      color,
    )}%22%20stop-opacity%3D%22.93%22%20id%3D%22stop414%22%2F%3E%3Cstop%20offset%3D%22.57%22%20stop-color%3D%22${encodeURIComponent(
      color,
    )}%22%20stop-opacity%3D%22.70%22%20id%3D%22stop416%22%2F%3E%3Cstop%20offset%3D%22.78%22%20stop-color%3D%22${encodeURIComponent(
      color,
    )}%22%20stop-opacity%3D%22.38%22%20id%3D%22stop418%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22transparent%22%20stop-opacity%3D%220%22%20id%3D%22stop420%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Cg%20id%3D%22layer1%22%20transform%3D%22translate(5.3616118%2C3.2722342)%22%3E%3Cpolygon%20points%3D%220.53%2C0.25%2040.53%2C48.97%2080.53%2C0.25%20%22%20fill%3D%22url(%231)%22%20stroke%3D%22url(%232)%22%20stroke-miterlimit%3D%2210%22%20stroke-width%3D%220.5px%22%20id%3D%22polygon425%22%20style%3D%22fill%3Aurl(%231-0)%3Bstroke%3Aurl(%232-9)%22%20transform%3D%22matrix(0.396875%2C0%2C0%2C0.396875%2C-5.3621201%2C-3.2722342)%22%2F%3E%3Ccircle%20cx%3D%2210.723224%22%20cy%3D%2213.781484%22%20r%3D%222.3812499%22%20fill%3D%22${encodeURIComponent(
      color,
    )}%22%20stroke%3D%22%23ffffff%22%20stroke-miterlimit%3D%2210%22%20id%3D%22circle427%22%20style%3D%22stroke-width%3A0.396874%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E`,
    color,
    anchor: [0.5, 0.87],
  };
}

/**
 * A 2D OverviewMap for cesium, openlayers and oblique map.
 * Baselayers are added to the OverviewMap using `showInOverviewMap` flag within the properties bag of a layer configuration.
 * @class
 */
class OverviewMap {
  /**
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(app) {
    /**
     * @type {import("@src/vcsUiApp.js").default}
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
     * @type {import("@vcmap/core").VectorLayer | null}
     * @private
     */
    this._obliqueTileLayer = null;

    /**
     * @type {import("@vcmap/core").VectorLayer | null}
     * @private
     */
    this._obliqueImageLayer = null;

    /**
     * @type {import("@vcmap/core").VectorLayer | null}
     * @private
     */
    this._obliqueSelectedImageLayer = null;

    const primary =
      app.uiConfig.config.primaryColor ?? getDefaultPrimaryColor(app);
    const fillColor = Color.fromCssColorString('#EDEDED');

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
     * A factor by which to multiply the distance of the viewpoint of the overviewMap.
     * @type {number}
     * @private
     */
    this._scaleFactor = 1;

    /**
     * A factor by witch to multiply the resolution when zooming to a single oblique image.
     * @type {number}
     * @private
     */
    this._obliqueResolutionFactor = 2;

    /**
     * @type {import("@vcmap/core").ObliqueViewDirection | null}
     * @private
     */
    this._obliqueViewDirection = null;

    /**
     * @type {import("@vcmap/core").VectorLayer | null}
     * @private
     */
    this._cameraIconLayer = null;

    /**
     * The style of the camera icon in 2D and 3D
     * @type {import("@vcmap/core").VectorStyleItem}
     */
    this.cameraIconStyle = new VectorStyleItem({
      image: getCameraIcon(getDefaultPrimaryColor(this._app)),
    });

    /**
     * The minimum height to give to the overview map when synchronizing the view in 2D and 3D
     * @type {number}
     */
    this.minimumHeight = 150;

    /**
     * Handles the events from the overview map.
     * @type {EventHandler}
     * @private
     */
    this._eventHandler = new EventHandler();
    const overviewMapClickedInteraction = new OverviewMapClickedInteraction();
    this._eventHandler.addPersistentInteraction(overviewMapClickedInteraction);

    /**
     *
     * @type {import("@vcmap/core").VcsEvent<import("@vcmap/core").InteractionEvent>}
     * @private
     */
    this._mapClicked = overviewMapClickedInteraction.mapClicked;

    /**
     * @type {function():void}
     * @private
     */
    this._mapPointerListener =
      this._map.pointerInteractionEvent.addEventListener((e) => {
        this._eventHandler.handleMapEvent(e);
      });

    /**
     * @type {Array<function():void>}
     * @private
     */
    this._listeners = [];
    /**
     * @type {null | function():void}
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
          const clone = deserializeLayer(this._app, {
            ...layer.toJSON(),
            mapNames: [this._map.name],
          });
          clone.activate();
          const idx = this._map.layerCollection.indexOf(clone);
          if (idx < 0) {
            this._map.layerCollection.add(clone);
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
      this._app.themeChanged.addEventListener(
        this._updatePrimaryColor.bind(this),
      ),
    ];

    this._uiConfigWatcher = watch(
      () => [
        this._app.uiConfig.config.hideMapNavigation,
        this._app.uiConfig.config.overviewMapActiveOnStartup,
        this._app.uiConfig.config.overviewMapScaleFactor,
      ],
      async ([hide, activeOnStartup, scaleFactor]) => {
        if (activeOnStartup && !hide && !this._active) {
          await this.activate();
        } else if (hide && this._active) {
          this.deactivate();
        }
        if (scaleFactor) {
          this._scaleFactor = scaleFactor;
        }
      },
    );
  }

  /**
   * @type {boolean}
   */
  get active() {
    return this._active;
  }

  /**
   * @type {import("@vcmap/core").OpenlayersMap|null}
   */
  get map() {
    return this._map;
  }

  /**
   * @type {EventHandler|null}
   */
  get eventHandler() {
    return this._eventHandler;
  }

  /**
   * An event which is triggered whenever the overview map is clicked.
   * Is passed a {@link InteractionEvent} as its only argument
   * @type {import("@vcmap/core").VcsEvent<import("@vcmap/core").InteractionEvent>}
   */
  get mapClicked() {
    return this._mapClicked;
  }

  /**
   * @private
   */
  _updatePrimaryColor() {
    const color = getColorByKey(this._app, 'primary');
    this.obliqueSelectedStyle?.stroke?.setColor(color);
    this._obliqueSelectedImageLayer?.forceRedraw?.();
    const rotation = this.cameraIconStyle.image.getRotation();
    this.cameraIconStyle.image = new Icon(getCameraIcon(color));
    this.cameraIconStyle.image.setRotation(rotation);
    this._cameraIconLayer
      ?.getFeatureById('cameraFeature')
      ?.setStyle(this.cameraIconStyle.style);
  }

  /**
   * activates the overview map and initializes handlers for current active map
   * @private
   * @returns {Promise<void>}
   */
  async _activate() {
    await this._map.activate();
    this._map.setTarget('overview-map-container');
    this._map.target?.firstChild?.classList?.add('overviewMapElement');
    if (!this._active) {
      this._mapActivatedListener = this._app.maps.mapActivated.addEventListener(
        () => {
          this._clearListeners();
          this._cachedViewpoint = null;
          this._activate();
        },
      );
    }
    this._active = true;
    const { activeMap } = this._app.maps;
    if (activeMap instanceof ObliqueMap) {
      await this._initializeForOblique(activeMap);
    } else if (activeMap) {
      await this._initializePostRenderHandler(activeMap);
    }
  }

  /**
   * opens window and sets target
   * @returns {Promise<void>}
   */
  async activate() {
    if (!this._app.windowManager.has(overviewMapWindowId)) {
      this._app.windowManager.add(getWindowComponentOptions(), vcsAppSymbol);
    }
    await this._activate();
  }

  /**
   * closes window and clears all listeners
   */
  deactivate() {
    this._app.windowManager.remove(overviewMapWindowId);
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
    const prRemover = map.postRender.addEventListener(
      this._syncCameraViewAndFeature.bind(this),
    );
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
          const image = await obliqueMap.collection.loadImageForCoordinate(
            e.positionOrPixel,
            this._obliqueViewDirection,
          );
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
      obliqueMap.imageChanged.addEventListener(
        this._obliqueImageChange.bind(this),
      ),
      obliqueMap.collectionChanged.addEventListener(
        this._obliqueCollectionChanged.bind(this),
      ),
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
      listeners.forEach((l) => {
        l();
      });
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
    if (image) {
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
        vp.distance *= this._scaleFactor;
        this._map.gotoViewpoint(vp);
      }
    }
  }

  /**
   * @private
   */
  _setupObliqueLayers() {
    const almostTransparentStyle = new VectorStyleItem({
      fill: { color: 'rgba(0, 0, 0, 0.000001)' },
    });
    const obliqueTileStyle = new VectorStyleItem({});
    obliqueTileStyle.style = (feature) => {
      if (feature.get('state') === DataState.PENDING) {
        return almostTransparentStyle.style;
      }
      return emptyStyle;
    };

    this._obliqueTileLayer = new VectorLayer({
      projection: mercatorProjection.toJSON(),
      style: obliqueTileStyle,
      zIndex: maxZIndex - 3,
    });
    this._obliqueTileLayer[overviewMapLayerSymbol] = true;

    const obliqueImageStyle = new VectorStyleItem({});
    obliqueImageStyle.style = (feature) => {
      if (feature.get('viewDirection') === this._obliqueViewDirection) {
        return almostTransparentStyle.style;
      }
      return emptyStyle;
    };

    this._obliqueImageLayer = new VectorLayer({
      projection: mercatorProjection.toJSON(),
      style: obliqueImageStyle,
      zIndex: maxZIndex - 2,
    });
    this._obliqueImageLayer[overviewMapLayerSymbol] = true;
    this._obliqueSelectedImageLayer = new VectorLayer({
      projection: mercatorProjection.toJSON(),
      style: this.obliqueSelectedStyle,
      zIndex: maxZIndex - 1,
    });
    this._obliqueSelectedImageLayer[overviewMapLayerSymbol] = true;
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
      const newPosition = Projection.mercatorToWgs84(e.positionOrPixel);
      if (activeMap instanceof CesiumMap) {
        const globe = activeMap.getScene()?.globe;
        const newGroundLevel =
          globe?.getHeight(
            Cartographic.fromDegrees(newPosition[0], newPosition[1]),
          ) || 0;
        const oldGroundLevel =
          globe?.getHeight(
            Cartographic.fromDegrees(
              vp.cameraPosition[0],
              vp.cameraPosition[1],
            ),
          ) || 0;

        newPosition[2] =
          newGroundLevel + Math.abs(vp.cameraPosition[2] - oldGroundLevel);
        vp.cameraPosition = newPosition;
      } else {
        vp.groundPosition = newPosition;
        vp.cameraPosition = null;
      }
      activeMap.gotoViewpoint(vp);
    });
  }

  /**
   * @private
   */
  _setupCameraIconLayer() {
    if (!this._cameraIconLayer) {
      this._cameraIconLayer = new VectorLayer({
        projection: mercatorProjection.toJSON(),
        zIndex: maxZIndex,
      });
      this._cameraIconLayer[overviewMapLayerSymbol] = true;
      this._map.layerCollection.add(this._cameraIconLayer);
    }
  }

  /**
   * Adds and maintains the view and camera feature
   * @private
   */
  _syncCameraViewAndFeature() {
    const viewpoint = this._app.maps.activeMap?.getViewpointSync();
    if (
      !viewpoint ||
      !viewpoint.isValid() ||
      viewpoint.equals(this._cachedViewpoint)
    ) {
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
    const coords = Projection.wgs84ToMercator(position);
    if (!cameraFeature) {
      const cameraGeometry = new Point(coords);
      cameraFeature = new Feature({
        geometry: cameraGeometry,
      });
      cameraFeature.setId('cameraFeature');
      cameraFeature.setStyle(this.cameraIconStyle.style);
      this._cameraIconLayer.addFeatures([cameraFeature]);
    }
    cameraFeature.getGeometry().setCoordinates(coords);

    const rotationDegrees = viewpoint.heading;
    const rotationRadians = CesiumMath.toRadians(rotationDegrees);

    this.cameraIconStyle.image.setRotation(rotationRadians);

    viewpoint.heading = 0;
    if (viewpoint.cameraPosition) {
      viewpoint.cameraPosition = position;
      viewpoint.groundPosition = null;
      viewpoint.distance = distance * 4;
    }
    viewpoint.distance *= this._scaleFactor;
    this._map.gotoViewpoint(viewpoint);
  }

  /**
   * @private
   */
  _clearListeners() {
    this._listeners.forEach((cb) => cb());
    this._listeners.splice(0);
  }

  destroy() {
    this._clearListeners();
    this._collectionListeners.forEach((cb) => cb());
    this._collectionListeners = [];
    this._uiConfigWatcher();
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
    this.obliqueSelectedStyle.destroy();
    this._cachedViewpoint = null;
  }
}

export default OverviewMap;
