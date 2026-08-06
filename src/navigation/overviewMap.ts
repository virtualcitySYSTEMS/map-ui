import type {
  ObliqueViewDirection,
  InteractionEvent,
  VcsEvent,
  VcsMap,
  ObliqueCollection,
  ObliqueImage,
} from '@vcmap/core';
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
  CesiumMap,
  PanoramaMap,
  PanoramaImageSelection,
  maxZIndexMin50,
} from '@vcmap/core';
import Point from 'ol/geom/Point.js';
import Feature from 'ol/Feature.js';
import { Math as CesiumMath, Color, Cartographic } from '@vcmap-cesium/engine';
import { unByKey } from 'ol/Observable.js';
import VectorSource from 'ol/source/Vector.js';
import type { Style } from 'ol/style.js';
import { Icon } from 'ol/style.js';
import type { Options as IconOptions } from 'ol/style/Icon.js';
import { computed, nextTick, ref, watch } from 'vue';
import type VcsUiApp from '../vcsUiApp.js';
import OverviewMapClickedInteraction from './overviewMapClickedInteraction.js';
import {
  getDefaultPrimaryColor,
  getColorByKey,
} from '../vuePlugins/vuetify.js';

export const overviewMapContainerId = 'overview-map-container';
export const overviewMapLayerSymbol = Symbol('overviewMapLayerSymbol');

function getCameraIcon(color: string): IconOptions {
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
 * panorama behavior
 * 1. in panorama, only allow clicking on a footprint
 * 2. in other maps, if you click directly on a panorama footprint, switch maps and go to image (same as clicking on the footprint in the main map)
 */

/**
 * A 2D OverviewMap for cesium, openlayers and oblique map.
 * Baselayers are added to the OverviewMap using `showInOverviewMap` flag within the properties bag of a layer configuration.
 * @class
 */
class OverviewMap {
  private _app: VcsUiApp;
  private _active = ref(false);
  private _map = new OpenlayersMap({ target: overviewMapContainerId });
  private _cachedViewpoint: Viewpoint | null = null;
  private _obliqueTileLayer: VectorLayer | null = null;
  private _obliqueImageLayer: VectorLayer | null = null;
  private _obliqueSelectedImageLayer: VectorLayer | null = null;
  obliqueSelectedStyle: VectorStyleItem;

  /**
   * A factor by which to multiply the distance of the viewpoint of the overviewMap.
   */
  private _scaleFactor = 1;

  /**
   * A factor by witch to multiply the resolution when zooming to a single oblique image.
   */
  private _obliqueResolutionFactor = 2;

  private _obliqueViewDirection: ObliqueViewDirection | null = null;

  private _cameraIconLayer: VectorLayer | null = null;

  /**
   * The style of the camera icon in 2D and 3D
   */
  cameraIconStyle: VectorStyleItem;
  /**
   * The minimum height to give to the overview map when synchronizing the view in 2D and 3D
   */
  private _minimumHeight = 150;

  /**
   * Handles image selection on panorama features
   */
  private _panoramaImageSelection: PanoramaImageSelection;

  /**
   * Handles the events from the overview map.
   */
  private _eventHandler: EventHandler;
  private _mapClicked: VcsEvent<InteractionEvent>;
  private _mapPointerListener: (() => void) | null = null;

  private _listeners: Array<() => void> = [];
  private _mapActivatedListener: (() => void) | null = null;
  private _collectionListeners: Array<() => void> = [];
  private _uiConfigWatchers: Array<() => void> = [];

  currentState = computed(() => this._active.value);

  constructor(app: VcsUiApp) {
    this._app = app;

    const primary =
      app.uiConfig.config.primaryColor ?? getDefaultPrimaryColor(app);
    const fillColor = Color.fromCssColorString('#EDEDED');

    this.obliqueSelectedStyle = new VectorStyleItem({
      fill: { color: fillColor.withAlpha(0.8).toCssColorString() },
      stroke: { color: primary, width: 3 },
    });

    this.cameraIconStyle = new VectorStyleItem({
      image: getCameraIcon(getDefaultPrimaryColor(this._app)),
    });

    const overviewMapClickedInteraction = new OverviewMapClickedInteraction();

    this._panoramaImageSelection = new PanoramaImageSelection(this._app.maps);

    this._eventHandler = new EventHandler();
    this._eventHandler.addPersistentInteraction(overviewMapClickedInteraction);
    this._eventHandler.addPersistentInteraction(this._panoramaImageSelection);

    this._mapClicked = overviewMapClickedInteraction.mapClicked;

    this._mapPointerListener =
      this._map.pointerInteractionEvent.addEventListener((e) => {
        this._eventHandler.handleMapEvent(e);
      });

    this._collectionListeners = [
      this._app.maps.layerCollection.added.addEventListener((layer) => {
        if (layer.properties.showInOverviewMap) {
          const clone = deserializeLayer(this._app, {
            ...layer.toJSON(),
            mapNames: [this._map.name],
          });
          if (clone) {
            clone.activate().catch(() => {});
            const idx = this._map.layerCollection.indexOf(clone);
            if (idx < 0) {
              this._map.layerCollection.add(clone);
            } else {
              this._map.layerCollection.remove(clone);
              this._map.layerCollection.add(clone, idx);
            }
          }
        } else if (layer.className === 'PanoramaDatasetLayer') {
          this._map.layerCollection.add(layer);
        }
      }),
      this._app.maps.layerCollection.removed.addEventListener((layer) => {
        if (this._map.layerCollection.hasKey(layer.name)) {
          const clone = this._map.layerCollection.getByKey(layer.name);
          if (clone) {
            this._map.layerCollection.remove(clone);
          }
        }
      }),
      this._app.themeChanged.addEventListener(
        this._updatePrimaryColor.bind(this),
      ),
    ];

    this._uiConfigWatchers = [
      watch(
        () => this._app.uiConfig.config.hideMapNavigation,
        (hide) => {
          if (hide && this._active.value) {
            this.deactivate();
          }
        },
      ),
      watch(
        () => this._app.uiConfig.config.overviewMapActiveOnStartup,
        async (activeOnStartup) => {
          if (
            activeOnStartup &&
            !this._active.value &&
            !this._app.uiConfig.config.hideMapNavigation
          ) {
            await this.activate();
          } else if (!activeOnStartup && this._active.value) {
            this.deactivate();
          }
        },
      ),
      watch(
        () => this._app.uiConfig.config.overviewMapScaleFactor,
        (scaleFactor) => {
          if (scaleFactor) {
            this._scaleFactor = scaleFactor;
          }
        },
      ),
    ];
  }

  get active(): boolean {
    return this._active.value;
  }

  get map(): OpenlayersMap {
    return this._map;
  }

  get eventHandler(): EventHandler {
    return this._eventHandler;
  }

  get panoramaImageSelection(): PanoramaImageSelection {
    return this._panoramaImageSelection;
  }

  /**
   * An event which is triggered whenever the overview map is clicked.
   * Is passed a {@link InteractionEvent} as its only argument
   */
  get mapClicked(): VcsEvent<InteractionEvent> {
    return this._mapClicked;
  }

  private _updatePrimaryColor(): void {
    const color = getColorByKey(this._app, 'primary');
    this.obliqueSelectedStyle?.stroke?.setColor(color);
    this._obliqueSelectedImageLayer?.forceRedraw?.().catch(() => {});
    const rotation = this.cameraIconStyle.image!.getRotation();
    this.cameraIconStyle.image = new Icon(getCameraIcon(color));
    this.cameraIconStyle.image.setRotation(rotation);
    this._cameraIconLayer
      ?.getFeatureById('cameraFeature')
      ?.setStyle(this.cameraIconStyle.style);
  }

  /**
   * activates the overview map and initializes handlers for current active map
   */
  private async _activate(): Promise<void> {
    await this._map.activate();
    this._map.setTarget(overviewMapContainerId);
    if (this._map.target?.firstChild instanceof Element) {
      this._map.target.firstChild.classList.add('overviewMapElement');
    }
    if (!this._active.value) {
      this._mapActivatedListener = this._app.maps.mapActivated.addEventListener(
        () => {
          this._clearListeners();
          this._cachedViewpoint = null;
          this._activate().catch(() => {});
        },
      );
    }
    this._active.value = true;
    await nextTick();
    const { activeMap } = this._app.maps;
    if (activeMap instanceof ObliqueMap) {
      await this._initializeForOblique(activeMap);
    } else if (activeMap) {
      await this._initializePostRenderHandler(activeMap);
    }
  }

  /**
   * opens window and sets target
   */
  async activate(): Promise<void> {
    await this._activate();
  }

  /**
   * clears all listeners
   */
  deactivate(): void {
    this.map.deactivate();
    this._clearListeners();
    if (this._mapActivatedListener) {
      this._mapActivatedListener();
      this._mapActivatedListener = null;
    }
    this._active.value = false;
  }

  private async _initializePostRenderHandler(map: VcsMap): Promise<void> {
    if (!this._cameraIconLayer) {
      this._setupCameraIconLayer();
    }
    this._syncCameraViewAndFeature();
    const navRemover = this._addNavigationListener(map);
    const prRemover = map.postRender.addEventListener(
      this._syncCameraViewAndFeature.bind(this),
    );
    const cleanupTasks = (): void => {
      prRemover();
      navRemover();
      this._cameraIconLayer?.deactivate();
    };
    this._listeners.push(cleanupTasks);
    await this._cameraIconLayer?.activate();
  }

  private async _initializeForOblique(obliqueMap: ObliqueMap): Promise<void> {
    if (!this._obliqueTileLayer) {
      this._setupObliqueLayers();
    }
    const mapClickedListener = this._mapClicked.addEventListener(async (e) => {
      if (e.feature) {
        const id = e.feature.getId()?.toString();
        if (id && this._obliqueTileLayer?.getFeatureById(id)) {
          const image = await obliqueMap.collection?.loadImageForCoordinate(
            e.positionOrPixel!,
            this._obliqueViewDirection!,
          );
          if (image) {
            await obliqueMap.setImageByName(image.name);
          }
        } else if (id) {
          await obliqueMap.setImageByName(id);
        }
      }
    });

    const listeners = [
      mapClickedListener,
      obliqueMap.imageChanged?.addEventListener(
        this._obliqueImageChange.bind(this),
      ),
      obliqueMap.collectionChanged.addEventListener(
        this._obliqueCollectionChanged.bind(this),
      ),
    ];

    const prUnKey = this._map.olMap?.once('postrender', (): void => {
      this._obliqueCollectionChanged(obliqueMap.collection!);
      this._obliqueImageChange(obliqueMap.currentImage!);
    });

    const cleanupTasks = (): void => {
      this._obliqueTileLayer?.deactivate();
      this._obliqueImageLayer?.deactivate();
      this._obliqueSelectedImageLayer?.deactivate();
      if (prUnKey) {
        unByKey(prUnKey);
      }
      listeners
        .filter((l) => !!l)
        .forEach((l) => {
          l();
        });
    };
    this._listeners.push(cleanupTasks);
    await this._obliqueTileLayer?.activate();
    await this._obliqueImageLayer?.activate();
    await this._obliqueSelectedImageLayer?.activate();
  }

  private _obliqueCollectionChanged(collection: ObliqueCollection): void {
    this._obliqueTileLayer!.source = collection.tileFeatureSource;
    this._obliqueTileLayer!.forceRedraw().catch(() => {});
    this._obliqueImageLayer!.source = collection.imageFeatureSource;
    this._obliqueImageLayer!.forceRedraw().catch(() => {});
    this._obliqueSelectedImageLayer!.removeAllFeatures();
  }

  private _obliqueImageChange(image?: ObliqueImage): void {
    if (image) {
      const { source } = this._obliqueImageLayer!;
      if (this._obliqueViewDirection !== image.viewDirection) {
        this._obliqueViewDirection = image.viewDirection;
        source.changed();
      }
      const activeFeature = source.getFeatureById(image.name);
      if (activeFeature) {
        this._obliqueSelectedImageLayer?.removeAllFeatures();
        this._obliqueSelectedImageLayer?.addFeatures([activeFeature]);
        const extent = new Extent({
          coordinates: activeFeature.getGeometry()!.getExtent(),
          projection: mercatorProjection.toJSON(),
        });

        const vp = Viewpoint.createViewpointFromExtent(extent);
        if (vp) {
          vp.distance! /= this._obliqueResolutionFactor;
          vp.distance! *= this._scaleFactor;
          this._map.gotoViewpoint(vp).catch(() => {});
        }
      }
    }
  }

  private _setupObliqueLayers(): void {
    const almostTransparentStyle = new VectorStyleItem({
      fill: { color: 'rgba(0, 0, 0, 0.000001)' },
    });
    const obliqueTileStyle = new VectorStyleItem({});
    obliqueTileStyle.style = (feature): Style | Style[] => {
      if (feature.get('state') === DataState.PENDING) {
        return almostTransparentStyle.style as Style | Style[];
      }
      return emptyStyle;
    };

    this._obliqueTileLayer = new VectorLayer({
      projection: mercatorProjection.toJSON(),
      style: obliqueTileStyle,
      zIndex: maxZIndexMin50 - 4,
    });
    // @ts-expect-error overviewMapLayerSymbol is not a property of VectorLayer
    this._obliqueTileLayer[overviewMapLayerSymbol] = true;

    const obliqueImageStyle = new VectorStyleItem({});
    obliqueImageStyle.style = (feature): Style | Style[] => {
      if (feature.get('viewDirection') === this._obliqueViewDirection) {
        return almostTransparentStyle.style as Style | Style[];
      }
      return emptyStyle;
    };

    this._obliqueImageLayer = new VectorLayer({
      projection: mercatorProjection.toJSON(),
      style: obliqueImageStyle,
      zIndex: maxZIndexMin50 - 3,
    });
    // @ts-expect-error overviewMapLayerSymbol is not a property of VectorLayer
    this._obliqueImageLayer[overviewMapLayerSymbol] = true;
    this._obliqueSelectedImageLayer = new VectorLayer({
      projection: mercatorProjection.toJSON(),
      style: this.obliqueSelectedStyle,
      zIndex: maxZIndexMin50 - 2,
    });
    // @ts-expect-error overviewMapLayerSymbol is not a property of VectorLayer
    this._obliqueSelectedImageLayer[overviewMapLayerSymbol] = true;
    this._map.layerCollection.add(this._obliqueImageLayer);
    this._map.layerCollection.add(this._obliqueSelectedImageLayer);
    this._map.layerCollection.add(this._obliqueTileLayer);
  }

  private _addNavigationListener(activeMap: VcsMap): () => void {
    if (activeMap instanceof PanoramaMap) {
      return () => {};
    }

    return this._mapClicked.addEventListener((e) => {
      const vp = activeMap.getViewpointSync();
      if (vp) {
        const newPosition = Projection.mercatorToWgs84(e.positionOrPixel!);
        if (activeMap instanceof CesiumMap) {
          const globe = activeMap.getScene()?.globe;
          const newGroundLevel =
            globe?.getHeight(
              Cartographic.fromDegrees(newPosition[0], newPosition[1]),
            ) || 0;
          const oldGroundLevel =
            globe?.getHeight(
              Cartographic.fromDegrees(
                vp.cameraPosition![0],
                vp.cameraPosition![1],
              ),
            ) || 0;

          newPosition[2] =
            newGroundLevel + Math.abs(vp.cameraPosition![2] - oldGroundLevel);
          vp.cameraPosition = newPosition;
        } else {
          vp.groundPosition = newPosition;
          vp.cameraPosition = null;
        }
        activeMap.gotoViewpoint(vp).catch(() => {});
      }
    });
  }

  private _setupCameraIconLayer(): void {
    if (!this._cameraIconLayer) {
      this._cameraIconLayer = new VectorLayer({
        projection: mercatorProjection.toJSON(),
        // pretty far at the top, but not above panoramas
        zIndex: maxZIndexMin50 - 1,
      });
      // @ts-expect-error overviewMapLayerSymbol is not a property of VectorLayer
      this._cameraIconLayer[overviewMapLayerSymbol] = true;
      this._map.layerCollection.add(this._cameraIconLayer);
    }
  }

  /**
   * Adds and maintains the view and camera feature
   */
  private _syncCameraViewAndFeature(): void {
    const viewpoint = this._app.maps.activeMap?.getViewpointSync();
    if (
      !viewpoint ||
      !viewpoint.isValid() ||
      viewpoint.equals(this._cachedViewpoint!)
    ) {
      return;
    }
    this._cachedViewpoint = viewpoint.clone();
    const gp = viewpoint.groundPosition;
    const position = (viewpoint.cameraPosition || gp) as [
      number,
      number,
      number,
    ];
    const { heading } = viewpoint;
    let { distance } = viewpoint;
    if (position[2] && !(distance && distance < position[2] * 4)) {
      distance = position[2] * 4;
    }

    distance = distance! > this._minimumHeight ? distance : this._minimumHeight;
    if (heading == null || distance == null) {
      return;
    }
    let cameraFeature = this._cameraIconLayer?.getFeatureById('cameraFeature');
    const coords = Projection.wgs84ToMercator(position);
    if (!cameraFeature) {
      const cameraGeometry = new Point(coords);
      cameraFeature = new Feature({
        geometry: cameraGeometry,
      });
      cameraFeature.setId('cameraFeature');
      cameraFeature.setStyle(this.cameraIconStyle.style);
      this._cameraIconLayer?.addFeatures([cameraFeature]);
    }
    cameraFeature.getGeometry()?.setCoordinates(coords);

    const rotationDegrees = viewpoint.heading;
    const rotationRadians = CesiumMath.toRadians(rotationDegrees);

    this.cameraIconStyle.image?.setRotation(rotationRadians);

    viewpoint.heading = 0;
    if (viewpoint.cameraPosition) {
      viewpoint.cameraPosition = position;
      viewpoint.groundPosition = null;
      viewpoint.distance = distance * 4;
    }
    viewpoint.distance! *= this._scaleFactor;
    this._map.gotoViewpoint(viewpoint).catch(() => {});
  }

  /**
   * @private
   */
  private _clearListeners(): void {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }

  destroy(): void {
    this._clearListeners();
    this._collectionListeners.forEach((cb) => {
      cb();
    });
    this._collectionListeners = [];
    this._uiConfigWatchers.forEach((cb) => {
      cb();
    });
    if (this._mapPointerListener) {
      this._mapPointerListener();
      this._mapPointerListener = null;
    }
    if (this._mapActivatedListener) {
      this._mapActivatedListener();
      this._mapActivatedListener = null;
    }
    this._map.destroy();
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
    this._eventHandler.destroy();
    this.cameraIconStyle.destroy();
    this.obliqueSelectedStyle.destroy();
    this._cachedViewpoint = null;
  }
}

export default OverviewMap;
