import { IndexedCollection, moduleIdSymbol } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import en from './en.js';
import de from './de.js';

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
  constructor() {
    super();
    /**
     * VC Map default I18n Messages
     * @type {Object}
     * @private
     */
    this._defaultMessages = { name: 'default', en, de };

    /**
     * @type {IndexedCollection<Object>}
     * @private
     */
    this._pluginMessages = new IndexedCollection(false);
  }

  /**
   * This method adds plugin messages to the collection. It is no necessary to call this function
   * from within a plugin. Use the i18n property on your plugin.
   * @param {string} plugin Name of the plugin
   * @param {string} moduleId
   * @param {Object} messages
   */
  addPluginMessages(plugin, moduleId, messages) {
    messages[moduleIdSymbol] = moduleId;
    messages[i18nPluginSymbol] = plugin;
    messages.name = plugin;
    this._pluginMessages.add(messages);
    this.added.raiseEvent(messages);
  }

  /**
   * This method removes plugin messages from the collection. It is no necessary to call this function
   * from within a plugin. Once your plugin is removed, the VcsUiApp will call this for you.
   * @param {string} pluginName
   * @param {string} moduleId
   */
  removePluginMessages(pluginName, moduleId) {
    [...this._pluginMessages]
      .filter(
        (item) =>
          item[i18nPluginSymbol] === pluginName &&
          item[moduleIdSymbol] === moduleId,
      )
      .forEach((item) => {
        this._pluginMessages.remove(item);
        this.removed.raiseEvent(item);
      });
  }

  /**
   * returns a merged Message Object with the locale as a key and an Object with all the translated keys
   * @returns {Object}
   */
  getMergedMessages() {
    return mergeDeep(this._defaultMessages, ...this._pluginMessages, ...this);
  }

  /**
   * @inheritDoc
   */
  destroy() {
    this._pluginMessages.destroy();
    this._getDynamicModuleId = null;
    super.destroy();
  }
}

export default I18nCollection;
