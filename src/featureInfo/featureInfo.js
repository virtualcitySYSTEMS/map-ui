import {
  EventType,
  makeOverrideCollection,
  Collection,
  getObjectFromClassRegistry,
  VcsEvent,
  vcsLayerName,
  OverrideClassRegistry,
  ClassRegistry,
  Projection,
  fromCesiumColor,
} from '@vcmap/core';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import {
  Cartesian2,
  Cartographic,
  Cesium3DTileFeature,
  Cesium3DTilePointFeature,
  Color,
  Entity,
  Math as CesiumMath,
} from '@vcmap/cesium';
import { Feature } from 'ol';
import { getCenter } from 'ol/extent';
import { Fill, Stroke } from 'ol/style.js';
import { check } from '@vcsuite/check';
import { vuetify } from '../vuePlugins/vuetify.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import FeatureInfoInteraction from './featureInfoInteraction.js';
import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import TableFeatureInfoView from './tableFeatureInfoView.js';
import IframeFeatureInfoView from './iframeFeatureInfoView.js';
import AddressBalloonFeatureInfoView from './addressBalloonFeatureInfoView.js';
import BalloonFeatureInfoView from './balloonFeatureInfoView.js';
import { getBalloonPosition } from './balloonHelper.js';

/**
 * @returns {Logger}
 */
function getLogger() {
  return getLoggerByName('featureInfo');
}

/**
 * @param {import("@vcmap/core").Cartesian3} cartesian
 * @returns {import("ol/coordinate").Coordinate}
 */
function cartesian3ToCoordinate(cartesian) {
  const cartographic = Cartographic.fromCartesian(cartesian);
  const wgs84position = [
    CesiumMath.toDegrees(cartographic.longitude),
    CesiumMath.toDegrees(cartographic.latitude),
    cartographic.height, // XXX height on terrain?
  ];
  return Projection.wgs84ToMercator(wgs84position);
}

/**
 * @param {import("ol").Feature<import("ol/geom/Geometry").default>|import("@vcmap/cesium").Cesium3DTileFeature|import("@vcmap/cesium").Cesium3DTilePointFeature} feature
 * @param {import("@vcmap/core").Layer} layer
 * @returns {import("ol/style/Style").default|import("@vcmap/core").VectorStyleItem}
 */
function getHighlightStyle(feature, layer) {
  if (layer && layer.highlightStyle) {
    return layer.highlightStyle;
  }
  // XXX clean up, vuetify may be scoped
  const { primary } = vuetify.userPreset.theme.themes.light;
  const fillColor = Color.fromCssColorString(primary).withAlpha(0.8);
  if (feature instanceof Feature) {
    let style = feature.getStyle() ?? layer?.style?.style;
    if (typeof style === 'function') {
      style = style(feature, 1);
    }
    style = style.clone();
    if (style.getText() || style.getImage() || style.getStroke()) {
      style.getText().setFill(new Fill({ color: fillColor.toCssColorString() }));
      style.getText().setScale(style.getText().getScale() * 2);
      style.getImage().setOpacity(0.8);
      style.getImage().setScale(style.getImage().getScale() * 2);
      style.setStroke(new Stroke({
        width: style.getStroke().getWidth() * 2,
        color: fillColor.toCssColorString(),
      }));
    } else if (style.getFill()) {
      style.setFill(new Fill({ color: fillColor.toBytes() }));
    }
    return style;
  }
  return fromCesiumColor(fillColor);
}

/**
 * @param {VcsUiApp} app
 * @param {FeatureInfoInteraction} interaction
 * @returns {FeatureInfoSession}
 */
export function createFeatureInfoSession(app, interaction) {
  const removed = new VcsEvent();
  const { eventHandler } = app.maps;
  const listener = eventHandler.addExclusiveInteraction(
    interaction,
    () => { removed.raiseEvent(); },
  );
  const currentFeatureInteractionEvent = eventHandler.featureInteraction.active;
  eventHandler.featureInteraction.setActive(EventType.CLICK);

  const stopped = new VcsEvent();
  const stop = () => {
    listener();
    removed.destroy();
    interaction.destroy();
    eventHandler.featureInteraction.setActive(currentFeatureInteractionEvent);
    stopped.raiseEvent();
    stopped.destroy();
  };
  removed.addEventListener(stop);

  return {
    interaction,
    stopped,
    stop,
  };
}

/**
 * @typedef {Object} FeatureInfoEvent
 * @property {null|import("ol").Feature<import("ol/geom/Geometry").default>|import("@vcmap/cesium").Cesium3DTileFeature|import("@vcmap/cesium").Cesium3DTilePointFeature} feature
 * @property {import("ol/coordinate").Coordinate} position
 * @property {import("ol/coordinate").Coordinate} windowPosition
 */

/**
 * @typedef {Object} FeatureInfoSession
 * @property {VcsEvent<void>} stopped
 * @property {function():void} stop
 * @property {FeatureInfoInteraction} interaction
 */

/**
 * @type {ClassRegistry<AbstractFeatureInfoView>}
 */
export const featureInfoClassRegistry = new ClassRegistry();

/**
 * @class FeatureInfo
 * @description Provides registration of featureInfoClasses and stores featureInfoView instances in its collection.
 */
class FeatureInfo {
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
     * @type {OverrideCollection<AbstractFeatureInfoView>}
     * @private
     */
    this._collection = makeOverrideCollection(
      new Collection(),
      () => this._app.dynamicContextId,
      null,
      config => getObjectFromClassRegistry(this._featureInfoClassRegistry, config),
      AbstractFeatureInfoView,
    );

    /**
     * @type {OverrideClassRegistry<AbstractFeatureInfoView>}
     * @private
     */
    this._featureInfoClassRegistry = new OverrideClassRegistry(featureInfoClassRegistry);

    /**
     * @type {FeatureInfoInteraction}
     * @private
     */
    this._featureInfoInteraction = new FeatureInfoInteraction();

    /**
     * @type {FeatureInfoSession|null}
     * @private
     */
    this._session = null;

    /**
     * @type {Function|null}
     * @private
     */
    this._clearHighlightingCb = null;

    const action = {
      name: 'featureInfoToggle',
      title: 'Feature Info',
      icon: '$vcsInfo',
      active: false,
      callback: () => {
        if (this._session) {
          this.deactivate();
          action.active = false;
        } else {
          this.activate();
          action.active = true;
        }
      },
    };

    this._app.toolboxManager.requestGroup('featureInfo').buttonManager.add(
      {
        id: 'featureInfoTool',
        action,
      },
      vcsAppSymbol,
    );

    /**
     * @type {string|null}
     * @private
     */
    this._windowId = null;

    /**
     * @type {Array<Function>}
     * @private
     */
    this._listeners = [];
  }

  /**
   * @type {OverrideCollection<AbstractFeatureInfoView>}
   * @readonly
   */
  get collection() { return this._collection; }

  /**
   * @type {OverrideClassRegistry<AbstractFeatureInfoView>}
   * @readonly
   */
  get classRegistry() { return this._featureInfoClassRegistry; }

  /**
   * @type {VcsEvent<undefined|import("ol").Feature<import("ol/geom/Geometry").default>|import("@vcmap/cesium").Cesium3DTileFeature|import("@vcmap/cesium").Cesium3DTilePointFeature>}
   * @readonly
   */
  get featureChanged() { return this._featureInfoInteraction.featureChanged; }

  /**
   * @type {undefined|import("ol").Feature<import("ol/geom/Geometry").default>|import("@vcmap/cesium").Cesium3DTileFeature|import("@vcmap/cesium").Cesium3DTilePointFeature}
   */
  get selectedFeature() { return this._featureInfoInteraction.selectedFeature; }

  /**
   * Selecting a feature highlights said feature and opens a FeatureInfoView, if configured on the layer.
   * @param {null|import("ol").Feature<import("ol/geom/Geometry").default>|import("@vcmap/cesium").Cesium3DTileFeature|import("@vcmap/cesium").Cesium3DTilePointFeature} feature
   * @param {import("ol/coordinate").Coordinate} [position] - optional clicked position. If not given feature's center point is used
   * @param {import("ol/coordinate").Coordinate} [windowPosition] - optional clicked window position. If not given derived from position
   * @returns {Promise<void>}
   */
  async selectFeature(feature, position = undefined, windowPosition = undefined) {
    check(feature, [null, Feature, Entity, Cesium3DTileFeature, Cesium3DTilePointFeature]);
    let pos = position;

    if (feature) {
      try {
        if (!pos) {
          if (feature instanceof Feature) {
            pos = getCenter(feature.getGeometry().getExtent());
          } else if (feature instanceof Entity) {
            pos = cartesian3ToCoordinate(feature.position);
          } else {
            pos = cartesian3ToCoordinate(feature.primitive.boundingSphere.center);
          }
        }
        if (!windowPosition) {
          const balloonPosition = await getBalloonPosition(this._app, pos);
          if (balloonPosition instanceof Cartesian2) {
            // eslint-disable-next-line no-param-reassign
            windowPosition = [balloonPosition.x, balloonPosition.y];
          }
        }
      } catch (err) {
        getLogger().error('Select feature without position or windowPosition', err);
      }
    }
    await this._featureInfoInteraction.selectFeature(feature, pos, windowPosition);
  }

  /**
   * Deselecting feature clears highlighting and closes FeatureInfoView
   * @returns {Promise<void>}
   */
  async clear() {
    await this.selectFeature(null);
  }

  /**
   * @private
   */
  _clearHighlighting() {
    if (this._clearHighlightingCb) {
      this._clearHighlightingCb();
      this._clearHighlightingCb = null;
    }
  }

  /**
   * activates the tool by creating a new session and adding a feature clicked event listener
   */
  activate() {
    if (this._session) {
      return;
    }
    this._session = createFeatureInfoSession(this._app, this._featureInfoInteraction);
    this._listeners = [
      this._session.interaction.featureChanged.addEventListener(this._handleFeatureClicked.bind(this)),
      this._session.stopped.addEventListener(() => this.deactivate()),
      this._app.maps.mapActivated.addEventListener((map) => {
        if (
          this._windowId &&
          this._app.windowManager.has(this._windowId)
        ) {
          const { layerName } = this._app.windowManager.get(this._windowId).props;
          const layer = this._app.layers.getByKey(layerName);
          if (layer && !layer.isSupported(map)) {
            this._app.windowManager.remove(this._windowId);
          }
        }
      }),
      this._app.layers.stateChanged.addEventListener((layer) => {
        if (
          this._windowId &&
          this._app.windowManager.has(this._windowId) &&
          this._app.windowManager.get(this._windowId).props.layerName === layer.name
        ) {
          this._app.windowManager.remove(this._windowId);
        }
      }),
      this._app.windowManager.removed.addEventListener(({ id }) => {
        if (id === this._windowId) {
          this.clear();
        }
      }),
      this._app.contextAdded.addEventListener(() => this.deactivate()),
      this._app.contextRemoved.addEventListener(() => this.deactivate()),
    ];
    if (this._app.toolboxManager.requestGroup('featureInfo').buttonManager.has('featureInfoTool')) {
      this._app.toolboxManager.requestGroup('featureInfo').buttonManager
        .get('featureInfoTool').action.active = true;
    }
  }

  /**
   * deactivates the tool by stopping the session and removing all listeners
   * closes open windows
   */
  deactivate() {
    this._listeners.forEach(cb => cb());
    this._listeners.splice(0);
    if (this._session) {
      this._session.stop();
      this._session = null;
    }
    if (this._windowId) {
      this._app.windowManager.remove(this._windowId);
      this._windowId = null;
    }
    if (this._app.toolboxManager.requestGroup('featureInfo').buttonManager.has('featureInfoTool')) {
      this._app.toolboxManager.requestGroup('featureInfo').buttonManager
        .get('featureInfoTool').action.active = false;
    }
    this._clearHighlighting();
  }

  /**
   * @param {FeatureInfoEvent|null} event - a clicked feature
   * @private
   */
  _handleFeatureClicked(event) {
    this._clearHighlighting();
    if (this._windowId && (!event || !event.feature)) {
      this._app.windowManager.remove(this._windowId);
      return;
    }
    const { feature } = event;
    const featureId = feature.getId();
    const layer = this._app.layers.getByKey(feature[vcsLayerName]);
    const name = layer?.properties?.featureInfo;
    if (!name) {
      getLogger().debug(`No view has been configured for layer '${layer.name}'.`);
      return;
    }
    if (!this._collection.hasKey(name)) {
      getLogger().warning(`No view with name '${name}' has been registered.`);
      return;
    }
    const featureInfoView = /** @type {AbstractFeatureInfoView} */ this._collection.getByKey(name);
    if (featureInfoView) {
      if (this._windowId && this._app.windowManager.has(this._windowId)) {
        this._app.windowManager.remove(this._windowId);
      }
      this._windowId = `featureInfo-${featureId}`;
      this._app.windowManager.add(
        {
          id: this._windowId,
          ...featureInfoView.getWindowComponentOptions(event, layer),
        },
        vcsAppSymbol,
      );
      if (layer.featureVisibility) {
        layer.featureVisibility.highlight({
          [featureId]: getHighlightStyle(feature, layer),
        });
        this._clearHighlightingCb = () => layer.featureVisibility.unHighlight([featureId]);
      }
    }
  }

  /**
   * @param {Array<FeatureInfoViewOptions>} items
   * @param {string} contextId
   * @returns {Promise<void>}
   */
  async parseContext(items, contextId) {
    await this._collection.parseItems(items, contextId);
  }

  /**
   * @param {string} contextId
   * @returns {Promise<void>}
   */
  async removeContext(contextId) {
    this.deactivate();
    await this._collection.removeContext(contextId);
  }

  destroy() {
    this.deactivate();
    this._app.toolboxManager.requestGroup('featureInfo').buttonManager.remove('featureInfoTool');
    this._featureInfoInteraction.destroy();
    this._collection.destroy();
    this._featureInfoClassRegistry.destroy();
  }
}

export default FeatureInfo;
featureInfoClassRegistry.registerClass(TableFeatureInfoView.className, TableFeatureInfoView);
featureInfoClassRegistry.registerClass(IframeFeatureInfoView.className, IframeFeatureInfoView);
featureInfoClassRegistry.registerClass(BalloonFeatureInfoView.className, BalloonFeatureInfoView);
featureInfoClassRegistry.registerClass(AddressBalloonFeatureInfoView.className, AddressBalloonFeatureInfoView);
