import { IndexedCollection, VcsEvent } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import en from './en.js';
import de from './de.js';

/**
 * returns true if the given value is of type object and not an array.
 * This function does not handle Maps and Sets and also returns true for these.
 * This helper function is mainly used for the i18nCollection mergeDeep function
 * @param {unknown} item
 * @returns {boolean}
 */
export function isObject(item) {
  return !!item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Item for internationalization containing an object with key value mapping for each locale (de, en, nl, pl, ...).
 * Other locales can be supported by adding corresponding mapping objects with associated locale key.
 * @typedef {Record<string, string | object> & { name: string, properties?: object, de?: object, en?: object }} I18nConfigurationItem
 * @property {string} name - the name for the item.
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
   * @param {import("@vcmap/core").OverrideCollection<import("@src/vcsUiApp.js").VcsPlugin<Object, Object>>} pluginCollection
   */
  constructor(pluginCollection) {
    super();
    /**
     * VC Map default I18n Messages
     * @type {Object}
     * @private
     */
    this._defaultMessages = { name: 'default', en, de };
    /**
     * @type {import("@vcmap/core").OverrideCollection<import("@src/vcsUiApp.js").VcsPlugin>}
     * @private
     */
    this._pluginCollection = pluginCollection;

    this._pluginI18nListeners = [
      this._pluginCollection.added.addEventListener((plugin) => {
        if (plugin.i18n) {
          this.changed.raiseEvent({ name: plugin.name, ...plugin.i18n });
        }
      }),
      this._pluginCollection.removed.addEventListener((plugin) => {
        if (plugin.i18n) {
          this.changed.raiseEvent({ name: plugin.name, ...plugin.i18n });
        }
      }),
    ];

    this._i18nListener = [
      this.added.addEventListener((added) => this.changed.raiseEvent(added)),
      this.removed.addEventListener((removed) =>
        this.changed.raiseEvent(removed),
      ),
      this.moved.addEventListener((moved) => this.changed.raiseEvent(moved)),
    ];

    /**
     * Event raised, whenever a I18nConfigurationItem is added or removed or when a plugin with i18n keys is added or removed
     * @type {VcsEvent<I18nConfigurationItem>}
     */
    this.changed = new VcsEvent();
  }

  /**
   * Returns a merged Message Object with the locale as a key and an Object with all the translated keys.
   * Includes all available plugin messages.
   * @returns {Record<string, object>}
   */
  getMergedMessages() {
    const pluginMessages = [...this._pluginCollection]
      .map((p) => p.i18n)
      .filter((i) => i);
    return mergeDeep(this._defaultMessages, ...pluginMessages, ...this);
  }

  /**
   * @inheritDoc
   */
  destroy() {
    this._i18nListener.forEach((cb) => cb());
    this._pluginI18nListeners.forEach((cb) => cb());
    this._pluginCollection = null;
    this.changed.destroy();
    super.destroy();
  }
}

export default I18nCollection;
