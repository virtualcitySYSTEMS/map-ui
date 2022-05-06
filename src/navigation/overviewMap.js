import {
  OpenlayersMap,
  CesiumMap,
  ObliqueMap,
  VectorLayer,
  VectorStyleItem,
  Projection,
  mercatorProjection,
  EventHandler,
  DataState,
  emptyStyle,
  Extent,
  ViewPoint,
  deserializeLayer,
} from '@vcmap/core';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import { Math as CesiumMath, Color } from '@vcmap/cesium';
import { unByKey } from 'ol/Observable.js';
import VectorSource from 'ol/source/Vector.js';
import { WindowSlot } from '../manager/window/windowManager.js';
import OverviewMapClickedInteraction from './overviewMapClickedInteraction.js';
import { vuetify } from '../vuePlugins/vuetify.js';
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
    },
    position: {
      right: '100px',
      bottom: '25px',
      width: '272px',
      height: '223px',
    },
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
     * @type {import("@vcmap/core").ViewPoint|null}
     */
    this._cachedViewPoint = null;

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

    const { primary, accent } = vuetify.userPreset.theme.themes.light;
    const fillColor = Color.fromCssColorString(accent);

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
      image: {
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAA8CAYAAADxJz2MAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4RpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTExIDc5LjE1ODMyNSwgMjAxNS8wOS8xMC0wMToxMDoyMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDphMzhlODgyYy00ZGYzLTZkNGMtYWZhYy1hYTkwOTI3MjRiYjEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEYxRkE1MDlENjRDMTFFNTlGRjhFMzM3RTA3MDJFMDciIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEYxRkE1MDhENjRDMTFFNTlGRjhFMzM3RTA3MDJFMDciIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OGJiODg5ODItZGM0Zi0xNjQyLWEyZDYtODJkZTcxMGNhNjkwIiBzdFJlZjpkb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6YzY5MTdhNjAtZDYzYy0xMWU1LThjNTgt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',
        anchor: [0.5, 1],
      },
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
    this._layerCollectionListener = [
      this._app.maps.layerCollection.added.addEventListener((layer) => {
        if (layer.properties.showInOverviewMap) {
          const clone = deserializeLayer(this._app, layer.toJSON());
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
    if (!this._active) {
      this._mapActivatedListener = this._app.maps.mapActivated.addEventListener(() => {
        this._clearListeners();
        this._cachedViewPoint = null;
        this._activate();
      });
    }
    this._active = true;
    const { activeMap } = this._app.maps;
    if (activeMap instanceof CesiumMap) {
      await this._initializeForCesium(activeMap);
    } else if (activeMap instanceof OpenlayersMap) {
      await this._initializeForOpenlayers(activeMap);
    } else if (activeMap instanceof ObliqueMap) {
      await this._initializeForOblique(activeMap);
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
    this.map.setTarget('overview-map-container');
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
   * @param {import("@vcmap/core").CesiumMap} cesiumMap
   * @returns {Promise<void>}
   * @private
   */
  async _initializeForCesium(cesiumMap) {
    if (!this._cameraIconLayer) {
      this._setupCameraIconLayer();
    }
    if (cesiumMap.initialized) {
      const cesiumViewer = cesiumMap.getCesiumWidget();
      const cesiumScene = cesiumViewer.scene;
      const navRemover = this._addNavigationListener(cesiumMap);
      const prRemover = cesiumScene.postRender.addEventListener(this._addCameraFeature, this);
      const cleanupTasks = () => {
        prRemover();
        navRemover();
        this._cameraIconLayer.deactivate();
      };
      this._listeners.push(cleanupTasks);
      await this._cameraIconLayer.activate();
    }
  }

  /**
   * @param {import("@vcmap/core").OpenlayersMap} map
   * @returns {Promise<void>}
   * @private
   */
  async _initializeForOpenlayers(map) {
    if (!this._cameraIconLayer) {
      this._setupCameraIconLayer();
    }
    const { olMap } = map;
    const navListener = this._addNavigationListener(map);
    const prUnKey = olMap.on('postrender', this._addCameraFeature.bind(this));

    const cleanupTasks = () => {
      unByKey(prUnKey);
      navListener();
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

      const vp = ViewPoint.createViewPointFromExtent(extent);
      vp.distance /= this._obliqueResolutionFactor;
      this._map.gotoViewPoint(vp);
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
      const vp = activeMap.getViewPointSync();
      const height = vp.groundPosition[2] ? vp.groundPosition[2] : 0.0;
      vp.groundPosition = Projection.mercatorToWgs84(e.positionOrPixel);
      vp.groundPosition[2] = height;
      vp.cameraPosition = null;
      activeMap.gotoViewPoint(vp);
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
  _addCameraFeature() {
    const viewpoint = this._app.maps.activeMap.getViewPointSync();
    if (!viewpoint || !viewpoint.isValid() || viewpoint.equals(this._cachedViewPoint)) {
      return;
    }
    this._cachedViewPoint = viewpoint.clone();
    const gp = viewpoint.groundPosition;
    const position = viewpoint.cameraPosition || gp;
    const { heading } = viewpoint;
    let { distance } = viewpoint;
    if (position[2] && !(distance && distance < position[2] * 4)) {
      distance = position[2] * 4;
    } else if (position[2] == null) {
      position[2] = distance;
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
    viewpoint.cameraPosition = position;
    viewpoint.groundPosition = null;
    viewpoint.distance = distance * 4;

    this._map.gotoViewPoint(viewpoint);
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
    this._layerCollectionListener.forEach(cb => cb());
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
    this._cachedViewPoint = null;
    this._mapClicked = null;
  }
}

export default OverviewMap;
