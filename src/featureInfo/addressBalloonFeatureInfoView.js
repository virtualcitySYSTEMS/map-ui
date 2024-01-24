import BalloonFeatureInfoView, {
  extractNestedKey,
} from './balloonFeatureInfoView.js';
import AddressBalloonComponent from './AddressBalloonComponent.vue';

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoViewOptions &{
 *   addressName?: string|null,
 *   street?: string|null,
 *   number?: string|null,
 *   city?: string|null,
 *   zip?: string|null,
 *   country?: string|null,
 * }} AddressBalloonFeatureInfoViewOptions
 * @property {string|null} [addressName='gml:name'] key to evaluate for name. Use null to suppress
 * @property {string|null} [street='Address.Street'] key to evaluate for street. Use null to suppress
 * @property {string|null} [number='Address.HouseNumber'] key to evaluate for house number. Use null to suppress
 * @property {string|null} [city='Address.City'] key to evaluate for city. Use null to suppress
 * @property {string|null} [zip='Address.ZipCode'] key to evaluate for zip code. Use null to suppress
 * @property {string|null} [country='Address.Country'] key to evaluate for country. Use null to suppress
 */

/**
 * @class
 * @description An balloon view.
 * @extends {BalloonFeatureInfoView}
 */
class AddressBalloonFeatureInfoView extends BalloonFeatureInfoView {
  /**
   * @type {string}
   */
  static get className() {
    return 'AddressBalloonFeatureInfoView';
  }

  /** @returns {AddressBalloonFeatureInfoViewOptions} */
  static getDefaultOptions() {
    return {
      addressName: 'gml:name',
      street: 'Address.Street',
      number: 'Address.HouseNumber',
      city: 'Address.City',
      zip: 'Address.ZipCode',
      country: 'Address.Country',
    };
  }

  /**
   * @param {AddressBalloonFeatureInfoViewOptions} options
   */
  constructor(options) {
    super(options, AddressBalloonComponent);
    const defaultOptions = AddressBalloonFeatureInfoView.getDefaultOptions();

    /**
     * @type {string|null}
     */
    this.addressName =
      options.addressName !== undefined
        ? options.addressName
        : defaultOptions.addressName;
    /**
     * @type {string|null}
     */
    this.street =
      options.street !== undefined ? options.street : defaultOptions.street;
    /**
     * @type {string|null}
     */
    this.number =
      options.number !== undefined ? options.number : defaultOptions.number;
    /**
     * @type {string|null}
     */
    this.city = options.city !== undefined ? options.city : defaultOptions.city;
    /**
     * @type {string|null}
     */
    this.zip = options.zip !== undefined ? options.zip : defaultOptions.zip;
    /**
     * @type {string|null}
     */
    this.country =
      options.country !== undefined ? options.country : defaultOptions.country;
  }

  /**
   * derives address attributes from addressKeys
   * @param {undefined|import("ol").Feature|import("@vcmap-cesium/engine").Cesium3DTileFeature|import("@vcmap-cesium/engine").Cesium3DTilePointFeature} feature
   * @returns {Object}
   */
  getAttributes(feature) {
    const attributes = super.getAttributes(feature);
    const obj = {};
    const applyAddressKeys = (key) => {
      if (this[key]) {
        const derivedValue = extractNestedKey(this[key], attributes);
        if (derivedValue) {
          obj[key] = derivedValue;
        }
      }
    };
    Object.keys(AddressBalloonFeatureInfoView.getDefaultOptions()).forEach(
      (key) => applyAddressKeys(key),
    );
    return obj;
  }

  /**
   * @returns {AddressBalloonFeatureInfoViewOptions}
   */
  toJSON() {
    const config = super.toJSON();
    const defaultOptions = AddressBalloonFeatureInfoView.getDefaultOptions();
    if (this.addressName !== defaultOptions.addressName) {
      config.addressName = this.addressName;
    }
    if (this.street !== defaultOptions.street) {
      config.street = this.street;
    }
    if (this.number !== defaultOptions.number) {
      config.number = this.number;
    }
    if (this.city !== defaultOptions.city) {
      config.city = this.city;
    }
    if (this.zip !== defaultOptions.zip) {
      config.zip = this.zip;
    }
    if (this.country !== defaultOptions.country) {
      config.country = this.country;
    }
    return config;
  }
}

export default AddressBalloonFeatureInfoView;
