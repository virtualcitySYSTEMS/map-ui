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
 * @typedef {import("@vcmap/core").VcsObjectOptions} FeatureInfoViewOptions
 * @property {Array<string>} [attributeKeys] - list of keys to filter attributes of selected feature
 * @property {Object<string,string>} [keyMapping] - object providing text replacements or i18n strings for attribute keys
 * @property {Object<string, string|Object<string,string>>} [valueMapping] - object providing text replacements or i18n strings for attribute values
 * @property {WindowComponentOptions} [window] - state, slot, position can be set. Other options are predefined.
 */

/**
 * @param {string|Object<string,string>} mappedValue
 * @param {string} value
 * @returns {string}
 */
function getMappedValue(mappedValue, value) {
  if (typeof mappedValue === 'string') {
    return mappedValue.replace(/\${value}/g, value);
  }
  return mappedValue[value] ?? value;
}

/**
 * Replaces values by new values according to mapping table. Nested keys are represented by a "."
 * @param {Object<string, *>} attributes
 * @param {Object<string, string|Object<string,string>>} mapping - value mapping
 */
export function applyValueMapping(attributes, mapping) {
  Object.keys(mapping)
    .sort((a, b) => {
      const aLen = a.split('.').length;
      const bLen = b.split('.').length;
      if (aLen > bLen) {
        return -1;
      }
      if (bLen > aLen) {
        return 1;
      }
      return 0;
    })
    .forEach((mappingKey) => {
      if (Object.hasOwn(attributes, mappingKey)) {
        attributes[mappingKey] = getMappedValue(mapping[mappingKey], attributes[mappingKey]);
      } else {
        const mappingKeys = mappingKey.split('.');
        mappingKeys.reduce((obj, key, index) => {
          if (obj && Object.hasOwn(obj, key) && index === mappingKeys.length - 1) {
            obj[key] = getMappedValue(mapping[mappingKey], obj[key]);
          }
          return obj?.[key];
        }, attributes);
      }
    });
}

/**
 * Replaces keys by new keys according to mapping table.
 * Nested keys to replace are represented by a ".". Keys will
 * be replaced by the given string literal. This will always lead
 * to a new top level key or an overwritting of an existing key.
 * Deletes old keys!
 * @example
 * const getAttrs = () => { foo: { bar: true }, 'foo.baz': true };
 * const nestedMapping = { 'foo.bar': 'bar' };
 * const nestedMappingWithPeriod = { 'foo.bar': 'bar.foo' };
 * const flatMapping = { 'foo': 'bar' };
 * const periodMapping = { 'foo.baz': 'foo' };
 * // apply nested key mapping will replace nested key with top level key
 * const nestedAttrs = applyKeyMapping(getAttrs(), nestedMapping);
 * assert(nestedAttrs.bar === true);
 * // apply nested key mapping with a new key with a period. will replace nested key with a top level key.
 * const nestedAttrsWithPeriod = applyKeyMapping(getAttrs(), nestedMappingWithPeriod);
 * assert(nestedAttrsWithPeriod['bar.foo'] === true);
 * // apply flat mapping: will replace top level key with another top level key
 * const flatAttrs = applyKeyMapping(getAttrs(), flatMapping);
 * assert(flatAttrs.bar.bar === true);
 * // apply flat mapping of a key with a period. this will overwrite an existing _other_ key
 * const periodAttrs = applyKeyMapping(getAttrs(), periodMapping);
 * assert(periodAttrs.foo === true);
 * @param {Object<string, *>} attributes
 * @param {Object<string,string>} mapping - key mapping
 */
export function applyKeyMapping(attributes, mapping) {
  Object.keys(mapping)
    .sort((a, b) => {
      const aLen = a.split('.').length;
      const bLen = b.split('.').length;
      if (aLen > bLen) {
        return -1;
      }
      if (bLen > aLen) {
        return 1;
      }
      return 0;
    })
    .forEach((mappingKey) => {
      if (Object.hasOwn(attributes, mappingKey)) {
        attributes[mapping[mappingKey]] = attributes[mappingKey];
        delete attributes[mappingKey];
      } else {
        const mappingKeys = mappingKey.split('.');
        mappingKeys.reduce((obj, key, index) => {
          if (obj && Object.hasOwn(obj, key) && index === mappingKeys.length - 1) {
            attributes[mapping[mappingKey]] = obj[key];
            delete obj[key];
          }
          return obj?.[key];
        }, attributes);
      }
    });
}

/**
 * Applies an attribute filtering. Nested attributes are represented by a ".".
 * @example
 * const attrs = { foo: { bar: true, baz: false }, bar: true, baz: true, foobar: { foo: true, bar: true } };
 * const filter = ["foo.bar", "baz", "foobar"];
 * const filtered = applyAttributeFilter(attrs, filter)
 * // nested keys will also filter for their parent
 * assert(filtered.foo.bar === true);
 * // only keys filtered will be present
 * assert(filtered.foo.baz === undefined);
 * assert(filtered.bar === undefined);
 * assert(filtered.baz === true);
 * // if filtering parent top level keys, will pass on a reference of the actual value and its children.
 * assert(deepEquals(filtered.foobar, attrs.foobar));
 * @param {Object<string, *>} attributes
 * @param {Array<string>} keys
 * @param {Object<string, *>=} result
 * @returns {Object<string, *>}
 */
export function applyAttributeFilter(attributes, keys, result = {}) {
  const nestedKeys = {};
  keys.forEach((k) => {
    if (Object.hasOwn(attributes, k)) {
      result[k] = attributes[k];
    } else if (k.includes('.')) {
      const [parent, ...rest] = k.split('.');
      if (!nestedKeys[parent]) {
        nestedKeys[parent] = [];
      }
      nestedKeys[parent].push(rest.join('.'));
    }
  });

  Object.entries(nestedKeys)
    .forEach(([parent, pKs]) => {
      if (typeof attributes[parent] === 'object') {
        result[parent] = {};
        applyAttributeFilter(attributes[parent], pKs, result[parent]);
      }
    });
  return result;
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
   * @param {undefined|import("ol").Feature<import("ol/geom/Geometry").default>|import("@vcmap-cesium/engine").Cesium3DTileFeature|import("@vcmap-cesium/engine").Cesium3DTilePointFeature} feature
   * @returns {Object}
   */
  getAttributes(feature) {
    let attributes = feature.getProperty('attributes') || {};
    if (this.attributeKeys.length > 0) {
      attributes = applyAttributeFilter(attributes, this.attributeKeys);
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
  getProperties({ feature }, layer) {
    return {
      featureId: feature.getId(),
      layerName: layer.name,
      layerProperties: layer.properties,
      attributes: this.getAttributes(feature),
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
