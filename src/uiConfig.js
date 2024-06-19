import { Collection, makeOverrideCollection } from '@vcmap/core';
import { ref } from 'vue';

/**
 * @typedef {{
 *   name: string,
 *   value: T
 * }} UiConfigurationItem
 * @template T
 */

/**
 * @typedef {Object} TextPageType
 * @property {string} [title]
 * @property {URL|string} [url]
 * @property {string} [content]
 */

/**
 * @typedef {Object} SplashScreen
 * @property {string|undefined} [title]
 * @property {string} [icon]
 * @property {string} [content]
 * @property {string} [name]
 * @property {string} [checkBoxText]
 * @property {string} [buttonTitle]
 * @property {boolean} [menuEntry]
 * @property {boolean} [acceptInput]
 * @property {Object} [position]
 * @property {string} [position.width]
 * @property {string} [position.height]
 * @property {string} [position.maxHeight]
 * @property {string} [position.maxWidth]
 */

/**
 * @typedef {Object} CustomScreen
 * @property {string|undefined} [title]
 * @property {string} [icon]
 * @property {string} [content]
 * @property {string} [name]
 * @property {import("./manager/window/windowManager.js").WindowPositionOptions} [windowPosition]
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
 * @property {TextPageType} [imprint] - an option imprint, will show a link in the footer. Default title is 'footer.imprint.title'.
 * @property {TextPageType} [dataProtection] - an option dataProtection, will show a link in the footer. Default title is 'footer.dataProtection.title'.
 * @property {SplashScreen} [splashScreen] - an option splashScreen, will show a splash Screen on Map Load.
 * @property {CustomScreen} [customScreen] - an option customScreen, will show a Custom Menu Point that opens a window with custom content.
 * @property {string} [favicon] - the favicon to set
 * @property {string} [headerTitle] - the title to display in the tab of the browser
 * @property {boolean} [showLocator] - an optional flag whether to show the Locator in the map.
 */

/**
 * @extends {Collection<UiConfigurationItem<unknown>>}
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
   * @type {import("vue").Ref<Object<string, unknown>|UiConfigObject>}
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
