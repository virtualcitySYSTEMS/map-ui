import {
  EventType,
  Collection,
  VcsEvent,
  vcsLayerName,
  ClassRegistry,
  fromCesiumColor,
  VectorLayer,
  isProvidedFeature,
  mercatorProjection,
  getDefaultVectorStyleItemOptions,
  VectorStyleItem,
  markVolatile,
  maxZIndex,
} from '@vcmap/core';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import {
  Cesium3DTileFeature,
  Cesium3DTilePointFeature,
  Color,
  Entity,
} from '@vcmap-cesium/engine';
import { Feature } from 'ol';
import { check, checkMaybe } from '@vcsuite/check';

import { vcsAppSymbol } from '../pluginHelper.js';
import FeatureInfoInteraction from './featureInfoInteraction.js';
import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import TableFeatureInfoView from './tableFeatureInfoView.js';
import IframeFeatureInfoView from './iframeFeatureInfoView.js';
import AddressBalloonFeatureInfoView from './addressBalloonFeatureInfoView.js';
import BalloonFeatureInfoView from './balloonFeatureInfoView.js';
import MarkdownFeatureInfoView from './markdowFeatureInfoView.js';
import { getDefaultPrimaryColor } from '../vuePlugins/vuetify.js';
import { ToolboxType } from '../manager/toolbox/toolboxManager.js';

/** @typedef {import("ol").Feature|import("@vcmap-cesium/engine").Cesium3DTileFeature|import("@vcmap-cesium/engine").Cesium3DTilePointFeature|import("@vcmap-cesium/engine").Entity} FeatureType */

/**
 * @typedef {Object} FeatureInfoEvent
 * @property {FeatureType} feature
 * @property {import("ol/coordinate.js").Coordinate} [position] - potential position to place the balloon at
 * @property {import("ol/coordinate.js").Coordinate} [windowPosition] - potential window position to initially place the balloon at
 */

/**
 * @returns {Logger}
 */
function getLogger() {
  return getLoggerByName('featureInfo');
}

/**
 * @param {FeatureType} feature
 * @param {import("@vcmap/core").Layer} layer
 * @param {string} defaultFillColor
 * @returns {import("ol/style/Style.js").default|import("@vcmap/core").VectorStyleItem}
 */
export function getHighlightStyle(feature, layer, defaultFillColor) {
  if (layer && layer.highlightStyle) {
    return layer.highlightStyle;
  }

  const fillColor = Color.fromCssColorString(defaultFillColor).withAlpha(0.8);
  if (feature instanceof Feature) {
    let style = feature.getStyle() ?? layer?.style?.style;
    if (typeof style === 'function') {
      style = style(feature, 1);
    }
    style =
      style?.clone?.() ??
      new VectorStyleItem(getDefaultVectorStyleItemOptions()).style;
    if (style.getText()) {
      if (style.getText().getFill()) {
        style.getText().getFill().setColor(fillColor.toCssColorString());
      }
      style.getText().setScale((style.getText().getScale() ?? 1) * 2);
    }
    if (style.getImage()) {
      style.getImage().setScale(style.getImage().getScale() * 2);
    }
    if (style.getStroke()) {
      style.getStroke().setColor(fillColor.toCssColorString());
      style.getStroke().setWidth(style.getStroke().getWidth() * 2);
    }
    if (style.getFill()) {
      const color = fillColor.toBytes();
      color[3] /= 255;
      style.getFill().setColor(color);
    }
    return style;
  }
  return fromCesiumColor(fillColor);
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @returns {FeatureInfoSession}
 */
export function createFeatureInfoSession(app) {
  const { eventHandler } = app.maps;
  /** @type {function():void} */
  let stop;
  const interaction = new FeatureInfoInteraction(app.featureInfo);
  const listener = eventHandler.addExclusiveInteraction(interaction, () => {
    stop?.();
  });
  const currentFeatureInteractionEvent = eventHandler.featureInteraction.active;
  eventHandler.featureInteraction.setActive(EventType.CLICK);

  const stopped = new VcsEvent();
  stop = () => {
    listener();
    interaction.destroy();
    eventHandler.featureInteraction.setActive(currentFeatureInteractionEvent);
    stopped.raiseEvent();
    stopped.destroy();
  };

  return {
    stopped,
    stop,
  };
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @returns {function():void}
 */
function setupFeatureInfoTool(app) {
  /** @type {FeatureInfoSession|null} */
  let session = null;

  const action = {
    name: 'featureInfoToggle',
    title: 'featureInfo.activateToolTitle',
    icon: '$vcsInfo',
    active: false,
    callback() {
      if (session) {
        session.stop();
      } else {
        session = createFeatureInfoSession(app);
        session.stopped.addEventListener(() => {
          this.active = false;
          session = null;
          app.featureInfo.clear();
          this.title = 'featureInfo.activateToolTitle';
        });
        this.active = true;
        this.title = 'featureInfo.deactivateToolTitle';
      }
    },
  };

  function addFeatureInfoButton() {
    if (app.uiConfig.getByKey('startingFeatureInfo')?.value !== false) {
      action.callback();
    }
    app.toolboxManager.add(
      {
        id: 'featureInfo',
        type: ToolboxType.SINGLE,
        action,
      },
      vcsAppSymbol,
    );
  }

  if ([...app.layers].some((l) => l.properties?.featureInfo)) {
    addFeatureInfoButton();
  }

  const listeners = [
    app.layers.added.addEventListener((layer) => {
      if (
        layer?.properties?.featureInfo &&
        !app.toolboxManager.has('featureInfo')
      ) {
        addFeatureInfoButton();
      }
    }),
    app.layers.removed.addEventListener(() => {
      if (
        ![...app.layers].some((l) => l.properties?.featureInfo) &&
        app.toolboxManager.has('featureInfo')
      ) {
        app.toolboxManager.remove('featureInfo');
      }
    }),
  ];

  return () => {
    if (session) {
      session.stop();
    }
    app.toolboxManager.remove('featureInfo');
    listeners.forEach((cb) => cb());
  };
}

/**
 * @typedef {Object} FeatureInfoSession
 * @property {VcsEvent<void>} stopped
 * @property {function():void} stop
 */

/**
 * @type {ClassRegistry<import("@vcmap/core").Ctor<typeof AbstractFeatureInfoView>>}
 */
export const featureInfoClassRegistry = new ClassRegistry();

/**
 * Symbol added to features to overwrite the layers predefined feature info
 * @type {symbol}
 */
export const featureInfoViewSymbol = Symbol('featureInfoView');

/**
 * @class FeatureInfo
 * @description Provides registration of featureInfoClasses and stores featureInfoView instances.
 * @extends {Collection<AbstractFeatureInfoView>}
 */
class FeatureInfo extends Collection {
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
     * @type {function():void|null}
     * @private
     */
    this._clearHighlightingCb = null;
    /**
     * @type {string|null}
     * @private
     */
    this._windowId = null;
    /**
     * @type {VcsEvent<FeatureType>}
     * @private
     */
    this._featureChanged = new VcsEvent();
    /**
     * @type {FeatureType|null}
     * @private
     */
    this._selectedFeature = null;
    /**
     * @type {string|null}
     * @private
     */
    this._selectedFeatureId = null;
    /**
     * @type {Array<function():void>}
     * @private
     */
    this._listeners = [
      this._app.maps.mapActivated.addEventListener((map) => {
        if (this._windowId && this._app.windowManager.has(this._windowId)) {
          const { layerName } = this._app.windowManager.get(
            this._windowId,
          ).props;
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
          this._app.windowManager.get(this._windowId).props.layerName ===
            layer.name
        ) {
          this._app.windowManager.remove(this._windowId);
        }
      }),
      this._app.windowManager.removed.addEventListener(({ id }) => {
        if (id === this._windowId) {
          this.clear();
        }
      }),
      this._app.moduleAdded.addEventListener(() => {
        this.clear();
        this._destroyFeatureInfoTool();
        this._destroyFeatureInfoTool = setupFeatureInfoTool(this._app);
      }),
      this._app.moduleRemoved.addEventListener(() => this.clear()),
    ];
    /**
     * A vector layer to render provided features on
     * @type {VectorLayer|null}
     * @private
     */
    this._scratchLayer = null;
    /**
     * @type {function():void}
     * @private
     */
    this._destroyFeatureInfoTool = setupFeatureInfoTool(this._app);
  }

  /**
   * @type {VcsEvent<null|FeatureType>}
   */
  get featureChanged() {
    return this._featureChanged;
  }

  /**
   * @type {null|FeatureType}
   */
  get selectedFeature() {
    return this._selectedFeature;
  }

  /**
   * @type {null|string}
   */
  get selectedFeatureId() {
    return this._selectedFeatureId;
  }

  /**
   * The window id of the current features FeatureInfoView window
   * @type {string|null}
   */
  get windowId() {
    return this._windowId;
  }

  /**
   * @private
   */
  _ensureScratchLayer() {
    if (!this._scratchLayer) {
      this._scratchLayer = new VectorLayer({
        zIndex: maxZIndex,
        projection: mercatorProjection.toJSON(),
      });
      markVolatile(this._scratchLayer);
      this._app.layers.add(this._scratchLayer);
      this._scratchLayer.activate();
    }
  }

  /**
   * @param {FeatureType} feature
   * @returns {null|AbstractFeatureInfoView}
   * @private
   */
  _getFeatureInfoViewForFeature(feature) {
    const layer = this._app.layers.getByKey(feature[vcsLayerName]);
    const name = layer?.properties?.featureInfo;
    if (!name) {
      getLogger().debug(
        `No view has been configured for layer '${layer?.name}'.`,
      );
      return null;
    }
    if (!this.hasKey(name)) {
      getLogger().warning(`No view with name '${name}' has been registered.`);
      return null;
    }
    return /** @type {AbstractFeatureInfoView} */ this.getByKey(name);
  }

  /**
   * Selecting a feature highlights said feature and opens a FeatureInfoView, if configured on the layer. For a successful selection,
   * the feature must meet the following criteria: a) the feature must be part of a layer, b) said layer must be managed in
   * the same VcsApp as provided to the FeatureInfo on construction. if not providing a feature info view, then c) said layer must have a featureInfo property set on
   * its properties bag and d) said featureInfo property must provide the name of a FeatureInfoView present on this FeatureInfos
   * collection.
   * If passing a feature create by a FeatureProvider, the feature will be highlighted on an internal scratch layer.
   * @param {FeatureType} feature
   * @param {import("ol/coordinate.js").Coordinate=} [position] - optional clicked position. If not given feature's center point is used to place balloons
   * @param {import("ol/coordinate.js").Coordinate=} [windowPosition] - optional clicked window position. If not given derived from position for balloons
   * @param {AbstractFeatureInfoView=} featureInfoView
   * @returns {Promise<void>}
   */
  async selectFeature(feature, position, windowPosition, featureInfoView) {
    check(feature, [
      Feature,
      Entity,
      Cesium3DTileFeature,
      Cesium3DTilePointFeature,
    ]);
    checkMaybe(position, [Number]);
    checkMaybe(windowPosition, [Number]);
    checkMaybe(featureInfoView, AbstractFeatureInfoView);

    const usedFeatureInfoView =
      feature[featureInfoViewSymbol] ??
      featureInfoView ??
      this._getFeatureInfoViewForFeature(feature);
    const layer = this._app.layers.getByKey(feature[vcsLayerName]);

    if (usedFeatureInfoView && layer) {
      this._clearInternal();
      if (feature[isProvidedFeature]) {
        this._ensureScratchLayer();
        this._scratchLayer.addFeatures([feature]);
        const featureId = feature.getId(); // make sure to grab ID after adding it to the layer
        this._scratchLayer.featureVisibility.highlight({
          [featureId]: getHighlightStyle(
            feature,
            layer,
            this._app.uiConfig.config.value.primaryColor ??
              getDefaultPrimaryColor(),
          ),
        });
        this._clearHighlightingCb = () =>
          this._scratchLayer.featureVisibility.unHighlight([featureId]);
      } else if (layer.featureVisibility) {
        const featureId = feature.getId();
        layer.featureVisibility.highlight({
          [featureId]: getHighlightStyle(
            feature,
            layer,
            this._app.uiConfig.config.value.primaryColor ??
              getDefaultPrimaryColor(),
          ),
        });
        this._clearHighlightingCb = () =>
          layer.featureVisibility.unHighlight([featureId]);
      }
      this._windowId = usedFeatureInfoView.className; // use className for a type based position caching
      this._app.windowManager.add(
        {
          id: this._windowId,
          ...usedFeatureInfoView.getWindowComponentOptions(
            this._app,
            { feature, position, windowPosition },
            layer,
          ),
        },
        vcsAppSymbol,
      );

      this._selectedFeature = feature;
      this._selectedFeatureId = feature.getId();
      this._featureChanged.raiseEvent(this._selectedFeature);
    } else {
      this.clear();
    }
  }

  /**
   * Clears the current feature. remove window, highlighting and provided feature.
   * @private
   */
  _clearInternal() {
    if (this._clearHighlightingCb) {
      this._clearHighlightingCb();
      this._clearHighlightingCb = null;
    }
    if (this._windowId) {
      this._app.windowManager.remove(this._windowId);
      this._windowId = null;
    }

    if (this._scratchLayer) {
      this._scratchLayer.removeAllFeatures();
    }
  }

  /**
   * Deselecting feature clears highlighting and closes FeatureInfoView. fires feature changed with null
   */
  clear() {
    this._clearInternal();
    if (this._selectedFeature) {
      this._selectedFeature = null;
      this._selectedFeatureId = null;
      this._featureChanged.raiseEvent(this._selectedFeature);
    }
  }

  /**
   * Destroys the feature info and all its events & listeners
   */
  destroy() {
    super.destroy();
    this._clearInternal();
    this._featureChanged.destroy();
    this._destroyFeatureInfoTool();
    if (this._scratchLayer) {
      this._app.layers.remove(this._scratchLayer);
      this._scratchLayer.destroy();
    }
    this._listeners.forEach((cb) => cb());
    this._listeners.splice(0);
  }
}

export default FeatureInfo;
featureInfoClassRegistry.registerClass(
  TableFeatureInfoView.className,
  TableFeatureInfoView,
);
featureInfoClassRegistry.registerClass(
  IframeFeatureInfoView.className,
  IframeFeatureInfoView,
);
featureInfoClassRegistry.registerClass(
  BalloonFeatureInfoView.className,
  BalloonFeatureInfoView,
);
featureInfoClassRegistry.registerClass(
  AddressBalloonFeatureInfoView.className,
  AddressBalloonFeatureInfoView,
);
featureInfoClassRegistry.registerClass(
  MarkdownFeatureInfoView.className,
  MarkdownFeatureInfoView,
);
