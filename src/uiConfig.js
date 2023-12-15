import { Collection, makeOverrideCollection } from '@vcmap/core';
import { ref } from 'vue';

/**
 * @typedef {Object} UiConfigurationItem
 * @property {string} name
 * @property {*} value
 */

/**
 * @typedef {Object} TextPageType
 * @property {string} title
 * @property {url} [url]
 * @property {string} [content]
 */

/**
 * @typedef {Object} UiConfigObject
 * @property {string} [logo] - the company logo to display. this will override any and all css overrides.
 * @property {string} [mobileLogo] - an alternative logo to display in mobile view
 * @property {string} [appTitle] - an optional title to display next to the company logo
 * @property {string} [primaryColor] - an optional primary color to use in all themes
 * @property {boolean} [startingFeatureInfo] - an optional flag whether to activate feature info on startup (default active)
 * @property {string} [positionDisplayEventType] - mouse event, when position display is updated. Either 'click' (default) or 'move'.
 * @property {string} [helpBaseUrl='https://help.vc.systems/'] - an optional URL to a help landing page
 * @property {TextPageType} [imprint] - an option imprint, will show a link in the footer.
 * @property {TextPageType} [dataProtection] - an option dataProtection, will show a link in the footer.
 */

/**
 * @typedef {import("@vcmap/core").OverrideCollectionInterface<UiConfigurationItem>} UiConfigOverrideCollection
 */

/**
 * @class
 * @extends {import("@vcmap/core").Collection<UiConfigurationItem>}
 * @implements {UiConfigOverrideCollection}
 */
class UiConfig extends Collection {
  /**
   * @param {function():string} getDynamicModuleId
   */
  constructor(getDynamicModuleId) {
    super();

    makeOverrideCollection(this, getDynamicModuleId);
    /**
     * This object just acts as a go between for reactivity until we have vue3
     * @todo vue3 cleanup
     * @type {Object<string, *>}
     */
    const configObject = {};
    /**
     * @type {import("vue").Ref<Object<string, *>>}
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
   * @returns {import("vue").Ref<Object<string, *>|UiConfigObject>}
   */
  get config() {
    return this._config;
  }

  /**
   * @inheritDoc
   */
  destroy() {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners = [];
    super.destroy();
  }
}

export default UiConfig;
