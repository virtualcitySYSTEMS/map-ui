import { parseBoolean } from '@vcsuite/parsers';
import { AbstractFeatureInfoView } from '@vcmap/ui';
import SimpleGraphComponent from './SimpleGraphComponent.vue';

/**
 * @typedef {FeatureInfoViewOptions} SimpleGraphFeatureInfoViewOptions
 * @property {string[]|number[]} [labels] - optional array of strings labeling all data points
 * @property {string} [graph='trend'] - Choose between a trendline or bars
 * @property {string} [color='primary'] - optional color of the sparkline of the graph
 * @property {string[]} [gradient] - optional array of colors to use as a linear-gradient
 * @property {boolean} [fill=false] - if true, filled area below sparkline
 * @property {number|string} [smooth=8] - optional number of px to use as a corner radius
 */

/**
 * @class
 * @description A graph view.
 */
class SimpleGraphView extends AbstractFeatureInfoView {
  /**
   * @type {string}
   */
  static get className() {
    return 'SimpleGraphView';
  }

  /**
   * @param {SimpleGraphFeatureInfoViewOptions} options
   */
  constructor(options) {
    super(options, SimpleGraphComponent);
    /**
     * @type {string[]|number[]}
     */
    this.labels = options.labels || [];
    /**
     * @type {string}
     */
    this.graph = options.graph || 'trend';
    /**
     * @type {string}
     */
    this.color = options.color || 'primary';
    /**
     * @type {string[]}
     */
    this.gradient = options.gradient || [];
    /**
     * @type {boolean}
     */
    this.fill = parseBoolean(options.fill, false);
    /**
     * @type {number|string}
     */
    this.smooth = options.smooth ?? 8;
  }

  /**
   * @param {FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {FeatureInfoProps}
   */
  getProperties({ feature }, layer) {
    return {
      featureId: feature.getId(),
      layerName: layer.name,
      attributes: this.getAttributes(feature),
      labels: this.labels,
      graph: this.graph,
      color: this.color,
      gradient: this.gradient,
      fill: this.fill,
      smooth: this.smooth,
    };
  }
}

export default SimpleGraphView;
