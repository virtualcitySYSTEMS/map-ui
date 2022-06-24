// eslint-disable-next-line max-classes-per-file
import { contextIdSymbol, IndexedCollection } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';

/**
 * returns true if the given value is of type object and not an array.
 * This function does not handle Maps and Sets and also returns true for these.
 * This helper function is mainly used for the i18nCollection mergeDeep function
 * @param {*} item
 * @returns {boolean}
 */
export function isObject(item) {
  return (!!item && typeof item === 'object' && !Array.isArray(item));
}

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
    Object.entries(obj).forEach(([key, value]) => {
      if (isObject(prev[key]) && isObject(value)) { // recursive merge if both values are objects.
        prev[key] = mergeDeep(prev[key], value);
      } else if (isObject(prev[key])) { // do not override complex object with atomic value
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
 * @extends {IndexedCollection<Object>}
 */
class I18nCollection extends IndexedCollection {
  /**
   * @param {function():string} getDynamicContextId - function to get the current dynamic context id
   */
  constructor(getDynamicContextId) {
    super(false);
    /**
     * @type {function(): string}
     * @private
     */
    this._getDynamicContextId = getDynamicContextId;
  }

  /**
   * @inheritDoc
   */
  add(item) {
    if (!item[contextIdSymbol]) {
      item[contextIdSymbol] = this._getDynamicContextId();
    }
    super.add(item);
  }

  /**
   * @param {Array<Object>} configArray
   * @param {string} contextId
   * @returns {Promise<void>}
   */
  async parseItems(configArray, contextId) {
    if (Array.isArray(configArray)) {
      configArray.forEach((item) => {
        item[contextIdSymbol] = contextId;
        this.add(item);
      });
    }
  }

  /**
   * @param {string} contextId
   */
  async removeContext(contextId) {
    [...this]
      .filter(item => item[contextIdSymbol] === contextId)
      .forEach((item) => {
        this.remove(item);
      });
  }

  /**
   * @param {string} contextId
   * @returns {Array<Object>}
   */
  serializeContext(contextId) {
    return [...this]
      .filter(item => item[contextIdSymbol] === contextId)
      .filter(item => !item[i18nPluginSymbol])
      .map(item => JSON.parse(JSON.stringify(item)));
  }

  /**
   * This method adds plugin messages to the collection. It is no necessary to call this function
   * from within a plugin. Use the i18n property on your plugin.
   * @param {string} plugin Name of the plugin
   * @param {string} contextId
   * @param {Object} messages
   */
  addPluginMessages(plugin, contextId, messages) {
    messages[i18nPluginSymbol] = plugin;
    messages[contextIdSymbol] = contextId;
    this.add(messages);
  }

  /**
   * This method removes plugin messages from the collection. It is no necessary to call this function
   * from within a plugin. Once your plugin is removed, the VcsUiApp will call this for you.
   * @param {string} pluginName
   * @param {string} contextId
   */
  removePluginMessages(pluginName, contextId) {
    [...this]
      .filter(item => item[i18nPluginSymbol] === pluginName && item[contextIdSymbol] === contextId)
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
    this._getDynamicContextId = null;
    super.destroy();
  }
}

export default I18nCollection;
