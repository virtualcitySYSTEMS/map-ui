import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import VcsTable from '../components/tables/VcsTable.vue';

/**
 * @typedef {FeatureInfoViewOptions} TableFeatureInfoViewOptions
 * @property {number} [itemsPerPage=10] - default has to be one of itemsPerPageArray
 * @property {number[]} [itemsPerPageArray=[5, 10, 15]]
 * @property {boolean} [showSearchbar]
 * @property {string} [searchbarPlaceholder]
 */

/**
 * @typedef {FeatureInfoProps} TableFeatureInfoViewProps
 * @property {number} [itemsPerPage=10]
 * @property {number[]} [itemsPerPageArray=[5, 10, 15]]
 * @property {boolean} [showGroupBtn]
 * @property {boolean} [showSearchbar]
 * @property {string} [searchbarPlaceholder]
 */

/**
 * @class
 * @description A table view for feature attributes
 * @extends {AbstractFeatureInfoView}
 */
class TableFeatureInfoView extends AbstractFeatureInfoView {
  /**
   * @type {string}
   */
  static get className() { return 'TableFeatureInfoView'; }

  /** @returns {TableFeatureInfoViewOptions} */
  static getDefaultOptions() {
    return {
      itemsPerPageArray: [5, 10, 15],
      itemsPerPage: 10,
      showSearchbar: true,
    };
  }

  /**
   * @param {TableFeatureInfoViewOptions} options
   */
  constructor(options) {
    super(options, VcsTable);
    const defaultOptions = TableFeatureInfoView.getDefaultOptions();
    /**
     * @type {number[]}
     */
    this.itemsPerPageArray = options.itemsPerPageArray || defaultOptions.itemsPerPageArray;

    const itemsPerPage = options.itemsPerPage || defaultOptions.itemsPerPage;
    /**
     * @type {number}
     */
    this.itemsPerPage = this.itemsPerPageArray.includes(itemsPerPage) ? itemsPerPage : this.itemsPerPageArray[0];
    /**
     * @type {boolean}
     */
    this.showSearchbar = options.showSearchbar || defaultOptions.showSearchbar;
    /**
     * @type {string}
     */
    this.searchbarPlaceholder = options.searchbarPlaceholder;
  }

  /**
   * @param {FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {TableFeatureInfoViewProps}
   */
  getProperties(featureInfo, layer) {
    const properties = super.getProperties(featureInfo, layer);
    return {
      ...properties,
      itemsPerPage: this.itemsPerPage,
      itemsPerPageArray: this.itemsPerPageArray,
      showSearchbar: this.showSearchbar,
      searchbarPlaceholder: this.searchbarPlaceholder,
    };
  }

  /**
   * @returns {TableFeatureInfoViewOptions}
   */
  toJSON() {
    const config = super.toJSON();
    const defaultOptions = TableFeatureInfoView.getDefaultOptions();
    if (this.itemsPerPageArray.length !== defaultOptions.itemsPerPageArray.length ||
      this.itemsPerPageArray.some((e, idx) => e !== defaultOptions.itemsPerPageArray[idx])) {
      config.itemsPerPageArray = this.itemsPerPageArray;
    }
    if (this.itemsPerPage !== defaultOptions.itemsPerPage) {
      config.itemsPerPage = this.itemsPerPage;
    }
    if (this.showSearchbar !== defaultOptions.showSearchbar) {
      config.showSearchbar = this.showSearchbar;
    }
    if (this.searchbarPlaceholder) {
      config.searchbarPlaceholder = this.searchbarPlaceholder;
    }
    return config;
  }
}

export default TableFeatureInfoView;
