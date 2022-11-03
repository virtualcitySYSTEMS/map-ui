import { Extent, parseGeoJSON, wgs84Projection } from '@vcmap/core';
import { AddressBalloonFeatureInfoView, featureInfoViewSymbol } from '@vcmap/ui';

/**
 *
 * @param {Object} item - response item from the search request
 * @returns {ResultItem}
 */
function createResultItem(item) {
  const data = parseGeoJSON(item.geojson);
  const feature = data.features[0];
  feature.setProperties(item.address);
  const title = item.display_name;
  feature[featureInfoViewSymbol] = new AddressBalloonFeatureInfoView({
    type: 'AddressBalloonFeatureInfoView',
    name: 'NominatimSearchBalloon',
    balloonSubtitle: '',
    addressName: 'building',
    street: 'road',
    number: 'house_number',
    city: 'city',
    zip: 'postcode',
    country: 'country',
  });

  return {
    title,
    feature,
  };
}

/**
 * @typedef {Object} NominatimSearchOptions
 * @property {string} [name="Nominatim"]
 * @property {string} [url="https://nominatim.openstreetmap.org/search"]
 * @property {string|undefined} city
 * @property {string|undefined} state
 * @property {string|undefined} [countrycode="de"]
 * @property {import("@vcmap/core").Extent.Options|undefined} extent
 * @property {number|undefined} [limit=20]
 * @api
 */

/**
 * @class
 * @implements {SearchImpl}
 */
class Nominatim {
  /**
   * @returns {NominatimSearchOptions}
   */
  static getDefaultOptions() {
    return {
      name: 'Nominatim',
      url: 'https://nominatim.openstreetmap.org/search',
      city: undefined,
      state: undefined,
      countrycode: 'de',
      extent: undefined,
      limit: 20,
    };
  }

  /**
   * @param {NominatimSearchOptions} options
   */
  constructor(options) {
    /**
     * @type {NominatimSearchOptions}
     */
    const defaultOptions = Nominatim.getDefaultOptions();

    /** @type {string|null} */
    this.name = options.name ?? defaultOptions.name;

    /** @type {string|Object} */
    this.url = options.url ?? defaultOptions.url;

    /** @type {string|null} */
    this.city = options.city ?? null;

    /** @type {string|null} */
    this.state = options.state ?? null;

    /** @type {string} */
    this.countrycode = options.countrycode ?? defaultOptions.countrycode;

    /** @type {import("@vcmap/core").Extent|null} */
    this.extent = options.extent ? new Extent(options.extent) : null;

    /** @type {number} */
    this.limit = options.limit ?? defaultOptions.limit;
    /**
     * @type {AbortController}
     * @private
     */
    this._controller = new AbortController();
  }

  /**
   * @param {string} q - search value
   * @returns {Array<ResultItem>}
   */
  async search(q) {
    const params = {
      q,
      countrycodes: this.countrycode,
      format: 'json',
      polygon_geojson: 1,
      addressdetails: 1,
      limit: this.limit,
    };

    if (this.city) {
      params.q += `,${this.city}`;
    }

    if (this.state) {
      params.q += `,${this.state}`;
    }

    if (this.extent) {
      params.viewbox = this.extent.getCoordinatesInProjection(wgs84Projection).join(',');
      params.bounded = 1;
    }

    const url = new URL(this.url);
    url.search = new URLSearchParams(params).toString();

    const { signal } = this._controller.signal;
    const response = await fetch(url, { signal });
    const results = await response.json();
    return results.map(createResultItem);
  }

  abort() {
    this._controller.abort();
  }

  toJSON() {
    /**
     * @type {NominatimSearchOptions}
     */
    const defaultOptions = Nominatim.getDefaultOptions();
    const config = {};

    if (this.url !== defaultOptions.url) {
      config.url = this.url;
    }
    if (this.city !== defaultOptions.city) {
      config.city = this.city;
    }
    if (this.state !== defaultOptions.state) {
      config.state = this.state;
    }
    if (this.countrycode !== defaultOptions.countrycode) {
      config.countrycode = this.countrycode;
    }
    if (this.extent && this.extent !== defaultOptions.extent) {
      config.extent = this.extent.toJSON();
    }
    if (this.limit !== defaultOptions.limit) {
      config.limit = this.limit;
    }

    return config;
  }
}

export default Nominatim;
