import { parseBoolean } from '@vcsuite/parsers';
import {
  type EventFeature,
  type Layer,
  VcsObject,
  type VcsObjectOptions,
  renderTemplate,
} from '@vcmap/core';
import {
  Cesium3DTileFeature,
  Cesium3DTilePointFeature,
} from '@vcmap-cesium/engine';
import { computed, isRef, type Component } from 'vue';
import type VcsUiApp from '../vcsUiApp.js';
import type {
  OptionOrRef,
  WindowComponentOptions,
  WindowStateOptions,
} from '../manager/window/windowManager.js';
import { defaultTagOptions } from '../components/tables/VcsTable.ts.vue';
import type { FeatureInfoEvent } from './featureInfo.js';

export type FeatureInfoProps = {
  featureId: string;
  layerName: string;
  layerProperties: Record<string, unknown>;
  attributes: Record<string, unknown>;
  tags: Record<string, unknown>;
};

export type HTMLTagOptions = {
  tag: string;
  /** further html options, which can contain template string $value for reusing the attribute's value */
  [key: string]: unknown;
};

export type FeatureInfoViewOptions = VcsObjectOptions & {
  /** list of keys to filter attributes of selected feature */
  attributeKeys?: string[];
  /** object providing text replacements or i18n strings for attribute keys */
  keyMapping?: Record<string, string>;
  /**object providing text replacements or i18n strings for attribute values */
  valueMapping?: Record<string, string | Record<string, string>>;
  /** if true, will merge attributes from parent features, if __PARENT_FEATURE is set on the feature. Child attributes will overwrite parent attributes in case of identical keys. */
  mergeParentAttributes?: boolean;
  /** if true, will remove all attributes with no data values */
  removeNoDataAttributes?: boolean;
  /** object with keys rendered as special html element. Value contains html options */
  tags?: Record<string, HTMLTagOptions>;
  /** state, slot, position can be set. Other options are predefined. headerTitle of window state can be a template string, e.g. "{{myAttribute}}" or ["{{layerName}}", " - ", "{{myAttribute}}"] */
  window?: Pick<WindowComponentOptions, 'state' | 'slot' | 'position'>;
};

function getMappedValue<T>(
  mappedValue: string | Record<string, string | T>,
  value: T,
): string | T {
  if (typeof mappedValue === 'string') {
    return mappedValue.replace(/\${value}/g, String(value));
  }
  return mappedValue[String(value)] ?? value;
}

/**
 * Replaces values by new values according to mapping table. Nested keys are represented by a "."
 */
export function applyValueMapping(
  attributes: Record<string, unknown>,
  mapping: Record<string, string | Record<string, string>>,
): void {
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
        mappingKeys.reduce<Record<string, unknown>>((obj, key, index) => {
          if (
            obj &&
            Object.hasOwn(obj, key) &&
            index === mappingKeys.length - 1
          ) {
            obj[key] = getMappedValue(mapping[mappingKey], obj[key]);
          }
          return obj?.[key] as Record<string, unknown>;
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
 */
export function applyKeyMapping(
  attributes: Record<string, unknown>,
  mapping: Record<string, string>,
): void {
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
          mappingKeys.reduce<Record<string, unknown>>((obj, key, index) => {
            if (
              obj &&
              Object.hasOwn(obj, key) &&
              index === mappingKeys.length - 1
            ) {
              attributes[mapping[mappingKey]] = obj[key];
              delete obj[key];
            }
            return obj?.[key] as Record<string, unknown>;
          }, attributes);
        }
      }
    });
}

/**
 * Applies value mapping on tag options
 */
function applyTagMapping(
  attributes: Record<string, unknown>,
  tags: Record<string, HTMLTagOptions>,
): void {
  Object.keys(tags).forEach((key) => {
    Object.keys(tags[key]).forEach((option) => {
      const mappedValue = tags[key][option];
      if (typeof mappedValue === 'string') {
        tags[key][option] = getMappedValue(mappedValue, attributes[key]);
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
 */
export function applyAttributeFilter(
  attributes: Record<string, unknown>,
  keys: string[],
  result: Record<string, unknown> = {},
): Record<string, unknown> {
  const nestedKeys: Record<string, string[]> = {};
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
    if (attributes[parent] && typeof attributes[parent] === 'object') {
      result[parent] = {};
      applyAttributeFilter(
        attributes[parent] as Record<string, unknown>,
        pKs,
        result[parent] as Record<string, unknown>,
      );
    }
  });
  return result;
}

/**
 * Filters all olcs attributes, not provided as keys
 */
export function applyOlcsAttributeFilter(
  attributes: Record<string, unknown>,
  keys: string[] = [],
): Record<string, unknown> {
  return Object.keys(attributes)
    .filter((key) => keys.includes(key) || !/^olcs_/.test(key))
    .reduce<Record<string, unknown>>((obj, key) => {
      obj[key] = attributes[key];
      return obj;
    }, {});
}

/**
 * Filters all __ attributes (from vc-converter tilesets) not provided as keys
 */
export function applyDoubleUnderscoreFilter(
  attributes: Record<string, unknown>,
  keys: string[] = [],
): Record<string, unknown> {
  return Object.keys(attributes)
    .filter((key) => keys.includes(key) || !/^__/.test(key))
    .reduce<Record<string, unknown>>((obj, key) => {
      obj[key] = attributes[key];
      return obj;
    }, {});
}

/**
 * Filters attributes having an empty object as value
 * @param removeAllEmpty - if true, will remove all empty attributes, otherwise only empty objects
 */
export function applyEmptyAttributesFilter(
  attributes: Record<string, unknown>,
  removeAllEmpty = false,
): Record<string, unknown> {
  return Object.keys(attributes).reduce<Record<string, unknown>>((obj, key) => {
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

function getWindowState(
  app: VcsUiApp,
  state: WindowStateOptions,
  attributes: Record<string, unknown>,
): WindowStateOptions {
  let headerTitle: OptionOrRef<string | string[]> =
    attributes.layerName as string;
  const stateHeaderTitle = state?.headerTitle;
  if (stateHeaderTitle) {
    const renderHeaderTitle = (title: string | string[]): string | string[] => {
      return Array.isArray(title)
        ? title.map((item) => renderTemplate(item, attributes))
        : renderTemplate(title, attributes);
    };
    headerTitle = isRef(stateHeaderTitle)
      ? computed<string | string[]>(() =>
          renderHeaderTitle(stateHeaderTitle.value),
        )
      : renderHeaderTitle(stateHeaderTitle);
  }
  return {
    headerIcon: '$vcsInfo',
    infoUrlCallback: app.getHelpUrlCallback('/tools/infoTool.html'),
    ...state,
    headerTitle,
  };
}

/**
 * Recursively searches for parent feature attributes, if __PARENT_FEATURE property is set. Parent feature is searched in the batchTable of the content of the given feature.
 * @param records - array of parent feature attributes
 * @returns a record of parent feature ids and their attributes
 */
function getParentFeatureAttributes(
  feature: EventFeature,
  records: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  const parentId = feature.getProperty('__PARENT_FEATURE');
  if (
    parentId !== 'null' &&
    (feature instanceof Cesium3DTileFeature ||
      feature instanceof Cesium3DTilePointFeature) &&
    feature.content?.batchTable
  ) {
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
 */
function safeMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
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
 */
class AbstractFeatureInfoView<
  TProps extends FeatureInfoProps = FeatureInfoProps,
> extends VcsObject {
  static get className(): string {
    return 'AbstractFeatureInfoView';
  }

  static getDefaultOptions(): FeatureInfoViewOptions {
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

  attributeKeys: string[];
  keyMapping?: Record<string, string>;
  valueMapping?: Record<string, string | Record<string, string>>;
  mergeParentAttributes: boolean;
  removeNoDataAttributes: boolean;
  tags?: Record<string, HTMLTagOptions>;
  private _window:
    | Pick<WindowComponentOptions, 'state' | 'slot' | 'position'>
    | object;
  private _component?: Component;

  constructor(
    options: FeatureInfoViewOptions,
    component: Component<Partial<TProps>, unknown, unknown>,
  ) {
    super(options);
    const defaultOptions = AbstractFeatureInfoView.getDefaultOptions();

    this.attributeKeys = options.attributeKeys || defaultOptions.attributeKeys!;
    this.keyMapping = options.keyMapping || defaultOptions.keyMapping;
    this.valueMapping = options.valueMapping || defaultOptions.valueMapping;
    this.mergeParentAttributes = parseBoolean(
      options.mergeParentAttributes,
      defaultOptions.mergeParentAttributes,
    );
    this.removeNoDataAttributes = parseBoolean(
      options.removeNoDataAttributes,
      defaultOptions.removeNoDataAttributes,
    );
    this.tags = options.tags || defaultOptions.tags;
    this._window = options.window || defaultOptions.window!;
    this._component = component;
  }

  /**
   * window options, configured in a module, used only internally by AbstractFeatureInfoView or subclass
   */
  get window(): Pick<WindowComponentOptions, 'state' | 'slot' | 'position'> {
    return this._window;
  }

  /**
   * component provided by a FeatureInfoView class, passed to featureInfo via `getWindowComponentOptions()`
   */
  get component(): Component | undefined {
    return this._component;
  }

  protected _getAttributesFromFeature(
    feature: EventFeature,
  ): Record<string, unknown> {
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
   */
  getAttributes(feature: EventFeature): Record<string, unknown> {
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
   */
  getTags(feature: EventFeature): Record<string, HTMLTagOptions> {
    if (this.tags) {
      const attributes = this._getAttributesFromFeature(feature);
      const tags = Object.keys(this.tags)
        .filter(
          (key) =>
            Object.keys(attributes).includes(key) &&
            Object.keys(defaultTagOptions).includes(this.tags![key].tag),
        )
        .reduce<Record<string, HTMLTagOptions>>((obj, key) => {
          obj[key] = { ...this.tags![key] };
          return obj;
        }, {});
      applyTagMapping(attributes, tags);
      if (this.keyMapping) {
        applyKeyMapping(tags, this.keyMapping);
      }
      return tags;
    }
    return {};
  }

  /**
   * This method returns all relevant properties passed to the VueComponent of this view.
   * May be overwritten by classes extending AbstractFeatureInfoView.
   * Called by `getWindowComponentOptions()`.
   */
  getProperties({ feature }: FeatureInfoEvent, layer: Layer): FeatureInfoProps {
    return {
      featureId: String(feature.getId()),
      layerName: layer.name,
      layerProperties: layer.properties,
      attributes: this.getAttributes(feature),
      tags: this.getTags(feature),
    };
  }

  /**
   * This method is being called by featureInfo, whenever a new window is created (added to the windowManager).
   * May be overwritten by classes extending AbstractFeatureInfoView.
   */
  getWindowComponentOptions(
    app: VcsUiApp,
    featureInfo: FeatureInfoEvent,
    layer: Layer,
  ): WindowComponentOptions {
    const props = this.getProperties(featureInfo, layer);
    return {
      state: getWindowState(app, this.window.state!, {
        ...props.attributes,
        layerName: layer.properties?.title || layer.name,
      }),
      component: this.component!,
      slot: this.window.slot ?? 'dynamicRight',
      position: this.window.position,
      props,
    };
  }

  toJSON(
    defaultOptions: FeatureInfoViewOptions = AbstractFeatureInfoView.getDefaultOptions(),
  ): FeatureInfoViewOptions {
    const config = super.toJSON(defaultOptions) as FeatureInfoViewOptions;
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
