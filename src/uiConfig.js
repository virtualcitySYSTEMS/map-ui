import { Collection, makeOverrideCollection } from '@vcmap/core';
import { ref } from '@vue/composition-api';

/**
 * @typedef {Object} UiConfigurationItem
 * @property {string} name
 * @property {*} value
 */

/**
 * @typedef {Object} UiConfigObject
 * @property {string} [logo] - the company logo to display. this will override any and all css overrides.
 * @property {string} [mobileLogo] - an alternative logo to display in mobile view
 * @property {string} [appTitle] - an optional title to display next to the company logo
 * @property {string} [primaryColor] - an optional primary color to use in all themes
 */

/**
 * @class
 * @extends {Collection<UiConfigurationItem>}
 * @implements {import("@vcmap/core").OverrideCollectionInterface<UiConfigurationItem>}
 */
class UiConfig extends Collection {
  /**
   * @param {function():string} getDynamicContextId
   */
  constructor(getDynamicContextId) {
    super();

    makeOverrideCollection(this, getDynamicContextId);
    /**
     * This object just acts as a go between for reactivity until we have vue3
     * @todo vue3 cleanup
     * @type {Object<string, *>}
     */
    const configObject = {};
    /**
     * @type {import("@vue/composition-api").Ref<Object<string, *>>}
     * @private
     */
    this._config = ref({});
    /**
     * @type {Array<function():void>}
     * @private
     */
    this._listeners = [
      this.added.addEventListener((item) => {
        if (typeof item?.name === 'string') {
          configObject[item.name] = item.value;
          this._config.value = { ...configObject }; // shallow clone to trip reactivity
        }
      }),
      this.removed.addEventListener((item) => {
        if (typeof item?.name === 'string') {
          delete configObject[item.name];
          this._config.value = { ...configObject }; // shallow clone to trip reactivity
        }
      }),
    ];
  }

  /**
   * @returns {import("@vue/composition-api").Ref<Object<string, *>|UiConfigObject>}
   */
  get config() {
    return this._config;
  }

  /**
   * @inheritDoc
   */
  destroy() {
    this._listeners.forEach((cb) => { cb(); });
    this._listeners = [];
    super.destroy();
  }
}

export default UiConfig;
