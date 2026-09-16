import {
  type Layer,
  type WMSFeatureProvider,
  getMetersPerDegreeAtCoordinate,
  mercatorProjection,
} from '@vcmap/core';
import { parseBoolean } from '@vcsuite/parsers';
import { get as getOlProj, getTransform } from 'ol/proj.js';
import type VcsUiApp from '../vcsUiApp.js';
import AbstractFeatureInfoView, {
  type FeatureInfoViewOptions,
} from './abstractFeatureInfoView.js';
import IframeComponent from './IframeComponent.ts.vue';
import { getBalloonPositionFromFeature } from './balloonHelper.js';
import type { FeatureInfoEvent } from './featureInfo.js';
import type { WindowComponentOptions } from '../manager/window/windowManager.js';
import type { IframeFeatureInfoViewProps } from './iframeFeatureInfoView.js';

type IframeWmsFeatureInfoViewOptions = FeatureInfoViewOptions & {
  /** Specifies the response format of WMS GetFeatureInfo */
  infoFormat: string;
  /** optional title for the <iframe> */
  title?: string;
  /** optional sandbox attribute for the <iframe> */
  sandbox?: string;
  /** optional flag to disable the sandbox attribute for the <iframe> */
  disableSandbox?: boolean;
};

/**
 * @description An iframe view.
 */
class IframeWmsFeatureInfoView extends AbstractFeatureInfoView<IframeFeatureInfoViewProps> {
  static get className(): string {
    return 'IframeWmsFeatureInfoView';
  }

  static getDefaultOptions(): IframeWmsFeatureInfoViewOptions {
    return {
      ...AbstractFeatureInfoView.getDefaultOptions(),
      infoFormat: 'text/html',
      title: undefined,
      sandbox: '',
      disableSandbox: false,
    };
  }

  infoFormat: string;
  title?: string;
  sandbox?: string;
  disableSandbox: boolean;

  constructor(options: IframeWmsFeatureInfoViewOptions) {
    super(options, IframeComponent);
    const defaultOptions = IframeWmsFeatureInfoView.getDefaultOptions();

    this.infoFormat = options.infoFormat || defaultOptions.infoFormat;
    this.title = options.title;
    this.sandbox = options.sandbox || defaultOptions.sandbox;
    this.disableSandbox = parseBoolean(
      options.disableSandbox,
      defaultOptions.disableSandbox,
    );
  }

  getWindowComponentOptions(
    app: VcsUiApp,
    featureInfo: FeatureInfoEvent,
    layer: Layer,
  ): WindowComponentOptions {
    const position = getBalloonPositionFromFeature(
      featureInfo.feature,
      layer,
      featureInfo.position,
    );
    const componentOptions = super.getWindowComponentOptions(
      app,
      featureInfo,
      layer,
    );
    const resolution = app.maps.activeMap!.getCurrentResolution(
      position.position!,
    );

    let res = resolution;
    const projection = (
      layer.featureProvider as WMSFeatureProvider
    ).wmsSource.getProjection()!;
    const transform = getTransform(mercatorProjection.proj, projection);
    const coords = transform(position.position!.slice());
    if (projection.getUnits() === 'degrees') {
      const metersPerDegree = getMetersPerDegreeAtCoordinate(coords);
      res = resolution / metersPerDegree;
    }
    componentOptions.props!.src = (
      layer.featureProvider as WMSFeatureProvider
    ).wmsSource.getFeatureInfoUrl(coords, res, projection, {
      INFO_FORMAT: this.infoFormat,
    });
    return componentOptions;
  }

  /**
   * Gets feature info from WMS GetFeatureInfo in html/text format
   */
  getProperties(
    featureInfo: FeatureInfoEvent,
    layer: Layer,
  ): IframeFeatureInfoViewProps {
    const properties = super.getProperties(featureInfo, layer);
    return {
      ...properties,
      src:
        (
          layer.featureProvider as WMSFeatureProvider
        )?.wmsSource.getFeatureInfoUrl(
          featureInfo.position!,
          // no correct resolution available due to missing app.
          // Thats why same is done in `getWindowComponentOptions` to override the src with correct url
          1,
          getOlProj('EPSG:3857')!,
          { INFO_FORMAT: this.infoFormat },
        ) ?? '',
      title: this.title,
      ...(!this.disableSandbox && { sandbox: this.sandbox }),
    };
  }

  toJSON(
    defaultOptions: IframeWmsFeatureInfoViewOptions = IframeWmsFeatureInfoView.getDefaultOptions(),
  ): IframeWmsFeatureInfoViewOptions {
    const config = super.toJSON(
      defaultOptions,
    ) as IframeWmsFeatureInfoViewOptions;
    if (this.infoFormat !== defaultOptions.infoFormat) {
      config.infoFormat = this.infoFormat;
    }
    if (this.title !== defaultOptions.title) {
      config.title = this.title;
    }
    if (this.sandbox !== defaultOptions.sandbox) {
      config.sandbox = this.sandbox;
    }
    if (this.disableSandbox !== defaultOptions.disableSandbox) {
      config.disableSandbox = this.disableSandbox;
    }
    return config;
  }
}

export default IframeWmsFeatureInfoView;
