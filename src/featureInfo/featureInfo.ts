import {
  CesiumMap,
  ClassRegistry,
  Collection,
  type EventFeature,
  EventType,
  type Layer,
  ObliqueMap,
  PanoramaMap,
  VcsEvent,
  type VcsMap,
  type VectorClusterGroup,
  VectorLayer,
  VectorStyleItem,
  alreadyTransformedToImage,
  cartesianToMercator,
  fromCesiumColor,
  getDefaultVectorStyleItemOptions,
  hidden,
  isProvidedClusterFeature,
  isProvidedFeature,
  markVolatile,
  maxZIndex,
  mercatorProjection,
  mercatorToCartesian,
  originalFeatureSymbol,
  panoramaFeature,
  vcsLayerName,
  vectorClusterGroupName,
} from '@vcmap/core';
import { type Logger, getLogger as getLoggerByName } from '@vcsuite/logger';
import {
  Cartographic,
  Cesium3DTileFeature,
  Cesium3DTilePointFeature,
  Color,
  Entity,
  HeightReference,
} from '@vcmap-cesium/engine';
import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate.js';
import { check, maybe, oneOf } from '@vcsuite/check';
import { reactive } from 'vue';
import type { Style } from 'ol/style.js';
import type { Point } from 'ol/geom.js';
import type VcsUiApp from '../vcsUiApp.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import FeatureInfoInteraction from './featureInfoInteraction.js';
import AbstractFeatureInfoView, {
  type FeatureInfoProps,
} from './abstractFeatureInfoView.js';
import TableFeatureInfoView from './tableFeatureInfoView.js';
import IframeFeatureInfoView from './iframeFeatureInfoView.js';
import AddressBalloonFeatureInfoView from './addressBalloonFeatureInfoView.js';
import BalloonFeatureInfoView, {
  type BalloonFeatureInfoViewProps,
} from './balloonFeatureInfoView.js';
import MarkdownFeatureInfoView from './markdownFeatureInfoView.js';
import { getDefaultPrimaryColor } from '../vuePlugins/vuetify.js';
import { ToolboxType } from '../manager/toolbox/toolboxManager.js';
import MarkdownBalloonFeatureInfoView from './markdownBalloonFeatureInfoView.js';
import IframeWmsFeatureInfoView from './iframeWmsFeatureInfoView.js';
import ClusterFeatureComponent from './ClusterFeatureComponent.ts.vue';
import {
  type VcsAction,
  createZoomToFeatureAction,
} from '../actions/actionHelper.js';
import type {
  VcsGroupedListItem,
  VcsListGroup,
} from '../components/lists/VcsGroupedList.ts.vue';

/**
 * Symbol added to features to overwrite the layers predefined feature info
 */
export const featureInfoViewSymbol = Symbol('featureInfoView');

type FeatureType = EventFeature & {
  [featureInfoViewSymbol]?: AbstractFeatureInfoView;
};

export type FeatureInfoEvent = {
  feature: EventFeature;
  /** potential position to place the balloon at */
  position?: Coordinate;
  /** potential window position to initially place the balloon at */
  windowPosition?: Coordinate;
};

function getLogger(): Logger {
  return getLoggerByName('featureInfo');
}

export const featureInfoClassRegistry = new ClassRegistry<
  typeof AbstractFeatureInfoView<FeatureInfoProps>
>();

export function getHighlightStyleFromStyle(
  style: Style,
  fillColor: Color,
): Style {
  const highlightStyle =
    style?.clone?.() ??
    new VectorStyleItem(getDefaultVectorStyleItemOptions()).style;
  if (highlightStyle.getText()) {
    if (highlightStyle.getText()?.getFill()) {
      highlightStyle
        .getText()!
        .getFill()!
        .setColor(fillColor.toCssColorString());
    }
    highlightStyle
      .getText()!
      .setScale(((highlightStyle.getText()!.getScale() as number) ?? 1) * 2);
  }
  if (highlightStyle.getImage()) {
    highlightStyle
      .getImage()!
      .setScale((highlightStyle.getImage()!.getScale() as number) * 2);
  }
  if (highlightStyle.getStroke()) {
    highlightStyle.getStroke()!.setColor(fillColor.toCssColorString());
    highlightStyle
      .getStroke()!
      .setWidth((highlightStyle.getStroke()!.getWidth() as number) * 2);
  }
  if (highlightStyle.getFill()) {
    const color = fillColor.toBytes();
    color[3] /= 255;
    highlightStyle.getFill()!.setColor(color);
  }
  return highlightStyle;
}

export function getHighlightStyle(
  feature: EventFeature,
  layer: Layer,
  defaultFillColor: string,
): Style | VectorStyleItem {
  if ((layer as VectorLayer)?.highlightStyle) {
    return (layer as VectorLayer).highlightStyle!;
  }

  const fillColor = Color.fromCssColorString(defaultFillColor).withAlpha(0.8);
  if (feature instanceof Feature) {
    let style = feature.getStyle() ?? (layer as VectorLayer)?.style?.style;
    if (typeof style === 'function') {
      style = style(feature, 1) as Style;
    }
    return getHighlightStyleFromStyle(style as Style, fillColor);
  }
  return fromCesiumColor(fillColor);
}

export function getClusterHighlightStyle(
  clusterFeature: Feature,
  clusterGroup: VectorClusterGroup,
  clusterStyle: Style,
  defaultFillColor: string,
): Style {
  if (clusterGroup?.highlightStyle) {
    return clusterGroup.getHighlightStyleForFeature(clusterFeature) as Style;
  }

  const fillColor = Color.fromCssColorString(defaultFillColor).withAlpha(0.8);
  return getHighlightStyleFromStyle(clusterStyle, fillColor);
}

export function getFeatureInfoViewForFeature(
  app: VcsUiApp,
  feature: FeatureType,
): AbstractFeatureInfoView | null {
  if (feature[featureInfoViewSymbol]) {
    return feature[featureInfoViewSymbol];
  }
  const layer = app.layers.getByKey(feature[vcsLayerName]);
  const name = layer?.properties?.featureInfo as string | undefined;
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
  return app.featureInfo.getByKey(name) ?? null;
}

/**
 * Returns a VcsGroupedListItem for each provided feature and corresponding groups
 * @param close function to close the window or selection
 */
export function getGroupedFeatureList(
  app: VcsUiApp,
  features: EventFeature[],
  position?: Coordinate,
  close?: () => void,
): {
  groups: VcsListGroup[];
  items: VcsGroupedListItem[];
} {
  const groups: Record<string, VcsListGroup> = {};
  const items = features.map((f) => {
    let actions: Array<VcsAction> = [];
    const oFeature = (f as Feature)[originalFeatureSymbol] ?? f;
    const layerName = oFeature[vcsLayerName]!;
    const attributes = oFeature.getAttributes();
    const layer = app.layers.getByKey(layerName);
    const titlePropName = layer?.properties?.clusterFeatureTitleProperty as
      | string
      | undefined;

    if (oFeature instanceof Feature) {
      actions = [
        createZoomToFeatureAction(
          { name: 'zoomToFeature', icon: 'mdi-target' },
          oFeature,
          app.maps,
        )!,
      ];
    }

    let listItem: VcsGroupedListItem;

    if ((oFeature as Feature)[panoramaFeature]) {
      listItem = reactive({
        name: oFeature.getId() as string,
        group: layerName,
        title: ((titlePropName ? attributes?.[titlePropName] : undefined) ||
          attributes?.title ||
          attributes?.name ||
          String(oFeature.getId())) as string,
        clickedCallbacks: [
          async (): Promise<void> => {
            close?.();
            const { dataset, name, time } = (oFeature as Feature)[
              panoramaFeature
            ]!;
            const panoramaImage = await dataset.createPanoramaImage(name, time);
            if (app.maps.activeMap instanceof PanoramaMap) {
              app.maps.activeMap.setCurrentImage(panoramaImage);
            } else {
              const firstPanoramaMap = app.maps.getByType(
                PanoramaMap.className,
              )[0];
              if (firstPanoramaMap) {
                await app.maps.activatePanoramaMap(
                  firstPanoramaMap as PanoramaMap,
                  panoramaImage,
                );
              }
            }
          },
        ],
        actions,
      });
    } else {
      listItem = reactive({
        name: oFeature.getId() as string,
        group: layerName,
        title: ((titlePropName ? attributes?.[titlePropName] : undefined) ||
          attributes?.title ||
          attributes?.name ||
          String(oFeature.getId())) as string,
        disabled: !getFeatureInfoViewForFeature(app, oFeature),
        selectionChanged: (value) => {
          if (value) {
            app.featureInfo.selectFeature(oFeature, position);
          } else {
            app.featureInfo.clearFeature();
          }
        },
        actions,
      });
    }

    if (layerName) {
      if (!groups[layerName]) {
        const title = layer?.properties?.title as string | undefined;
        groups[layerName] = { name: layerName, title: title || layerName };
      }
    }
    return listItem;
  });

  return { groups: Object.values(groups), items };
}

export function createFeatureInfoSession(app: VcsUiApp): FeatureInfoSession {
  const { eventHandler } = app.maps;
  let stop: (() => void) | null = null;
  const interaction = new FeatureInfoInteraction(app.featureInfo);
  const listener = eventHandler.addExclusiveInteraction(interaction, () => {
    stop?.();
  });
  const currentFeatureInteractionEvent = eventHandler.featureInteraction.active;
  eventHandler.featureInteraction.setActive(EventType.CLICK);

  const stopped = new VcsEvent<void>();
  stop = (): void => {
    listener();
    interaction.destroy();
    eventHandler.featureInteraction.setActive(currentFeatureInteractionEvent);
    stopped.raiseEvent();
    stopped.destroy();
  };

  return { stopped, stop };
}

function setupFeatureInfoTool(app: VcsUiApp): () => void {
  let session: FeatureInfoSession | null = null;

  const action = reactive({
    name: 'featureInfoToggle',
    title: 'featureInfo.activateToolTitle',
    icon: '$vcsInfo',
    active: false,
    callback(): void {
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

  function addFeatureInfoButton(): void {
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
    app.search.resultLayer
      .getFeatures()
      .some((f: FeatureType) => !!f[featureInfoViewSymbol])
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
          .some((f: FeatureType) => !!f[featureInfoViewSymbol]) &&
        app.toolboxManager.has('featureInfo')
      ) {
        app.toolboxManager.remove('featureInfo');
      }
    }),
    app.search.resultsChanged.addEventListener(() => {
      if (
        app.search.resultLayer
          .getFeatures()
          .some((f: FeatureType) => !!f[featureInfoViewSymbol])
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
    listeners.forEach((cb) => {
      cb();
    });
  };
}

function setupBalloonHeightListener(
  app: VcsUiApp,
  props: BalloonFeatureInfoViewProps,
): () => void {
  let updateHeightListener = (): void => {};
  function setupUpdateHeightListener(map: VcsMap | null): void {
    updateHeightListener();
    if (map instanceof CesiumMap) {
      const cartesian = mercatorToCartesian(props.position);
      const cartographic = Cartographic.fromCartesian(cartesian);
      const scene = map.getScene()!;
      cartographic.height =
        scene.getHeight(cartographic, props.heightReference)! +
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

  return (): void => {
    updateHeightListener();
    mapActivatedListener();
  };
}
type FeatureInfoSession = {
  stopped: VcsEvent<void>;
  stop: () => void;
};

/**
 * @description Provides registration of featureInfoClasses and stores featureInfoView instances.
 */
class FeatureInfo extends Collection<AbstractFeatureInfoView> {
  private _app: VcsUiApp;
  private _clearHighlightingCb: (() => void) | null = null;
  private _windowId: string | null = null;
  private _clusterWindowId: string | null = null;
  private _featureChanged = new VcsEvent<EventFeature | null>();
  private _selectedFeature: EventFeature | null = null;
  private _selectedFeatureId: string | null = null;
  private _clusterFeatureChanged = new VcsEvent<Feature<Point> | null>();
  private _selectedClusterFeature: Feature<Point> | null = null;
  private _selectedClusterFeatureId: string | null = null;
  // eslint-disable-next-line class-methods-use-this
  private _destroyBalloonClampedListener: () => void = () => {};
  private _listeners: Array<() => void> = [];
  // eslint-disable-next-line class-methods-use-this
  private _destroyFeatureInfoTool: () => void = () => {};
  /** A vector layer to render provided features on */
  private _scratchLayer: VectorLayer | null = null;

  constructor(app: VcsUiApp) {
    super();

    this._app = app;
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
      this._app.moduleRemoved.addEventListener(() => {
        this.clearSelection();
      }),
    ];
    this._destroyFeatureInfoTool = setupFeatureInfoTool(this._app);
  }

  /**
   * Emitted whenever a feature is selected or cleared.
   * Does not reflect cluster feature changes!
   */
  get featureChanged(): VcsEvent<EventFeature | null> {
    return this._featureChanged;
  }

  get selectedFeature(): EventFeature | null {
    return this._selectedFeature;
  }

  get selectedFeatureId(): string | null {
    return this._selectedFeatureId;
  }

  /**
   * Emitted whenever a cluster feature is selected or cleared.
   */
  get clusterFeatureChanged(): VcsEvent<Feature<
    Point,
    Record<string, unknown>
  > | null> {
    return this._clusterFeatureChanged;
  }

  get selectedClusterFeature(): Feature<Point, Record<string, unknown>> | null {
    return this._selectedClusterFeature;
  }

  get selectedClusterFeatureId(): string | null {
    return this._selectedClusterFeatureId;
  }

  /**
   * The window id of the current features FeatureInfoView window
   */
  get windowId(): string | null {
    return this._windowId;
  }

  /**
   * The window id of the current cluster feature window
   */
  get clusterWindowId(): string | null {
    return this._clusterWindowId;
  }

  private _ensureScratchLayer(): void {
    if (!this._scratchLayer) {
      this._scratchLayer = new VectorLayer({
        zIndex: maxZIndex,
        projection: mercatorProjection.toJSON(),
      });
      markVolatile(this._scratchLayer);
      this._app.layers.add(this._scratchLayer);
      this._scratchLayer.activate().catch((e: unknown) => {
        getLogger().error('Failed to activate scratch layer', e);
      });
    }
  }

  private _getFeatureInfoViewForFeature(
    feature: EventFeature,
  ): AbstractFeatureInfoView | null {
    return getFeatureInfoViewForFeature(this._app, feature);
  }

  /**
   * Selecting a feature highlights said feature and opens a FeatureInfoView, if configured on the layer. For a successful selection,
   * the feature must meet the following criteria: a) the feature must be part of a layer, b) said layer must be managed in
   * the same VcsApp as provided to the FeatureInfo on construction. if not providing a feature info view, then c) said layer must have a featureInfo property set on
   * its properties bag and d) said featureInfo property must provide the name of a FeatureInfoView present on this FeatureInfos
   * collection.
   * If passing a feature create by a FeatureProvider, the feature will be highlighted on an internal scratch layer.
   * @param position - optional clicked position. If not given feature's center point is used to place balloons
   * @param windowPosition - optional clicked window position. If not given derived from position for balloons
   */
  selectFeature(
    feature: FeatureType,
    position?: Coordinate,
    windowPosition?: Coordinate,
    featureInfoView?: AbstractFeatureInfoView,
  ): void {
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
          .map((f: Feature) => f[originalFeatureSymbol] ?? f)
          .includes(feature)
      ) {
        this.clearCluster();
      }

      if ((feature as Feature)[isProvidedFeature]) {
        this._ensureScratchLayer();
        // we need to clone the feature to avoid changing vcsLayerNameSymbol on the original feature
        const clonedFeature = (feature as Feature).clone();
        clonedFeature.setId(feature.getId());
        clonedFeature.set('olcs_allowPicking', true);
        this._scratchLayer!.addFeatures([clonedFeature]);
        const featureId = clonedFeature.getId()!; // make sure to grab ID after adding it to the layer
        this._scratchLayer!.featureVisibility.highlight({
          [featureId]: getHighlightStyle(
            feature,
            layer,
            this._app.uiConfig.config.primaryColor ??
              getDefaultPrimaryColor(this._app),
          ),
        });
        this._clearHighlightingCb = (): void => {
          this._scratchLayer!.featureVisibility.unHighlight([featureId]);
        };
      } else if ((layer as VectorLayer).vectorClusterGroup) {
        this._ensureScratchLayer();
        const clonedFeature = (feature as Feature).clone();
        const featureId = feature.getId()!;
        this._scratchLayer!.vectorProperties.setValuesForFeatures(
          (layer as VectorLayer).vectorProperties.getValuesForFeatures([
            clonedFeature,
          ]),
          [clonedFeature],
        );
        const eyeOffset = clonedFeature.get('olcs_eyeOffset') ?? [0, 0, 0];
        eyeOffset[2] -= 10;
        clonedFeature.set('olcs_eyeOffset', eyeOffset);
        clonedFeature.setId(featureId);
        this._scratchLayer!.addFeatures([clonedFeature]);
        this._scratchLayer!.featureVisibility.highlight({
          [featureId]: getHighlightStyle(
            feature,
            layer,
            this._app.uiConfig.config.primaryColor ??
              getDefaultPrimaryColor(this._app),
          ),
        });
        this._clearHighlightingCb = (): void => {
          this._scratchLayer!.featureVisibility.unHighlight([featureId]);
        };
      } else if ((layer as VectorLayer).featureVisibility) {
        const featureId = feature.getId()!;
        (layer as VectorLayer).featureVisibility.highlight({
          [featureId]: getHighlightStyle(
            feature,
            layer,
            this._app.uiConfig.config.primaryColor ??
              getDefaultPrimaryColor(this._app),
          ),
        });
        this._clearHighlightingCb = (): void => {
          (layer as VectorLayer).featureVisibility.unHighlight([featureId]);
        };
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
        props = reactive(props as BalloonFeatureInfoViewProps);
        if (
          windowComponentOptions.props!.heightReference !== HeightReference.NONE
        ) {
          this._destroyBalloonClampedListener = setupBalloonHeightListener(
            this._app,
            props as BalloonFeatureInfoViewProps,
          );
        }
      }
      this._app.windowManager.add(
        { id: this._windowId, ...windowComponentOptions, props },
        vcsAppSymbol,
      );

      this._selectedFeature = feature;
      this._selectedFeatureId = feature.getId() as string;
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
   */
  selectClusterFeature(
    clusterFeature: Feature<Point>,
    position: Coordinate,
  ): void {
    this.clearFeature();
    this._clearClusterInternal();
    const id = `cluster-at-${clusterFeature.getGeometry()!.getCoordinates().join('-')}`;

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
      )!;
      this._scratchLayer!.vectorProperties.setValuesForFeatures(
        clusterGroup.vectorProperties.getValuesForFeatures([clonedFeature]),
        [clonedFeature],
      );
      const clusterStyle = clusterGroup.styleFunction(
        clusterFeature,
        1,
      ) as Style;
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
      clonedFeature.getGeometry()![alreadyTransformedToImage] = true;
    }
    this._scratchLayer!.addFeatures([clonedFeature]);

    const features = clusterFeature.get('features');
    const { items, groups } = getGroupedFeatureList(
      this._app,
      features,
      position,
      () => {
        this.clearCluster();
      },
    );

    this._clusterWindowId = id;
    this._app.windowManager.add(
      {
        id,
        component: ClusterFeatureComponent,
        props: reactive({ items, groups }),
        state: { headerTitle: 'featureInfo.cluster.headerTitle' },
        slot: 'dynamicLeft',
      },
      vcsAppSymbol,
    );

    this._selectedClusterFeature = clusterFeature;
    this._selectedClusterFeatureId = id;
    this._clusterFeatureChanged.raiseEvent(this._selectedClusterFeature);
  }

  /**
   * Clears the current feature. remove window, highlighting and provided feature.
   */
  private _clearInternal(): void {
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
   */
  private _clearClusterInternal(): void {
    if (this._clusterWindowId) {
      this._app.windowManager.remove(this._clusterWindowId);
      this._clusterWindowId = null;
    }

    if (this._selectedClusterFeature) {
      this._selectedClusterFeature[hidden] = false;
      this._selectedClusterFeature.changed();

      if (this._scratchLayer) {
        this._scratchLayer.removeFeaturesById([
          this._selectedClusterFeatureId!,
        ]);
      }
    }
  }

  /**
   * Deselecting feature clears highlighting and closes FeatureInfoView. fires feature changed with null
   */
  clearFeature(): void {
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
  clearCluster(): void {
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
  clear(): void {
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
  clearSelection(): void {
    this.clearFeature();
    this.clearCluster();
  }

  /**
   * Destroys the feature info and all its events & listeners
   */
  destroy(): void {
    super.destroy();
    this._clearInternal();
    this._clearClusterInternal();
    this._featureChanged.destroy();
    this._destroyFeatureInfoTool();
    if (this._scratchLayer) {
      this._app.layers.remove(this._scratchLayer);
      this._scratchLayer.destroy();
    }
    this._listeners.forEach((cb) => {
      cb();
    });
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
