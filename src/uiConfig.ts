import {
  Collection,
  defaultDynamicModuleId,
  makeOverrideCollection,
} from '@vcmap/core';
import type { DeepReadonly, Reactive, Ref } from 'vue';
import { reactive, readonly, ref } from 'vue';
import type { DisplayQualityOptions, moduleIdSymbol } from '@vcmap/core';
import type { VcsCallbackOptions } from './callback/vcsCallback.js';
import type { WindowPositionOptions } from './manager/window/windowManager.js';
import type { VcsThemes } from './vuePlugins/vuetify.js';

export type UiConfigurationItem<T> = {
  name: string;
  value: T;
  [moduleIdSymbol]?: string;
};

export type TextPageType = {
  title?: string;
  url?: URL | string;
  content?: string;
  tooltip?: string;
};

export type SplashScreen = {
  title?: string;
  icon?: string;
  content?: string;
  name?: string;
  checkBoxText?: string;
  buttonTitle?: string;
  secondaryButtonTitle?: string;
  exitCallbackOptions?: Array<VcsCallbackOptions>;
  secondaryCallbackOptions?: Array<VcsCallbackOptions>;
  menuEntry?: boolean;
  acceptInput?: boolean;
  /** Whether the Secondary Button is disabled as well as long as the checkbox is not checked. */
  requireInputForSecondary?: boolean;
  /** Whether to display a checkbox allowing the user not to see the SplashScreen again. This parameter is relative to moduleId and configuration; the SplashScreen will be shown again in case of any change. */
  enableDontShowAgain?: boolean;
  position?: {
    width?: string;
    height?: string;
    maxHeight?: string;
    maxWidth?: string;
  };
};
export type CustomScreen = {
  title?: string;
  icon?: string;
  content?: string;
  name?: string;
  windowPosition?: WindowPositionOptions;
};

export type UiConfigObject = {
  /** the company logo to display. this will override any and all css overrides */
  logo?: string;
  /** the company logo to display in dark mode. this will override any and all css overrides. if not set, the `logo` will be used */
  logoDark?: string;
  /** an alternative logo to display in mobile view */
  mobileLogo?: string;
  /** an alternative logo to display in mobile view and dark mode. if not set, the `mobileLogo` will be used */
  mobileLogoDark?: string;
  /** an optional title to display next to the company logo */
  appTitle?: string;
  /** an optional primary color to use in all themes, can be overwritten by `vuetifyTheme` */
  primaryColor?: string;
  /** an optional flag whether to activate feature info on startup (default active) */
  startingFeatureInfo?: boolean;
  /** an optional flag whether to enable deep picking via right click context menu (default active) */
  enableDeepPicking?: boolean;
  /** mouse event, when position display is updated. Either 'click' (default) or 'move'. */
  positionDisplayEventType?: 'click' | 'move';
  /** A template for rendering information of the current image in oblique mode, e.g. '{{ name }}' printing the image's name */
  obliqueFooterTemplate?: string;
  /** an optional URL to a help landing page */
  helpBaseUrl?: string;
  /** an option imprint, will show a link in the footer. Default title is 'footer.imprint.title'. */
  imprint?: TextPageType;
  /** an option dataProtection, will show a link in the footer. Default title is 'footer.dataProtection.title'. */
  dataProtection?: TextPageType;
  /** optionnal, additional information to show in the footer as links or dialogs */
  footerInformation?: TextPageType[];
  /** an option splashScreen, will show a splash Screen on Map Load. */
  splashScreen?: SplashScreen;
  /** an option customScreen, will show a Custom Menu Point that opens a window with custom content. */
  customScreen?: CustomScreen;
  /** the favicon to set */
  favicon?: string;
  /** the title to display in the tab of the browser */
  headerTitle?: string;
  /** an optional flag whether to show the Locator in the map. */
  showLocator?: boolean;
  /** an optional flag to hide the Rotator in the map. */
  hideRotationButton?: boolean;
  /** an optional flag that describes the time per rotation in seconds. */
  timePerRotation?: number;
  /** can be used to hide the default Header of the map */
  hideHeader?: boolean;
  /** can be used to hide the integrated Search bar */
  hideSearch?: boolean;
  /** can be used to set the pitch angle of the viewpoint of features zoomed to from Search, in degrees. Defaults to -35 degrees. */
  searchViewpointPitch?: number;
  /** can be used to hide the sharee button */
  hideShareButton?: boolean;
  /** can be used to hide the menu button */
  hideMenuButton?: boolean;
  /** can be used to hide the default Map Buttons */
  hideMapButtons?: boolean;
  /** can be used to hide the toolbox */
  hideToolbox?: boolean;
  /** can be used to hide the navigation */
  hideMapNavigation?: boolean;
  /** can be used to hide the footer */
  hideFooter?: boolean;
  /** can be used to hide the myWorkspace button */
  hideMyWorkspace?: boolean;
  /** can be used to hide the contentTree */
  hideContentTree?: boolean;
  /** can be used to hide the rendering order action in the contentTree, which allows for temporary changes of rendering order */
  hideContentTreeRenderingOrder?: boolean;
  /** can be used to hide the legend */
  hideLegend?: boolean;
  /** can be used to hide the settings Window */
  hideSettings?: boolean;
  /** can be used to hide the oblique name in the footer */
  hideObliqueFooter?: boolean;
  /** can be used to hide the panorama name in the footer */
  hidePanoramaFooter?: boolean;
  /** can be used to activate the overviewMap on startup */
  overviewMapActiveOnStartup?: boolean;
  /** can be used to activate a contentTree on startup */
  contentTreeActiveOnStartup?: boolean;
  /** the display quality settings */
  displayQuality?: DisplayQualityOptions;
  /** Vuetify Theming, also see vuetify configuraton https://vuetifyjs.com/en/features/theme/ */
  vuetifyTheme?: VcsThemes;
  /** open the legend window, if new layer has a config */
  openLegendOnAdd?: boolean;
  /** automatically close the legend window, if no layer has a config */
  autoCloseLegend?: boolean;
  /** can be used to apply a scale factor to the overviewMap */
  overviewMapScaleFactor?: number;
};

export function isUiConfigurationItem<K extends keyof UiConfigObject>(
  item: UiConfigurationItem<unknown>,
  key: K,
): item is UiConfigurationItem<NonNullable<UiConfigObject[K]>> {
  return item.name === key;
}

class UiConfig extends Collection<UiConfigurationItem<unknown>> {
  private _config: Reactive<Record<string, unknown> & UiConfigObject> =
    reactive({});
  private _readonlyConfig: DeepReadonly<
    Reactive<Record<string, unknown> & UiConfigObject>
  > = readonly(this._config);
  private _showSplashScreen = ref(false);
  private _listeners: Array<() => void>;
  constructor(getDynamicModuleId: () => string = () => defaultDynamicModuleId) {
    super();
    makeOverrideCollection<UiConfigurationItem<unknown>, UiConfig>(
      this,
      getDynamicModuleId,
    );

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

  get config(): DeepReadonly<
    Reactive<Record<string, unknown> & UiConfigObject>
  > {
    return this._readonlyConfig;
  }

  get showSplashScreen(): Ref<boolean> {
    return this._showSplashScreen;
  }

  getByKey<K extends keyof UiConfigObject>(
    value: K,
  ): UiConfigurationItem<NonNullable<UiConfigObject[K]>> | undefined;
  getByKey(value: unknown): UiConfigurationItem<unknown> | undefined;
  getByKey(value: unknown): UiConfigurationItem<unknown> | undefined {
    return super.getByKey(value);
  }

  destroy(): void {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners = [];
    super.destroy();
  }
}

export default UiConfig;
