import { Collection, makeOverrideCollection } from '@vcmap/core';
import { reactive, readonly, ref } from 'vue';

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
 * @property {string} [secondaryButtonTitle]
 * @property {Array<import("./callback/vcsCallback.js").VcsCallbackOptions>} [exitCallbackOptions]
 * @property {Array<import("./callback/vcsCallback.js").VcsCallbackOptions>} [secondaryCallbackOptions]
 * @property {boolean} [menuEntry]
 * @property {boolean} [acceptInput]
 * @property {boolean} [requireInputForSecondary] Whether the Secondary Button is disabled as well as long as the checkbox is not checked.
 * @property {boolean} [enableDontShowAgain] Whether to display a checkbox allowing the user not to see the SplashScreen again. This parameter is relative to moduleId and configuration; the SplashScreen will be shown again in case of any change.
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
 * @property {string} [primaryColor] - an optional primary color to use in all themes, can be overwritten by `vuetifyTheme`
 * @property {boolean} [startingFeatureInfo] - an optional flag whether to activate feature info on startup (default active)
 * @property {string} [positionDisplayEventType] - mouse event, when position display is updated. Either 'click' (default) or 'move'.
 * @property {string} [obliqueFooterTemplate] - A template for rendering information of the current image in oblique mode, e.g. '{{ name }}' printing the image's name
 * @property {string} [helpBaseUrl='https://help.vc.systems/'] - an optional URL to a help landing page
 * @property {TextPageType} [imprint] - an option imprint, will show a link in the footer. Default title is 'footer.imprint.title'.
 * @property {TextPageType} [dataProtection] - an option dataProtection, will show a link in the footer. Default title is 'footer.dataProtection.title'.
 * @property {SplashScreen} [splashScreen] - an option splashScreen, will show a splash Screen on Map Load.
 * @property {CustomScreen} [customScreen] - an option customScreen, will show a Custom Menu Point that opens a window with custom content.
 * @property {string} [favicon] - the favicon to set
 * @property {string} [headerTitle] - the title to display in the tab of the browser
 * @property {boolean} [showLocator] - an optional flag whether to show the Locator in the map.
 * @property {boolean} [hideRotationButton] - an optional flag to hide the Rotator in the map.
 * @property {number} [timePerRotation] - an optional flag that describes the time per rotation in seconds.
 * @property {boolean} [hideHeader] - can be used to hide the default Header of the map
 * @property {boolean} [hideSearch] - can be used to hide the integrated Search bar
 * @property {boolean} [hideMapButtons] - can be used to hide the default Map Buttons
 * @property {boolean} [hideToolbox] - can be used to hide the toolbox
 * @property {boolean} [hideMapNavigation] - can be used to hide the navigation
 * @property {boolean} [hideFooter] - can be used to hide the footer
 * @property {boolean} [hideMyWorkspace] - can be used to hide the myWorkspace button
 * @property {boolean} [hideContentTree] - can be used to hide the contentTree
 * @property {boolean} [hideLegend] - can be used to hide the legend
 * @property {boolean} [hideSettings] - can be used to hide the settings Window
 * @property {boolean} [hideObliqueFooter] - can be used to hide the oblique name in the footer
 * @property {boolean} [overviewMapActiveOnStartup] - can be used to activate the overviewMap on startup
 * @property {boolean} [contentTreeActiveOnStartup] - can be used to activate a contentTree on startup
 * @property {import("@vcmap/core").DisplayQualityOptions} [displayQuality] - the display quality settings
 * @property {import("./vuetifyPlugins/vuetify.js").VcsThemes} [vuetifyTheme] - Vuetify Theming, also see vuetify configuraton https://vuetifyjs.com/en/features/theme/
 * @property {boolean} [openLegendOnAdd] - open the legend window, if new layer has a config
 * @property {number} [overviewMapScaleFactor] - can be used to apply a scale factor the the overviewMap
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
     * @type {import("vue").UnwrapNestedRefs<Object<string, *> & UiConfigObject>}
     * @private
     */
    this._config = reactive({});

    /**
     * @type {import("vue").DeepReadonly<import("vue").UnwrapNestedRefs<Object<string, *> & UiConfigObject>>}
     */
    this._readonlyConfig = readonly(this._config);

    /**
     * @type {import("vue").Ref<boolean>}
     * @private
     */
    this._showSplashScreen = ref(false);

    /**
     * @type {Array<function():void>}
     * @private
     */
    this._listeners = [
      this.added.addEventListener((item) => {
        if (typeof item?.name === 'string') {
          this._config[item.name] = structuredClone(item.value);
        }
      }),
      this.removed.addEventListener((item) => {
        const previousItem = this.getByKey(item?.name);
        if (typeof previousItem?.name === 'string') {
          // still in the collection
          this._config[previousItem.name] = structuredClone(previousItem.value);
        } else if (typeof item?.name === 'string') {
          delete this._config[item.name];
        }
      }),
    ];
  }

  /**
   * @type {import("vue").DeepReadonly<import("vue").UnwrapNestedRefs<Record<string, *> & UiConfigObject>>}
   */
  get config() {
    return this._readonlyConfig;
  }

  /**
   * @type {import("vue").Ref<boolean>}
   */
  get showSplashScreen() {
    return this._showSplashScreen;
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
