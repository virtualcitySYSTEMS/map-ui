# 5.1

- WindowManager now handles `close` events emitted by vue components for closing itself
- add new icon for multiview button
- add rename functionality to VcsList and CollectionComponent
- Add property `customClasses` to all vcs buttons for custom styling using css classes
- Add multi-view plugin to external plugins and demo application
- Add position display to footer

# 5.0.3

- Fix translation of VcsDataTable header

# 5.0.1

- Fix home button and add default starting viewpoint
- Fix VcsImageStyleSelector Default Icons, using dataUris now
- Add helper `getActionFromOptions` which enforces defaults of VcsAction interface

# 5.0.0

- Updated @vcmap/core to version 5.0.0
- Updated minimum Node Version to 18
- Changed I18n behaviour for Plugins
- More consistent Code styling (filenames)
- If started in preview mode, `--plugin-registry` can be used to load build Plugins from a plugin-registry (e.g. VC Publisher)
- Added debug warning if the mapVersion range of a loaded Plugin does not satisfy the @vcmap/ui version
- Reorganized inline plugins in /plugins/@vcmap-show-cases/ folder, (now also have a `src` folder)

# 5.0.0-rc.31

- Several Bugfixes
- Updated @vcmap/core
- Updated @vcmap-cesium/engine to 4.0.x
- Updated openlayers to 7.5.2
- I18nCollection is now an OverrideCollection, and will handle pluginMessages separatly

# 5.0.0-rc.30

- Add new input component `VcsChipArrayInput` for arrays
- Adds `VcsVectorPropertiesComponent` to model VectorPropertyOptions and integrates the component into then new `@vcmap-show-case\vector-properties-example` plugin.
- Changed Plugin Version handling
- Added AbstractConfigEditor Interface to plugin Interface, to enable configuring plugin configs in the app-configurator
- Added getDefaultOptions/getConfigEditors to Plugin Interface
- Fix subtree action and weight of subtrees

# 5.0.0-rc.29

- Fixed a Bug where the VcsInputField emitted a `input` event twice
- Fixed Overviewmap layer order
- Changes WindowState.headerTitle in the windowManager to optionally set an array of strings, which will all be translated individually
- Fixes rendering of child windows in the windowManager
- Add `getHelpUrlCallback` method to VcsUiApp, which returns a callback function providing a URL to help page. The URL is based on a new `UiConfigObject` property `helpBaseUrl`, version and current app locale.
- Add new optional property `infoUrlCallback` to WindowState, which enables the usage of `getHelpUrlCallback`.
- Changed `PolygonIcon` to `PointIcon` the icon was already a Point
- Changes VcsDataTable to forward necessary Properties for Serverside rendering to the vuetify Component
- The `i18nPluginSymbol` is now beeing exported

# 5.0.0-rc.28

- ContentTree: uses static subtree ids, which allows updating content tree with open reactive window
- Adds `overflowCount` option to collectionComponent
- Updated @vcmap/core

# 5.0.0-rc.27

- Add a required prop to `VcsLabel` marking input fields as required using an asterisk.
- Adds `VcsFillSelector`, `VcsStrokeSelector`, `VcsFillMenu` and `VcsStrokeMenu` components to model fill and stroke of style objects and integrates them into then new `@vcmap-show-case\style-input-example` plugin.
- Adds `VcsImageSelector` and `VcsImageMenu` components to model ol/style/Image JSON representation and integrates them into then new `@vcmap-show-case\style-input-example` plugin.
- Adds `VcsTextSelector` and `VcsTextMenu` components to model ol/style/Text JSON representation and integrates them into then new `@vcmap-show-case\style-input-example` plugin.
- Adds `VcsVectorStyleComponent` which wraps `VcsImageMenu`, `VcsTextMenu`, `VcsFillMenu` and `VcsStrokeMenu` to model VectorStyleItemOptions and integrates it into then new `@vcmap-show-case\style-input-example` plugin.
- The VcsAction now has a `hasUpdate` property and the VcsActionButtonList forwards the property to the Button Renderer
- Fixed Cesium missing Thirdparty lib. (Draco encoded datasets should now work)
- I18n Text review
- Add new WindowSlot `dynamicChild`, which binds a window to a parent window.
- Add `expandable` property to VcsFormSection

# 5.0.0-rc.26

- Added new `VcsSlider` component and integrated it inside `@vcmap-show-case\form-inputs-example\FormInputsExample.vue`
- New @vcmap/Core Dependency fixed Bug with vectorTileLayer
- Added Draw Plugin to Demo Application and external plugins
- Added Shadow Plugin to Demo Application and external plugins
- Changed ZoomToAll Button in Search to use new VcsFormButton
- Updated ViteJS to version 4.3
- Change featureInfo to be an override collection and both featureInfo and featureInfoClassRegistry to be an VcsUiApp property
- Add olcs attribute key filtering to `AbstractFeatureInfoView` getAttributes
- Hide ui elements depending on configuration (navigation, overview map, feature info)
- Add `vue-i18n` instance to app to offer translate methods outside vue components.
- Add optional `weight` property to buttonComponents affecting the displaying order
- Button refactoring: added new component `VcsToolButton` to be used in Navbar, simplified `VcsButton` and added documentation.
- Fixes file input for `VcsTextfield`
- Add `VcsCallback` concept and implement onClick, onActivate and onDeactivate for content tree items
- Add new `CollectionManager` and refactored `CategoryManager`. See [Collections](documentation/COLLECTIONS.md).

# 5.0.0-rc.24

- VcsAction has a disabled state
- Adds the `Notifier` API to `VcsUiApp`.
- Adds a `VcsList` component for standard item list rendering.
- Adds new `VcsWizard` component as stylized wrapper of Vuetify VStepper
- `WindowManager` refactoring and better window handling.
- Added `background` flag to `VcsAction`
- Refactoring of the input components design and functionality.
- Fixed the error display behaviour of input components in combination with a form element.
- Adapt `initApp` method and add new methods `initAppFromModule` and `initAppFromAppConfig` to be used for initialization in `start.js`.
- Updating `Context` to `VcsModule`
- Adds `serializeModule` method to `VcsUiApp`, which serializes all ui specific properties of the app for a provided module id.
- Changing `i18n` collection to have unique key `name`.
- Add new button component `VcsFormButton`.
- Updated Cesium to v1.105
- Updated Openlayers to 7.3.0
- Add draggable option to `VcsList`.

# 5.0.0-rc.15

- Update Openlayers to version 7.0.0
- use new core postRenderHandler in NavigationControls and OverviewMap
- Update vite to version 3.2.0 and vitest to 0.24.3
- Renamed Navbar component to VcsNavbar
- Added help concept for VcsFormSection
- Added attributions for maps, layers and oblique collections
- Fixed balloon placement
- Fixed FeatureInfo breaking, if currently selected feature was unloaded from Cesium Scene
- Fixed `getState` for url. Checking now, if layers have style before handling style.
- Fixed OverviewMap z-index. Oblique layers have not been shown properly before.
- Fixed OverviewMap synchronization on startup in 2D.
- Introducing error handling in plugin hooks `onVcsAppMounted` and `initialize`.
- Fixed avoiding html attributes as vue properties by renaming.
- Added documentation for content tree.
- Adds possibility to add actions on window component headers
- WindowComponent props are now also passed to custom window header components
- Adds provide API to window components

# 5.0.0-rc.14

- Added vcs rotation icons and replaced the former used mdi oblique rotator icons in obliqueRotation.vue
- Updated buttonExample plugin to vue 2.7 by making plugin state reactive
- Added support of tooltips for ContentTreeItems. Tooltips can be defined in config, if none is defined title is used instead.
- Harmonized export of classes. Now all classes are exported as default export at the end of the file.
- Fixed bug, which prevented navigation on mobile devices.
- Fixed text rendering of VcsActionButtonList on Firefox

# 5.0.0-rc.12

- Adds further vcs-icons from layout catalog: VCS Wireframe 8.8.xd, also updated some icon layouts as shown in the same catalog
- Fixed bug for toolbox submenu where the icons did overflow if the menu above was shorter than the submenu
- Changed the toolbox topmenu for layout discussion - if the submenu ist open and longer than the menu above the bottom corners shouldn't be rounded
- Refactoring of ToolboxManager. Extension providing three toolbox component types. See [ToolboxManager](documentation/TOOLBOX.md).

# 5.0.0-rc.11

- Added new Components Concept with the new `categoryManager` see [Components](documentation/CATEGORIES.md).
- Added new I18n concept, see [I18n](documentation/INTERNATIONALIZATION.md).
- Redesigned VcsApp.vue setup to export `setupPluginMountedListeners` & `setupMapNavbar`
- Consistent plugin handling: removal from managers & i18n is managed by the VcsUiApp and not the VcsApp.vue
- Added `ContextMenuManager` to the vcs app, see [Context Menu](documentation/CONTEXT_MENU.md).
- Adds a `FeatureInfo` concept, see [Feature Info](documentation/FEATURE_INFO.md)
- Added `UiConfig` for core ui configuration, see [Ui Config](documentation/UI_CONFIG.md).
- Adds a `State` API, can be used to create an URL to share, see [State](documentation/STATE.md).
- Fixed Bug where the title of a VcsTreeViewLeaf did overflow. Text Overflow is not set to ellipsis. The full title is shown in the html title
- Adds a `VcsRadio` component for radio button groups.
- Adds a `Legend` tool, where layer or style information can be shown, see [Legend](documentation/LEGEND.md).
