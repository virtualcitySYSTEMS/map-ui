import { parseBoolean } from '@vcsuite/parsers';
import { renderTemplate, VcsObject } from '@vcmap/core';
import { WindowSlot } from '../manager/window/windowManager.js';
import { defaultTagOptions } from '../components/tables/VcsTable.vue';

/**
 * @typedef {Object} FeatureInfoProps
 * @property {string} featureId
 * @property {string} layerName
 * @property {Object} layerProperties
 * @property {Object} attributes
 * @property {Object} tags
 */

/**
 * @typedef {Object} HTMLTagOptions
 * @property {string} tag - the html element type
 * ... further html options, which can contain template string $value for reusing the attribute's value
 */

/**
 * @typedef {import("@vcmap/core").VcsObjectOptions & {
 *   attributeKeys?: string[],
 *   keyMapping?: Record<string,string>,
 *   valueMapping?: Record<string, string|Record<string,string>>,
 *   mergeParentAttributes?: boolean,
 *   removeNoDataAttributes?: boolean,
 *   tags?: Record<string, HTMLTagOptions>,
 *   window?: Pick<import("../manager/window/windowManager.js").WindowComponentOptions,'state'|'slot'|'position'>
 * }} FeatureInfoViewOptions
 * @property {Array<string>} [attributeKeys] - list of keys to filter attributes of selected feature
 * @property {Object<string,string>} [keyMapping] - object providing text replacements or i18n strings for attribute keys
 * @property {Object<string, string|Object<string,string>>} [valueMapping] - object providing text replacements or i18n strings for attribute values
 * @property {boolean} [mergeParentAttributes] - if true, will merge attributes from parent features, if __PARENT_FEATURE is set on the feature. Child attributes will overwrite parent attributes in case of identical keys.
 * @property {boolean} [removeNoDataAttributes] - if true, will remove all attributes with no data values
 * @property {Object<string,HTMLTagOptions>} [tags] - object with keys rendered as special html element. Value contains html options
 * @property {Pick<import("../manager/window/windowManager.js").WindowComponentOptions,'state'|'slot'|'position'>} [window] - state, slot, position can be set. Other options are predefined. headerTitle of window state can be a template string, e.g. "{{myAttribute}}" or ["{{layerName}}", " - ", "{{myAttribute}}"]
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
 * @param {Record<string, unknown>} attributes
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
        attributes[mappingKey] = getMappedValue(
          mapping[mappingKey],
          attributes[mappingKey],
        );
      } else {
        const mappingKeys = mappingKey.split('.');
        mappingKeys.reduce((obj, key, index) => {
          if (
            obj &&
            Object.hasOwn(obj, key) &&
            index === mappingKeys.length - 1
          ) {
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
 * @param {Object<string, unknown>} attributes
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
      if (mappingKey !== mapping[mappingKey]) {
        if (Object.hasOwn(attributes, mappingKey)) {
          attributes[mapping[mappingKey]] = attributes[mappingKey];
          delete attributes[mappingKey];
        } else {
          const mappingKeys = mappingKey.split('.');
          mappingKeys.reduce((obj, key, index) => {
            if (
              obj &&
              Object.hasOwn(obj, key) &&
              index === mappingKeys.length - 1
            ) {
              attributes[mapping[mappingKey]] = obj[key];
              delete obj[key];
            }
            return obj?.[key];
          }, attributes);
        }
      }
    });
}

/**
 * Applies value mapping on tag options
 * @param {Object<string, unknown>} attributes
 * @param {Object<string,HTMLTagOptions>} tags
 */
function applyTagMapping(attributes, tags) {
  Object.keys(tags).forEach((key) => {
    Object.keys(tags[key]).forEach((option) => {
      const mappedValue = tags[key][option];
      if (typeof mappedValue === 'string') {
        tags[key][option] = getMappedValue(tags[key][option], attributes[key]);
      }
    });
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
 * @param {Object<string, unknown>} attributes
 * @param {Array<string>} keys
 * @param {Object<string, unknown>=} result
 * @returns {Object<string, unknown>}
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

  Object.entries(nestedKeys).forEach(([parent, pKs]) => {
    if (typeof attributes[parent] === 'object') {
      result[parent] = {};
      applyAttributeFilter(attributes[parent], pKs, result[parent]);
    }
  });
  return result;
}

/**
 * Filters all olcs attributes, not provided as keys
 * @param {Object<string, unknown>} attributes
 * @param {Array<string>} keys
 * @returns {Object}
 */
export function applyOlcsAttributeFilter(attributes, keys = []) {
  return Object.keys(attributes)
    .filter((key) => keys.includes(key) || !/^olcs_/.test(key))
    .reduce((obj, key) => {
      obj[key] = attributes[key];
      return obj;
    }, {});
}

/**
 * Filters all __ attributes (from vc-converter tilesets) not provided as keys
 * @param {Object<string, unknown>} attributes
 * @param {Array<string>} keys
 * @returns {Object}
 */
export function applyDoubleUnderscoreFilter(attributes, keys = []) {
  return Object.keys(attributes)
    .filter((key) => keys.includes(key) || !/^__/.test(key))
    .reduce((obj, key) => {
      obj[key] = attributes[key];
      return obj;
    }, {});
}

/**
 * Filters attributes having an empty object as value
 * @param {Object<string, unknown>} attributes
 * @param {boolean} removeAllEmpty - if true, will remove all empty attributes, otherwise only empty objects
 * @returns {Object}
 */
export function applyEmptyAttributesFilter(attributes, removeAllEmpty = false) {
  return Object.keys(attributes).reduce((obj, key) => {
    if (
      (attributes[key] !== null &&
        typeof attributes[key] === 'object' &&
        Object.keys(attributes[key]).length === 0) ||
      (removeAllEmpty &&
        (attributes[key] === undefined || attributes[key] === null))
    ) {
      return obj;
    }
    obj[key] = attributes[key];
    return obj;
  }, {});
}

/**
 *
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("../manager/window/windowManager.js").WindowState} state
 * @param {Object} attributes
 * @returns {import("../manager/window/windowManager.js").WindowState}
 */
function getWindowState(app, state, attributes) {
  let headerTitle = state?.headerTitle;
  if (headerTitle) {
    if (Array.isArray(headerTitle)) {
      headerTitle = headerTitle.map((item) => renderTemplate(item, attributes));
    } else {
      headerTitle = renderTemplate(headerTitle, attributes);
    }
  }
  return {
    headerIcon: '$vcsInfo',
    infoUrl: app.getHelpUrlCallback('/tools/infoTool.html'),
    ...state,
    headerTitle: headerTitle || attributes.layerName,
  };
}

/**
 * Recursively searches for parent feature attributes, if __PARENT_FEATURE property is set. Parent feature is searched in the batchTable of the content of the given feature.
 * @param {import("ol").Feature|import("@vcmap-cesium/engine").Cesium3DTileFeature|import("@vcmap-cesium/engine").Cesium3DTilePointFeature} feature
 * @param {Array<object>} records - array of parent feature attributes
 * @returns {Array<object>} record of parent feature ids and their attributes
 */
function getParentFeatureAttributes(feature, records = []) {
  const parentId = feature.getProperty('__PARENT_FEATURE');
  if (parentId !== 'null' && feature.content?.batchTable) {
    for (let i = 0; i < feature.content.batchTable.featuresLength; i++) {
      const batchTableFeature = feature.content.batchTable.getFeature(i);
      if (batchTableFeature.getProperty('id') === parentId) {
        records.push(batchTableFeature.getAttributes());
        return getParentFeatureAttributes(batchTableFeature, records);
      }
    }
  }
  return records;
}

/**
 * Merges two objects by preventing the overwriting of existing keys with undefined values.
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
function safeMerge(target, source) {
  Object.entries(source).forEach(([key, value]) => {
    if (value !== undefined || !(key in target)) {
      target[key] = value;
    }
  });
  return target;
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
  static get className() {
    return 'AbstractFeatureInfoView';
  }

  /** @returns {FeatureInfoViewOptions} */
  static getDefaultOptions() {
    return {
      attributeKeys: [],
      keyMapping: undefined,
      valueMapping: undefined,
      tags: undefined,
      mergeParentAttributes: true,
      removeNoDataAttributes: false,
      window: {},
    };
  }

  /**
   * @param {FeatureInfoViewOptions} options
   * @param {import("vue").Component<FeatureInfoProps, unknown, unknown>} component
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
     * @type {boolean}
     */
    this.mergeParentAttributes = parseBoolean(
      options.mergeParentAttributes,
      defaultOptions.mergeParentAttributes,
    );
    /**
     * @type {boolean}
     */
    this.removeNoDataAttributes = parseBoolean(
      options.removeNoDataAttributes,
      defaultOptions.removeNoDataAttributes,
    );
    /**
     * @type {null|Object<string,HTMLTagOptions>}
     */
    this.tags = options.tags || defaultOptions.tags;
    /**
     * @type {Pick<import("../manager/window/windowManager.js").WindowComponentOptions,'state'|'slot'|'position'>|Object}
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
   * window options, configured in a module, used only internally by AbstractFeatureInfoView or subclass
   * @type {Pick<import("../manager/window/windowManager.js").WindowComponentOptions<FeatureInfoProps>,'state'|'slot'|'position'>|Object}
   */
  get window() {
    return this._window;
  }

  /**
   * component provided by a FeatureInfoView class, passed to featureInfo via `getWindowComponentOptions()`
   * @type {import("vue").Component<FeatureInfoProps, unknown, unknown>|undefined}
   */
  get component() {
    return this._component;
  }

  /**
   * @param {undefined|import("ol").Feature|import("@vcmap-cesium/engine").Cesium3DTileFeature|import("@vcmap-cesium/engine").Cesium3DTilePointFeature} feature
   * @returns {Object}
   * @protected
   */
  _getAttributesFromFeature(feature) {
    const attributes = feature?.getAttributes() || {};
    if (this.mergeParentAttributes) {
      const parentAttributes = getParentFeatureAttributes(feature);
      // Merge parent with child (child overwrites parent)
      return [...parentAttributes, attributes].reduce(
        (acc, source) => safeMerge(acc, source),
        {},
      );
    }
    return attributes;
  }

  /**
   * This method returns all relevant attributes for this view.
   * Called by `getProperties()` to pass attributes as props object to the VueComponent of this view.
   * May be overwritten by classes extending AbstractFeatureInfoView.
   * It filters attributes of the feature by keys, performs value and key mapping, if provided.
   * @param {undefined|import("ol").Feature|import("@vcmap-cesium/engine").Cesium3DTileFeature|import("@vcmap-cesium/engine").Cesium3DTilePointFeature} feature
   * @returns {Object}
   */
  getAttributes(feature) {
    let attributes = this._getAttributesFromFeature(feature);
    if (this.attributeKeys.length > 0) {
      attributes = applyAttributeFilter(attributes, this.attributeKeys);
    }
    if (this.valueMapping) {
      applyValueMapping(attributes, this.valueMapping);
    }
    if (this.keyMapping) {
      applyKeyMapping(attributes, this.keyMapping);
    }
    attributes = applyOlcsAttributeFilter(attributes, this.attributeKeys);
    attributes = applyDoubleUnderscoreFilter(attributes, this.attributeKeys);
    return applyEmptyAttributesFilter(attributes, this.removeNoDataAttributes);
  }

  /**
   * This method returns an object with keys rendered as special html elements.
   * Applies value mapping, when using $value html option.
   * Ensures key mapping on defined anchor keys.
   * @param {undefined|import("ol").Feature|import("@vcmap-cesium/engine").Cesium3DTileFeature|import("@vcmap-cesium/engine").Cesium3DTilePointFeature} feature
   * @returns {Object|undefined}
   */
  getTags(feature) {
    if (this.tags) {
      const attributes = this._getAttributesFromFeature(feature);
      const tags = Object.keys(this.tags)
        .filter(
          (key) =>
            Object.keys(attributes).includes(key) &&
            Object.keys(defaultTagOptions).includes(this.tags[key].tag),
        )
        .reduce((obj, key) => {
          obj[key] = { ...this.tags[key] };
          return obj;
        }, {});
      applyTagMapping(attributes, tags);
      if (this.keyMapping) {
        applyKeyMapping(tags, this.keyMapping);
      }
      return tags;
    }
    return undefined;
  }

  /**
   * This method returns all relevant properties passed to the VueComponent of this view.
   * May be overwritten by classes extending AbstractFeatureInfoView.
   * Called by `getWindowComponentOptions()`.
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {FeatureInfoProps}
   */
  getProperties({ feature }, layer) {
    return {
      featureId: feature.getId(),
      layerName: layer.name,
      layerProperties: layer.properties,
      attributes: this.getAttributes(feature),
      tags: this.getTags(feature),
    };
  }

  /**
   * This method is being called by featureInfo, whenever a new window is created (added to the windowManager).
   * May be overwritten by classes extending AbstractFeatureInfoView.
   * @param {import("../vcsUiApp.js").default} app
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {import("../manager/window/windowManager.js").WindowComponentOptions}
   */
  getWindowComponentOptions(app, featureInfo, layer) {
    const props = this.getProperties(featureInfo, layer);
    return {
      state: getWindowState(app, this.window.state, {
        ...props.attributes,
        layerName: layer.properties?.title || layer.name,
      }),
      slot: this.window.slot ?? WindowSlot.DYNAMIC_RIGHT,
      component: this.component,
      position: this.window.position,
      props,
    };
  }

  /**
   * @returns {FeatureInfoViewOptions}
   */
  toJSON() {
    const config = super.toJSON();
    const defaultOptions = AbstractFeatureInfoView.getDefaultOptions();
    if (this.attributeKeys.length > 0) {
      config.attributeKeys = this.attributeKeys.slice(0);
    }
    if (this.keyMapping) {
      config.keyMapping = { ...this.keyMapping };
    }
    if (this.valueMapping) {
      config.valueMapping = JSON.parse(JSON.stringify(this.valueMapping));
    }
    if (this.mergeParentAttributes !== defaultOptions.mergeParentAttributes) {
      config.mergeParentAttributes = this.mergeParentAttributes;
    }
    if (this.removeNoDataAttributes !== defaultOptions.removeNoDataAttributes) {
      config.removeNoDataAttributes = this.removeNoDataAttributes;
    }
    if (this.tags) {
      config.tags = JSON.parse(JSON.stringify(this.tags));
    }
    if (Object.keys(this._window).length > 0) {
      config.window = { ...this._window };
    }
    return config;
  }
}

export default AbstractFeatureInfoView;
