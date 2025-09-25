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
  vectorClusterGroupName,
  hidden,
  isProvidedClusterFeature,
  alreadyTransformedToImage,
  ObliqueMap,
  originalFeatureSymbol,
  mercatorToCartesian,
  cartesianToMercator,
  CesiumMap,
} from '@vcmap/core';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import {
  Cartographic,
  Cesium3DTileFeature,
  Cesium3DTilePointFeature,
  Color,
  Entity,
  HeightReference,
} from '@vcmap-cesium/engine';
import { Feature } from 'ol';
import { check, maybe, oneOf } from '@vcsuite/check';

import { reactive } from 'vue';
import { WindowSlot } from '../manager/window/windowManager.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import FeatureInfoInteraction from './featureInfoInteraction.js';
import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import TableFeatureInfoView from './tableFeatureInfoView.js';
import IframeFeatureInfoView from './iframeFeatureInfoView.js';
import AddressBalloonFeatureInfoView from './addressBalloonFeatureInfoView.js';
import BalloonFeatureInfoView from './balloonFeatureInfoView.js';
import MarkdownFeatureInfoView from './markdownFeatureInfoView.js';
import { getDefaultPrimaryColor } from '../vuePlugins/vuetify.js';
import { ToolboxType } from '../manager/toolbox/toolboxManager.js';
import MarkdownBalloonFeatureInfoView from './markdownBalloonFeatureInfoView.js';
import IframeWmsFeatureInfoView from './iframeWmsFeatureInfoView.js';
import ClusterFeatureComponent from './ClusterFeatureComponent.vue';
import { createZoomToFeatureAction } from '../actions/actionHelper.js';

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
 * @type {ClassRegistry<typeof AbstractFeatureInfoView>}
 */
export const featureInfoClassRegistry = new ClassRegistry();

/**
 * Symbol added to features to overwrite the layers predefined feature info
 * @type {symbol}
 */
export const featureInfoViewSymbol = Symbol('featureInfoView');

/**
 *
 * @param {import("ol/style/Style.js").default?} style
 * @param {import("@vcmap-cesium/engine").Color} fillColor
 * @returns {import("ol/style/Style.js").default}
 */
export function getHighlightStyleFromStyle(style, fillColor) {
  const highlightStyle =
    style?.clone?.() ??
    new VectorStyleItem(getDefaultVectorStyleItemOptions()).style;
  if (highlightStyle.getText()) {
    if (highlightStyle.getText().getFill()) {
      highlightStyle.getText().getFill().setColor(fillColor.toCssColorString());
    }
    highlightStyle
      .getText()
      .setScale((highlightStyle.getText().getScale() ?? 1) * 2);
  }
  if (highlightStyle.getImage()) {
    highlightStyle
      .getImage()
      .setScale(highlightStyle.getImage().getScale() * 2);
  }
  if (highlightStyle.getStroke()) {
    highlightStyle.getStroke().setColor(fillColor.toCssColorString());
    highlightStyle
      .getStroke()
      .setWidth(highlightStyle.getStroke().getWidth() * 2);
  }
  if (highlightStyle.getFill()) {
    const color = fillColor.toBytes();
    color[3] /= 255;
    highlightStyle.getFill().setColor(color);
  }
  return highlightStyle;
}

/**
 * @param {FeatureType} feature
 * @param {import("@vcmap/core").Layer} layer
 * @param {string} defaultFillColor
 * @returns {import("ol/style/Style.js").default|import("@vcmap/core").VectorStyleItem}
 */
export function getHighlightStyle(feature, layer, defaultFillColor) {
  if (layer?.highlightStyle) {
    return layer.highlightStyle;
  }

  const fillColor = Color.fromCssColorString(defaultFillColor).withAlpha(0.8);
  if (feature instanceof Feature) {
    let style = feature.getStyle() ?? layer?.style?.style;
    if (typeof style === 'function') {
      style = style(feature, 1);
    }
    return getHighlightStyleFromStyle(style, fillColor);
  }
  return fromCesiumColor(fillColor);
}

/**
 * @param {import("ol").Feature} clusterFeature
 * @param {import("@vcmap/core").VectorClusterGroup} clusterGroup
 * @param {import("ol/style/Style.js").default} clusterStyle
 * @param {string} defaultFillColor
 * @returns {import("ol/style/Style.js").default}
 */
export function getClusterHighlightStyle(
  clusterFeature,
  clusterGroup,
  clusterStyle,
  defaultFillColor,
) {
  if (clusterGroup?.highlightStyle) {
    return clusterGroup.getHighlightStyleForFeature(clusterFeature);
  }

  const fillColor = Color.fromCssColorString(defaultFillColor).withAlpha(0.8);
  return getHighlightStyleFromStyle(clusterStyle, fillColor);
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("ol").Feature} feature
 * @returns {import("./abstractFeatureInfoView.js").default|null}
 */
export function getFeatureInfoViewForFeature(app, feature) {
  if (feature[featureInfoViewSymbol]) {
    return feature[featureInfoViewSymbol];
  }
  const layer = app.layers.getByKey(feature[vcsLayerName]);
  const name = layer?.properties?.featureInfo;
  if (!name) {
    getLogger().debug(
      `No view has been configured for layer '${layer?.name}'.`,
    );
    return null;
  }
  if (!app.featureInfo.hasKey(name)) {
    getLogger().warning(`No view with name '${name}' has been registered.`);
    return null;
  }
  return app.featureInfo.getByKey(name);
}

/**
 * Returns a VcsGroupedListItem for each provided feature and corresponding groups
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").EventFeature[]} features
 * @param {import("ol/coordinate.js").Coordinate?} position
 * @returns {{
 *   groups: import("../components/lists/VcsGroupedList.vue").VcsListGroup,
 *   items: import("../components/lists/VcsGroupedList.vue").VcsGroupedListItem,
 * }}
 */
export function getGroupedFeatureList(app, features, position = undefined) {
  const groups = {};
  const items = features.map((f) => {
    const oFeature = f[originalFeatureSymbol] ?? f;
    let actions;
    if (oFeature instanceof Feature) {
      actions = [
        createZoomToFeatureAction(
          { name: 'zoomToFeature', icon: 'mdi-target' },
          oFeature,
          app.maps,
        ),
      ];
    }
    /** @type {import("../components/lists/VcsListItemComponent.vue").VcsListItem} */
    const listItem = reactive({
      name: oFeature.getId(),
      title:
        oFeature.getAttributes()?.title ||
        oFeature.getAttributes()?.name ||
        oFeature.getId(),
      disabled: !getFeatureInfoViewForFeature(app, oFeature),
      selectionChanged: (value) => {
        if (value) {
          app.featureInfo
            .selectFeature(oFeature, position)
            .catch((e) => getLogger().error(e));
        } else {
          app.featureInfo.clearFeature();
        }
      },
      actions,
    });
    const layerName = oFeature[vcsLayerName];
    if (layerName) {
      if (!groups[layerName]) {
        const title = app.layers.getByKey(layerName)?.properties?.title;
        groups[layerName] = { name: layerName, title: title || layerName };
      }
      listItem.group = layerName;
    }
    return listItem;
  });
  return { groups: Object.values(groups), items };
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

  return { stopped, stop };
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @returns {function():void}
 */
function setupFeatureInfoTool(app) {
  /** @type {FeatureInfoSession|null} */
  let session = null;

  const action = reactive({
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
          action.active = false;
          session = null;
          app.featureInfo.clearSelection();
          action.title = 'featureInfo.activateToolTitle';
        });
        this.active = true;
        action.title = 'featureInfo.deactivateToolTitle';
      }
    },
  });

  function addFeatureInfoButton() {
    if (
      app.uiConfig.getByKey('startingFeatureInfo')?.value !== false &&
      !action.active
    ) {
      action.callback();
    }
    if (!app.toolboxManager.has('featureInfo')) {
      app.toolboxManager.add(
        { id: 'featureInfo', type: ToolboxType.SINGLE, action },
        vcsAppSymbol,
        { desktop: true, tablet: true, mobile: true },
      );
    }
  }

  if (
    [...app.layers].some((l) => l.properties?.featureInfo) ||
    app.search.resultLayer.getFeatures().some((f) => !!f[featureInfoViewSymbol])
  ) {
    addFeatureInfoButton();
  }

  const listeners = [
    app.layers.added.addEventListener((layer) => {
      if (layer?.properties?.featureInfo) {
        addFeatureInfoButton();
      }
    }),
    app.layers.removed.addEventListener(() => {
      if (
        ![...app.layers].some((l) => l.properties?.featureInfo) &&
        !app.search.resultLayer
          .getFeatures()
          .some((f) => !!f[featureInfoViewSymbol]) &&
        app.toolboxManager.has('featureInfo')
      ) {
        app.toolboxManager.remove('featureInfo');
      }
    }),
    app.search.resultsChanged.addEventListener(() => {
      if (
        app.search.resultLayer
          .getFeatures()
          .some((f) => !!f[featureInfoViewSymbol])
      ) {
        addFeatureInfoButton();
      } else if (
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
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("./balloonFeatureInfoView.js").BalloonFeatureInfoViewProps} props
 * @returns {() => void}
 */
function setupBalloonHeightListener(app, props) {
  let updateHeightListener = () => {};
  function setupUpdateHeightListener(map) {
    updateHeightListener();
    if (map instanceof CesiumMap) {
      const cartesian = mercatorToCartesian(props.position);
      const cartographic = Cartographic.fromCartesian(cartesian);
      const scene = map.getScene();
      cartographic.height =
        scene.getHeight(cartographic, props.heightReference) +
        props.heightOffset;
      props.position.splice(
        0,
        Infinity,
        ...cartesianToMercator(Cartographic.toCartesian(cartographic)),
      );

      updateHeightListener = scene.updateHeight(
        cartographic,
        (clampedCartographic) => {
          const pos = cartesianToMercator(
            Cartographic.toCartesian(clampedCartographic),
          );
          pos[2] += props.heightOffset;
          props.position.splice(0, Infinity, ...pos);
        },
        props.heightReference,
      );
    }
  }
  setupUpdateHeightListener(app.maps.activeMap);
  const mapActivatedListener = app.maps.mapActivated.addEventListener((map) => {
    setupUpdateHeightListener(map);
  });

  return () => {
    updateHeightListener();
    mapActivatedListener();
  };
}

/**
 * @typedef {Object} FeatureInfoSession
 * @property {VcsEvent<void>} stopped
 * @property {function():void} stop
 */

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
     * @type {string|null}
     * @private
     */
    this._clusterWindowId = null;
    /**
     * @type {import("@vcmap/core").VcsEvent<FeatureType|null>}
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
     * @type {VcsEvent<import("ol").Feature|null>}
     * @private
     */
    this._clusterFeatureChanged = new VcsEvent();
    /**
     * @type {import("ol").Feature|null}
     * @private
     */
    this._selectedClusterFeature = null;
    /**
     * @type {string|null}
     * @private
     */
    this._selectedClusterFeatureId = null;

    /**
     * @type {Array<function():void>}
     * @private
     */
    this._destroyBalloonClampedListener = () => {};
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
          this.clearFeature();
        }
        if (id === this._clusterWindowId) {
          this.clearCluster();
        }
      }),
      this._app.moduleAdded.addEventListener(() => {
        this.clearSelection();
        this._destroyFeatureInfoTool();
        this._destroyFeatureInfoTool = setupFeatureInfoTool(this._app);
      }),
      this._app.moduleRemoved.addEventListener(() => this.clearSelection()),
    ];
    /**
     * A vector layer to render provided features on
     * @type {import("@vcmap/core").VectorLayer|null}
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
   * Emitted whenever a feature is selected or cleared.
   * Does not reflect cluster feature changes!
   * @type {import("@vcmap/core").VcsEvent<null|FeatureType>}
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
   * Emitted whenever a cluster feature is selected or cleared.
   * @type {import("@vcmap/core").VcsEvent<null|import("ol").Feature>}
   */
  get clusterFeatureChanged() {
    return this._clusterFeatureChanged;
  }

  /**
   * @type {null|import("ol").Feature}
   */
  get selectedClusterFeature() {
    return this._selectedClusterFeature;
  }

  /**
   * @type {null|string}
   */
  get selectedClusterFeatureId() {
    return this._selectedClusterFeatureId;
  }

  /**
   * The window id of the current features FeatureInfoView window
   * @type {string|null}
   */
  get windowId() {
    return this._windowId;
  }

  /**
   * The window id of the current cluster feature window
   * @type {string|null}
   */
  get clusterWindowId() {
    return this._clusterWindowId;
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
      this._scratchLayer.activate().catch((e) => {
        getLogger('FeatureInfo').error('Failed to activate scratch layer', e);
      });
    }
  }

  /**
   * @param {FeatureType} feature
   * @returns {null|import("./abstractFeatureInfoView.js").default}
   * @private
   */
  _getFeatureInfoViewForFeature(feature) {
    return getFeatureInfoViewForFeature(this._app, feature);
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
   * @param {import("./abstractFeatureInfoView.js").default=} featureInfoView
   * @returns {Promise<void>}
   */
  async selectFeature(feature, position, windowPosition, featureInfoView) {
    check(
      feature,
      oneOf(Feature, Entity, Cesium3DTileFeature, Cesium3DTilePointFeature),
    );
    check(position, maybe([Number]));
    check(windowPosition, maybe([Number]));
    check(featureInfoView, maybe(AbstractFeatureInfoView));

    const usedFeatureInfoView =
      feature[featureInfoViewSymbol] ??
      featureInfoView ??
      this._getFeatureInfoViewForFeature(feature);
    const layer = this._app.layers.getByKey(feature[vcsLayerName]);

    if (usedFeatureInfoView && layer) {
      this._clearInternal();
      if (
        this._selectedClusterFeature &&
        !this._selectedClusterFeature
          .get('features')
          .map((f) => f[originalFeatureSymbol] ?? f)
          .includes(feature)
      ) {
        this.clearCluster();
      }
      if (feature[isProvidedFeature]) {
        this._ensureScratchLayer();
        // we need to clone the feature to avoid changing vcsLayerNameSymbol on the original feature
        const clonedFeature = feature.clone();
        clonedFeature.setId(feature.getId());
        clonedFeature.set('olcs_allowPicking', true);
        this._scratchLayer.addFeatures([clonedFeature]);
        const featureId = clonedFeature.getId(); // make sure to grab ID after adding it to the layer
        this._scratchLayer.featureVisibility.highlight({
          [featureId]: getHighlightStyle(
            feature,
            layer,
            this._app.uiConfig.config.primaryColor ??
              getDefaultPrimaryColor(this._app),
          ),
        });
        this._clearHighlightingCb = () =>
          this._scratchLayer.featureVisibility.unHighlight([featureId]);
      } else if (layer.vectorClusterGroup) {
        this._ensureScratchLayer();
        const clonedFeature = feature.clone();
        const featureId = feature.getId();
        this._scratchLayer.vectorProperties.setValuesForFeatures(
          layer.vectorProperties.getValuesForFeatures([clonedFeature]),
          [clonedFeature],
        );
        const eyeOffset = clonedFeature.get('olcs_eyeOffset') ?? [0, 0, 0];
        eyeOffset[2] -= 10;
        clonedFeature.set('olcs_eyeOffset', eyeOffset);
        clonedFeature.setId(featureId);
        this._scratchLayer.addFeatures([clonedFeature]);
        this._scratchLayer.featureVisibility.highlight({
          [featureId]: getHighlightStyle(
            feature,
            layer,
            this._app.uiConfig.config.primaryColor ??
              getDefaultPrimaryColor(this._app),
          ),
        });
        this._clearHighlightingCb = () =>
          this._scratchLayer.featureVisibility.unHighlight([clonedFeature]);
      } else if (layer.featureVisibility) {
        const featureId = feature.getId();
        layer.featureVisibility.highlight({
          [featureId]: getHighlightStyle(
            feature,
            layer,
            this._app.uiConfig.config.primaryColor ??
              getDefaultPrimaryColor(this._app),
          ),
        });
        this._clearHighlightingCb = () =>
          layer.featureVisibility.unHighlight([featureId]);
      }
      this._windowId = usedFeatureInfoView.className; // use className for a type based position caching
      const windowComponentOptions =
        usedFeatureInfoView.getWindowComponentOptions(
          this._app,
          { feature, position, windowPosition },
          layer,
        );

      let { props } = windowComponentOptions;
      // check if Balloon should be Rendered Relative or ClampedTo Ground
      if (usedFeatureInfoView instanceof BalloonFeatureInfoView) {
        props = reactive(props);
        if (
          windowComponentOptions.props.heightReference !== HeightReference.NONE
        ) {
          this._destroyBalloonClampedListener = setupBalloonHeightListener(
            this._app,
            props,
          );
        }
      }
      this._app.windowManager.add(
        { id: this._windowId, ...windowComponentOptions, props },
        vcsAppSymbol,
      );

      this._selectedFeature = feature;
      this._selectedFeatureId = feature.getId();
      this._featureChanged.raiseEvent(this._selectedFeature);
    } else {
      this.clearSelection();
    }
  }

  /**
   * Selecting a cluster feature opens a window listing the features belonging to the cluster feature.
   * To be listed the feature must meet the following criteria: a) the feature must be part of a layer, b) said layer must be managed in
   * the same VcsApp as provided to the FeatureInfo on construction. if not providing a feature info view, then c) said layer must have a featureInfo property set on
   * its properties bag and d) said featureInfo property must provide the name of a FeatureInfoView present on this FeatureInfos
   * collection.
   * The cluster feature will be cloned, highlighted and added on an internal scratch layer to ensure availability until deselection.
   * The original cluster feature will be hidden until deselection.
   * @param {import("ol").Feature} clusterFeature
   * @param {import("ol/coordinate.js").Coordinate} position
   * @returns {Promise<void>}
   */
  async selectClusterFeature(clusterFeature, position) {
    this.clearFeature();
    this._clearClusterInternal();
    const id = `cluster-at-${clusterFeature.getGeometry().getCoordinates().join('-')}`;

    this._ensureScratchLayer();
    const clonedFeature = clusterFeature.clone();
    clonedFeature.setId(id);

    clusterFeature[hidden] = true;
    clusterFeature.changed();

    const fillColor =
      this._app.uiConfig.config.primaryColor ??
      getDefaultPrimaryColor(this._app);

    if (clusterFeature[vectorClusterGroupName]) {
      const clusterGroup = this._app.vectorClusterGroups.getByKey(
        clusterFeature[vectorClusterGroupName],
      );
      this._scratchLayer.vectorProperties.setValuesForFeatures(
        clusterGroup.vectorProperties.getValuesForFeatures([clonedFeature]),
        [clonedFeature],
      );
      const clusterStyle = clusterGroup.styleFunction(clusterFeature, 1);
      const highlightStyle = getClusterHighlightStyle(
        clusterFeature,
        clusterGroup,
        clusterStyle,
        fillColor,
      );
      clonedFeature.setStyle(highlightStyle);
    } else if (clusterFeature[isProvidedClusterFeature]) {
      clonedFeature.setStyle(
        fromCesiumColor(Color.fromCssColorString(fillColor)).style,
      );
    }

    if (this._app.maps.activeMap instanceof ObliqueMap) {
      clonedFeature.getGeometry()[alreadyTransformedToImage] = true;
    }
    this._scratchLayer.addFeatures([clonedFeature]);

    const features = clusterFeature.get('features');
    const { items, groups } = getGroupedFeatureList(
      this._app,
      features,
      position,
    );

    this._clusterWindowId = id;
    this._app.windowManager.add(
      {
        id,
        component: ClusterFeatureComponent,
        props: reactive({ items, groups }),
        state: { headerTitle: 'featureInfo.cluster.headerTitle' },
        slot: WindowSlot.DYNAMIC_LEFT,
      },
      vcsAppSymbol,
    );

    this._selectedClusterFeature = clusterFeature;
    this._selectedClusterFeatureId = id;
    this._clusterFeatureChanged.raiseEvent(this._selectedClusterFeature);
  }

  /**
   * Clears the current feature. remove window, highlighting and provided feature.
   * @private
   */
  _clearInternal() {
    this._destroyBalloonClampedListener();
    if (this._clearHighlightingCb) {
      this._clearHighlightingCb();
      this._clearHighlightingCb = null;
    }
    if (this._windowId) {
      this._app.windowManager.remove(this._windowId);
      this._windowId = null;
    }
    if (this._scratchLayer && this._selectedFeatureId) {
      this._scratchLayer.removeFeaturesById([this._selectedFeatureId]);
    }
  }

  /**
   * Clears the current cluster feature. remove window, highlighting and provided cluster feature.
   * @private
   */
  _clearClusterInternal() {
    if (this._clusterWindowId) {
      this._app.windowManager.remove(this._clusterWindowId);
      this._clusterWindowId = null;
    }

    if (this._selectedClusterFeature) {
      this._selectedClusterFeature[hidden] = false;
      this._selectedClusterFeature.changed();

      if (this._scratchLayer) {
        this._scratchLayer.removeFeaturesById([this._selectedClusterFeatureId]);
      }
    }
  }

  /**
   * Deselecting feature clears highlighting and closes FeatureInfoView. fires feature changed with null
   */
  clearFeature() {
    this._clearInternal();
    if (this._selectedFeature) {
      this._selectedFeature = null;
      this._selectedFeatureId = null;
      this._featureChanged.raiseEvent(this._selectedFeature);
    }
  }

  /**
   * Deselecting and removing cluster feature. Closing cluster window and fires cluster feature changed with null
   */
  clearCluster() {
    this._clearClusterInternal();
    if (this._selectedClusterFeature) {
      this._selectedClusterFeature[hidden] = false;
      this._selectedClusterFeature = null;
      this._clusterFeatureChanged.raiseEvent(this._selectedClusterFeature);
    }
  }

  /**
   * @deprecated
   */
  clear() {
    getLogger().deprecate(
      'clear',
      'Use clearSelection instead. Clear will clear the FeatureInfo collection removing all registered FeatureInfoViews in feature.',
    );
    this.clearSelection();
  }

  /**
   * Clears selection by deselecting current feature and cluster and closing all related windows.
   * Fires feature changed and cluster feature changed events with null.
   */
  clearSelection() {
    this.clearFeature();
    this.clearCluster();
  }

  /**
   * Destroys the feature info and all its events & listeners
   */
  destroy() {
    super.destroy();
    this._clearInternal();
    this._clearClusterInternal();
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
  IframeWmsFeatureInfoView.className,
  IframeWmsFeatureInfoView,
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
  MarkdownBalloonFeatureInfoView.className,
  MarkdownBalloonFeatureInfoView,
);
featureInfoClassRegistry.registerClass(
  MarkdownFeatureInfoView.className,
  MarkdownFeatureInfoView,
);
