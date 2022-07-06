import { VcsObject } from '@vcmap/core';
import { WindowSlot } from '../manager/window/windowManager.js';

/**
 * @typedef {Object} FeatureInfoProps
 * @property {string} featureId
 * @property {string} layerName
 * @property {Object} layerProperties
 * @property {Object} attributes
 */

/**
 * @typedef {Object} FeatureInfoViewOptions
 * @property {string} name - name of view
 * @property {string[]} [attributeKeys] - list of keys to filter attributes of selected feature
 * @property {Object<string,string>} [keyMapping] - object providing text replacements or i18n strings for attribute keys
 * @property {Object<string, string|Object<string,string>>} [valueMapping] - object providing text replacements or i18n strings for attribute values
 * @property {WindowComponentOptions} [window] - state, slot, position can be set. Other options are predefined.
 */

/**
 * Replaces values by new values according to mapping table
 * @param {Object<string, *>} attributes
 * @param {Object<string, string|Object<string,string>>} mapping - value mapping
 */
export function applyValueMapping(attributes, mapping) {
  Object.keys(attributes)
    .forEach((key) => {
      const mappedValue = mapping[key];
      if (mappedValue) {
        const value = attributes[key];
        if (typeof mappedValue === 'string') {
          attributes[key] = mappedValue.replace(/\${value}/g, value);
        } else {
          attributes[key] = mappedValue[value] ?? value;
        }
      }
    });
}

/**
 * Replaces keys by new keys according to mapping table.
 * Deletes old keys!
 * @param {Object<string, *>} attributes
 * @param {Object<string,string>} mapping - key mapping
 */
export function applyKeyMapping(attributes, mapping) {
  Object.keys(attributes).forEach((key) => {
    const newKey = mapping[key];
    if (newKey && newKey !== key) {
      attributes[newKey] = attributes[key];
      delete attributes[key];
    }
  });
}

/**
 * Abstract class to be extended by FeatureInfoView classes
 * Subclasses must always provide a component and may overwrite class methods.
 * @abstract
 * @class
 * @extends {VcsObject}
 */
class AbstractFeatureInfoView extends VcsObject {
  /**
   * @type {string}
   */
  static get className() { return 'AbstractFeatureInfoView'; }

  /** @returns {FeatureInfoViewOptions} */
  static getDefaultOptions() {
    return {
      attributeKeys: [],
      keyMapping: undefined,
      valueMapping: undefined,
      window: {},
    };
  }

  /**
   * @param {FeatureInfoViewOptions} options
   * @param {import("vue").Component} component
   */
  constructor(options, component) {
    super(options);
    const defaultOptions = AbstractFeatureInfoView.getDefaultOptions();
    /**
     * @type {string[]}
     */
    this.attributeKeys = options.attributeKeys || defaultOptions.attributeKeys;
    /**
     * @type {null|Object<string,string>}
     */
    this.keyMapping = options.keyMapping || defaultOptions.keyMapping;
    /**
     * @type {null|Object<string, string|Object<string,string>>}
     */
    this.valueMapping = options.valueMapping || defaultOptions.valueMapping;
    /**
     * @type {WindowComponentOptions|Object}
     * @private
     */
    this._window = options.window || defaultOptions.window;
    /**
     * @type {import("vue").Component|undefined}
     * @private
     */
    this._component = component;
  }

  /**
   * window options, configured in a context, used only internally by AbstractFeatureInfoView or subclass
   * @type {WindowComponentOptions|Object}
   * @readonly
   */
  get window() { return this._window; }

  /**
   * component provided by a FeatureInfoView class, passed to featureInfo via `getWindowComponentOptions()`
   * @type {import("vue").Component|undefined}
   * @readonly
   */
  get component() { return this._component; }

  /**
   * This method returns all relevant attributes for this view.
   * Called by `getProperties()` to pass attributes as props object to the VueComponent of this view.
   * May be overwritten by classes extending AbstractFeatureInfoView.
   * It filters attributes of the feature by keys, performs value and key mapping, if provided.
   * @param {undefined|import("ol").Feature<import("ol/geom/Geometry").default>|import("@vcmap/cesium").Cesium3DTileFeature|import("@vcmap/cesium").Cesium3DTilePointFeature} feature
   * @returns {Object}
   */
  getAttributes(feature) {
    let attributes = feature.getProperty('attributes') || {};
    if (this.attributeKeys.length > 0) {
      attributes = this.attributeKeys.reduce((obj, key) => {
        if (attributes[key]) {
          obj[key] = attributes[key];
        }
        return obj;
      }, {});
    }
    if (this.valueMapping) {
      applyValueMapping(attributes, this.valueMapping);
    }
    if (this.keyMapping) {
      applyKeyMapping(attributes, this.keyMapping);
    }
    return attributes;
  }

  /**
   * This method returns all relevant properties passed to the VueComponent of this view.
   * May be overwritten by classes extending AbstractFeatureInfoView.
   * Called by `getWindowComponentOptions()`.
   * @param {FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {FeatureInfoProps}
   */
  getProperties({ feature, position, windowPosition }, layer) {
    return {
      featureId: feature.getId(),
      layerName: layer.name,
      layerProperties: layer.properties,
      attributes: this.getAttributes(feature),
      position,
      windowPosition,
    };
  }

  /**
   * This method is being called by featureInfo, whenever a new window is created (added to the windowManager).
   * May be overwritten by classes extending AbstractFeatureInfoView.
   * @param {FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {WindowComponentOptions}
   */
  getWindowComponentOptions(featureInfo, layer) {
    return {
      state: this.window.state ?? {
        headerTitle: layer.properties?.title || layer.name,
        headerIcon: '$vcsInfo',
      },
      slot: this.window.slot ?? WindowSlot.DYNAMIC_LEFT,
      component: this.component,
      position: this.window.position,
      props: this.getProperties(featureInfo, layer),
    };
  }

  /**
   * @returns {FeatureInfoViewOptions}
   */
  toJSON() {
    const config = super.toJSON();
    if (this.attributeKeys.length > 0) {
      config.attributeKeys = this.attributeKeys.slice(0);
    }
    if (this.keyMapping) {
      config.keyMapping = { ...this.keyMapping };
    }
    if (this.valueMapping) {
      config.valueMapping = JSON.parse(JSON.stringify(this.valueMapping));
    }
    if (Object.keys(this._window).length > 0) {
      config.window = { ...this._window };
    }
    return config;
  }
}

export default AbstractFeatureInfoView;
