import { type Layer, renderTemplate } from '@vcmap/core';
import { parseBoolean } from '@vcsuite/parsers';
import AbstractFeatureInfoView, {
  type FeatureInfoProps,
  type FeatureInfoViewOptions,
} from './abstractFeatureInfoView.js';
import IframeComponent from './IframeComponent.ts.vue';
import type { FeatureInfoEvent } from './featureInfo.js';

type IframeFeatureInfoViewOptions = FeatureInfoViewOptions & {
  /** Specifies the address of the document to embed in the <iframe>. Variables wrapped in `${}` are replaced by their values, e.g. `${featureId}` or `${gml:name}` */
  src: string;
  /** optional title for the <iframe> */
  title?: string;
  /** optional sandbox attribute for the <iframe> */
  sandbox?: string;
  /** optional flag to disable the sandbox attribute for the <iframe> */
  disableSandbox?: boolean;
};

export type IframeFeatureInfoViewProps = FeatureInfoProps & {
  src: string;
  title?: string;
  sandbox?: string;
};

/**
 * @description An iframe view.
 */
class IframeFeatureInfoView extends AbstractFeatureInfoView<IframeFeatureInfoViewProps> {
  static get className(): string {
    return 'IframeFeatureInfoView';
  }

  static getDefaultOptions(): IframeFeatureInfoViewOptions {
    return {
      ...AbstractFeatureInfoView.getDefaultOptions(),
      src: '',
      title: undefined,
      sandbox: '',
      disableSandbox: false,
    };
  }

  src: string;
  title?: string;
  sandbox?: string;
  disableSandbox: boolean;

  constructor(options: IframeFeatureInfoViewOptions) {
    super(options, IframeComponent);
    const defaultOptions = IframeFeatureInfoView.getDefaultOptions();

    this.src = options.src || defaultOptions.src;
    this.title = options.title;
    this.sandbox = options.sandbox || defaultOptions.sandbox;
    this.disableSandbox = parseBoolean(
      options.disableSandbox,
      defaultOptions.disableSandbox,
    );
  }

  protected _renderTemplate(attributes: Record<string, unknown>): string {
    return renderTemplate(this.src, attributes);
  }

  getProperties(
    featureInfo: FeatureInfoEvent,
    layer: Layer,
  ): IframeFeatureInfoViewProps {
    const properties = super.getProperties(featureInfo, layer);
    return {
      ...properties,
      src: this._renderTemplate({
        ...properties,
        ...properties.attributes,
      }),
      title: this.title,
      ...(!this.disableSandbox && { sandbox: this.sandbox }),
    };
  }

  /**
   * @param {IframeFeatureInfoViewOptions} defaultOptions
   * @returns {IframeFeatureInfoViewOptions}
   */
  toJSON(
    defaultOptions: IframeFeatureInfoViewOptions = IframeFeatureInfoView.getDefaultOptions(),
  ): IframeFeatureInfoViewOptions {
    const config = super.toJSON(defaultOptions) as IframeFeatureInfoViewOptions;
    if (this.src !== defaultOptions.src) {
      config.src = this.src;
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

export default IframeFeatureInfoView;
