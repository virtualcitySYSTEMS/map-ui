// eslint-disable-next-line max-classes-per-file
import { v5 as uuidv5 } from 'uuid';
import { IndexedCollection, moduleIdSymbol } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';

/**
 * @type {string}
 */
const uniqueNamespace = '9c27cc2d-552f-4637-9194-09329ed4c1dc';

/**
 * returns true if the given value is of type object and not an array.
 * This function does not handle Maps and Sets and also returns true for these.
 * This helper function is mainly used for the i18nCollection mergeDeep function
 * @param {*} item
 * @returns {boolean}
 */
export function isObject(item) {
  return !!item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Item for internationalization containing an object with key value mapping for each locale (de, en, nl, pl, ...).
 * Other locales can be supported by adding corresponding mapping objects with associated locale key.
 * @typedef {Object} I18nConfigurationItem
 * @property {string} [name] - optional name for the item. If not provided checksum is used.
 * @property {Object} [properties]
 * @property {Object} [de]
 * @property {Object} [en]
 * ...
 */

/**
 * A symbol added to plugin messages added to this collection.
 * @type {symbol}
 */
export const i18nPluginSymbol = Symbol('I18nPluginSymbol');

/**
 * Deep merge objects into a new Object. Can only handle stringifyable content.
 * This will create a new deep copy of the given sources. No copy by reference.
 * @param {...Object} sources
 * @returns {Object}
 */
export function mergeDeep(...sources) {
  return sources.reduce((prev, obj) => {
    Object.entries(obj)
      .filter(([key]) => !['name', 'properties'].includes(key))
      .forEach(([key, value]) => {
        if (isObject(prev[key]) && isObject(value)) {
          // recursive merge if both values are objects.
          prev[key] = mergeDeep(prev[key], value);
        } else if (isObject(prev[key])) {
          // do not override complex object with atomic value
          getLogger('i18n').warning(
            `Overwriting a complex Object I18n Key with a string value is not allowed. Value:
          ${JSON.stringify(prev[key])}, newValue: ${JSON.stringify(obj[key])}`,
          );
        } else {
          // JSON parse/stringify to create a deep copy of the to set value, so we do not pass parts
          // of a source by reference
          prev[key] = JSON.parse(JSON.stringify(value));
        }
      });
    return prev;
  }, {});
}

/**
 * @extends {IndexedCollection<I18nConfigurationItem>}
 */
class I18nCollection extends IndexedCollection {
  /**
   * @param {function():string} getDynamicModuleId - function to get the current dynamic module id
   */
  constructor(getDynamicModuleId) {
    super();
    /**
     * @type {function(): string}
     * @private
     */
    this._getDynamicModuleId = getDynamicModuleId;
  }

  /**
   * @inheritDoc
   */
  add(item) {
    if (!item[moduleIdSymbol]) {
      item[moduleIdSymbol] = this._getDynamicModuleId();
    }
    if (!item.name) {
      item.name = uuidv5(JSON.stringify(item), uniqueNamespace);
    }
    super.add(item);
  }

  /**
   * @param {Array<I18nConfigurationItem>} configArray
   * @param {string} moduleId
   * @returns {Promise<void>}
   */
  async parseItems(configArray, moduleId) {
    if (Array.isArray(configArray)) {
      configArray.forEach((item) => {
        item[moduleIdSymbol] = moduleId;
        this.add(item);
      });
    }
  }

  /**
   * @param {string} moduleId
   */
  async removeModule(moduleId) {
    [...this]
      .filter((item) => item[moduleIdSymbol] === moduleId)
      .forEach((item) => {
        this.remove(item);
      });
  }

  /**
   * @param {string} moduleId
   * @returns {Array<I18nConfigurationItem>}
   */
  serializeModule(moduleId) {
    return [...this]
      .filter((item) => item[moduleIdSymbol] === moduleId)
      .filter((item) => !item[i18nPluginSymbol])
      .map((item) => JSON.parse(JSON.stringify(item)));
  }

  /**
   * This method adds plugin messages to the collection. It is no necessary to call this function
   * from within a plugin. Use the i18n property on your plugin.
   * @param {string} plugin Name of the plugin
   * @param {string} moduleId
   * @param {Object} messages
   */
  addPluginMessages(plugin, moduleId, messages) {
    messages[i18nPluginSymbol] = plugin;
    messages[moduleIdSymbol] = moduleId;
    messages.name = plugin;
    this.add(messages);
  }

  /**
   * This method removes plugin messages from the collection. It is no necessary to call this function
   * from within a plugin. Once your plugin is removed, the VcsUiApp will call this for you.
   * @param {string} pluginName
   * @param {string} moduleId
   */
  removePluginMessages(pluginName, moduleId) {
    [...this]
      .filter(
        (item) =>
          item[i18nPluginSymbol] === pluginName &&
          item[moduleIdSymbol] === moduleId,
      )
      .forEach((item) => {
        this.remove(item);
      });
  }

  /**
   * returns a merged Message Object with the locale as a key and an Object with all the translated keys
   * @returns {Object}
   */
  getMergedMessages() {
    return mergeDeep(...this);
  }

  /**
   * @inheritDoc
   */
  destroy() {
    this._getDynamicModuleId = null;
    super.destroy();
  }
}

export default I18nCollection;
