import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import { parseAndSanitizeMarkdown } from '../application/markdownHelper.js';

/**
 * @description A component to render markdown html
 * @vue-prop {string} html - the html to render
 */
const MarkdownComponent = {
  name: 'MarkdownComponent',
  props: {
    html: {
      type: String,
      required: true,
    },
  },
  template: '<div class="pa-2" v-html="html" />',
};

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoViewOptions & { template: string | string[] }} MarkdownFeatureInfoViewOptions
 * @property {string | string[]} template - a string or an array of strings which will be concatenated using \n
 */

/**
 * @typedef {import("./abstractFeatureInfoView.js.js").FeatureInfoProps & { html: string }} MarkdownFeatureInfoViewProps
 */

/**
 * @param {Record<string, unknown>} parent
 * @param {(string|number)[]} keys
 * @returns {undefined|T}
 * @template {*} T
 */
function findRecursive(parent, keys) {
  if (keys.length === 1) {
    return parent[keys[0]];
  } else {
    const nextKey = keys.shift();
    const nextParent = parent[nextKey];
    if (nextParent) {
      return findRecursive(nextParent, keys);
    }
  }
  return undefined;
}

/**
 * @param {string|string[]} template
 * @param {Record<string, unknown>} attributes
 * @returns {string}
 */
function replaceAttributes(template, attributes) {
  const templateString = Array.isArray(template)
    ? template.join('\n')
    : template;
  return templateString.replace(/\{\{([^}]+)}}/g, (p, value) => {
    const keys = value.trim().split('.');

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (typeof key === 'string') {
        const indices = [];
        let arrayIndex = /\[["']?([^\]]+)["']?]$/.exec(key);
        while (arrayIndex != null) {
          let bracketKey = arrayIndex[1];
          if (/^\d+$/.test(bracketKey)) {
            bracketKey = Number(bracketKey);
          }
          indices.push(bracketKey);
          key = key.substring(0, arrayIndex.index);
          arrayIndex = /\[["']?([^\]]+)["']?]$/.exec(key);
        }

        if (indices.length > 0) {
          keys.splice(i, 1, key, ...indices);
        }
      }
    }

    return findRecursive(attributes, keys) ?? '';
  });
}

/**
 * @class
 * @description A simple markdown feature info view. will render feature attributes into the markdown and replace {{}}
 * @extends {AbstractFeatureInfoView}
 */
class MarkdownFeatureInfoView extends AbstractFeatureInfoView {
  /**
   * @type {string}
   */
  static get className() {
    return 'MarkdownFeatureInfoView';
  }

  /**
   * @param {MarkdownFeatureInfoViewOptions} options
   */
  constructor(options) {
    super(options, MarkdownComponent);

    /**
     * @type {string | string[]}
     */
    this.template = Array.isArray(options.template)
      ? options.template.slice()
      : options.template;
  }

  /**
   * @param {Record<string, unknown>} attributes
   * @protected
   * @returns {string}
   */
  _renderTemplate(attributes) {
    return replaceAttributes(this.template, attributes);
  }

  /**
   * Variables wrapped in `${}` within `src` are replaced by their values, e.g. `${featureId}` or `${attributes.gml:name}`
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {MarkdownFeatureInfoViewProps}
   */
  getProperties(featureInfo, layer) {
    const properties = super.getProperties(featureInfo, layer);
    return {
      ...properties,
      html: parseAndSanitizeMarkdown(
        this._renderTemplate({ ...properties, ...properties.attributes }),
      ),
    };
  }

  /**
   * @returns {MarkdownFeatureInfoViewOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.template = Array.isArray(this.template)
      ? this.template.slice()
      : this.template;
    return config;
  }
}

export default MarkdownFeatureInfoView;
