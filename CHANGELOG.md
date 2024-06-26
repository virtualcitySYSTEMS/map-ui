# 5.2.4

- Fixes bug in createZoomToFlightAction
- Updated Planning Plugin Version to 5.2 in VCMap Bundle

# 5.2.2

- Fixes a bug, where panel resizing was not stopped on mouse leave
- Updated @vcmap/core
- Added search-esri, search-wfs and link-button Plugins to MapBundle

# 5.2.1

- Fixes a bug in the windowManager where positions could not be given as a number string
- Add export of `replaceAttributes` which inserts attributes into a template string.
- Fixes a bug in app `getState` where empty plugin state objects where added to the app state
- Adds `IframeWmsFeatureInfoView` to render text/html featureInfo responses of WMS layers

# 5.2

- Add flight actions for import, export, zoom and list item player
- Adds the `MarkdownFeatureInfoView` to render simple markdown feature info views.
- Adds the `MarkdownBalloonFeatureInfoView` to render simple markdown balloon feature info views.
- Add new PanelManager to add and remove panels. See [PanelManager](documentation/PANELS.md)
- Add possibility to define width and height options for BalloonFeatureInfo
- Add support for template strings in window state headerTitle. See [FeatureInfo](documentation/FEATURE_INFO.md#window-title)
- Fix bug, where balloons were clipped to target
- Fixes a bug where CollectionManager `removeActions` was not working as expected
- Fixes content tree state, when switching map view
- Updates @vcmap/core to version 5.2.0

# 5.1.9

- Fixes a bug in FeatureInfo, where tags were not serialized
- Fixes a bug in the search Button, where adding a second searchImpl removed the Button.
- Fixes a bug where the `type` of `search` and `suggest` in a SearchImpl was not async.
- Fixes a bug in search result highlighting where spaces were removed
- Replaces deprecated core function `hasSameOrigin` with `isSameOrigin`

# 5.1.8

- Fixes a bug in FeatureInfo, when attribute values are null
- fixes an issue where collection components could not be rendered without collection manager by adding CollectionComponentStandalone.vue to render the content of one single CollectionComponentClass in a VcsFormSection.
- Fixes an issue, where radio button labels could not have different width

# 5.1.7

- Fixes a bug where changing the activemap to `null` did not work.
- updated @vcmap/core to 5.1.

# 5.1.5

- Fixes `VcsViewpointComponent.vue` opened in ObliqueMap
- Set default title for imprint and data protection
- Fix emitting focus and blur event in `VcsTextArea.vue`
- Adds new UI configs: `headerTitle` & `favicon` to set the sites behavior.
- Adds a consistent way to import features from a set of geojson files `importToLayer`,
  which can be used in the `createListImportAction` callbacks.
- Changed map title font size and weight
- Fixes a bug in content tree, where init open was not applied correctly

# 5.1.4

- Fix FeatureInfo showing empty attribute value objects
- Fix bug when defaultViewpoint is null
- Fix bug for overview map in oblique
- Added two new icons for point measurement in 2D `2DPointIcon.vue` and 3D `3DPointIcon.vue`
- Changed layout for icon `AxisIcon.vue` and `PointMeasurementIcon.vue`, switched labels of Z and Y axis
- Adds a `closed` event to the `ContextMenuManager` to listen to context menu closed for cleanup.
- Adds action titles to the `CollectionComponentClass`: `removeTitle` `bulkRemoveTitle` and `renameTitle`.
  Additionally, adds `editTitle` & `bulkEditTitle` to the `EditorCollectionComponentClass` interface creation.
- updated @vcmap/core to 5.1.3
- fixed a bug where the overviewmap did not specifiy the zIndex of oblique layer correctly.

# 5.1.3

- Fix FeatureInfo tooltip
- Add importing state to `ImportComponent.vue`
- Added new icon for transparent terrain
- Fix title computed in `VcsViewpointComponent.vue`
- Fix position display to listen to uiConfig changes of current module
- Added an `externalZIndex` API to the window manager. This allows for non window
  DOM elements to use the window z ordering.
- The toolbar now respects z ordering of windows and can be brought to the top.

# 5.1.2

- Fixed a bug where VcsDataTable would reset the page, if a server-side pagination changes the items.
- Updated @vcmap/core to 5.1.1

# 5.1.1

- loading plugins will now add the mapVersion to the plugin request.
- fix duration input of `VcsViewpointComponent.vue`

# 5.1.0

- WindowManager now handles `close` events emitted by vue components for closing itself
- Add new icon for multiview button
- `CollectionComponent` class is renamed and exported as `CollectionComponentClass`.
- Add rename functionality to `VcsList` and `CollectionComponentClass`
- Add property `customClasses` to all vcs buttons for custom styling using css classes
- Add cesium-filters plugin to external plugins and demo application
- Add multi-view plugin to external plugins and demo application
- Add position display to footer
- Add `tags` option to `FeatureInfoViewOptions` to render values of specific attribute keys using special html elements
- The toolbar can now be context senitive. Toolbox components may be given a
  toolboxNames to only be rendered in certain contexts.
- Add new icons for measurement tool buttons - point measurement and 2d height for oblique view
- Adds the `FlightContentTreeItem` to the content tree to control flights from the content tree.
- Adds `VcsCoordinate.vue`, a component providing a simple coordinate input
- Adds `VcsViewpointComponent.vue`, a component for editing viewpoint options
- Added additional properties for `AbstractConfigEditor.vue`: submitButtonTitle for custom button titles and setConfigOnCancel, which ensures compatability.
- We now provide autogenerated TypeScript declarations.
- Add a new icon `ComponentPlusIcon.vue` for the 'Add to my Workspace' button inside toolbox component window.
- Adds `VcsExtent.vue` and `extentActions.js`, extent input component and extent action helper functions
- Change type of CollectionComponentClass items from `VcsListItem` to `CollectionComponentListItem`. Add sorting of list item actions.
- Extend VcsList by four slots: `#item.prepend-title`, `#item.title`, `item.append-title` to adapt the list item title and `#item.intermediate` to add content between list items.
- Add ui components for flights: `VcsFlightComponent.vue`, `VcsFlightAnchorsComponent.vue`, `VcsFlightPlayer.vue` and `VcsFlightEditor.vue`
- Changed representation of units on `VcsTextField.vue`. Units are now rendered in append slot, the value is not mutated anymore.
- Adds the functionality to create and display Imprint and Data Protection Information as Link or Markdown Text
- Adds `markdownHelper.js` to translate markdown into Html
- Change style of `VcsList.vue` and move select all as action to overflow. Add clear selection action. Update `CollectionComponent.vue` and `CollectionComponentList.vue` according to `VcsList.vue` changes.
- Adds disabled prop to `VcsLabel.vue` which marks label as disabled by adding transparency.
- Adds hasUpdate to `category-manager` button, in case an item from the dynamic module is added to any category while `category-manager` window is closed.
- Adds some components to help with feature editing, such as `VcsFeatureStyleComponent`, `VcsFeatureTransform` and `VcsFeatureEditingWindow`.
- Add `listActions.js` with action helpers for list item and list bulk actions, e.g. rename, delete, import and export actions
- Add `editorCollectionComponentClass.js`, which defines select and editor window behaviour for list items of collections or category collections.
- Adds `autoClose` property to `AbstractConfigEditor.vue`. This allows custom handling of window closing, e.g. only close window, if submit or cancel action was successful.
- Change VcsDataTable Behaviour, so that if the items change, the current page will be reset to page 1
- Fixes initial transformation mode in `VcsFeatureEditingWindow.vue`
- Fixes bug where windowManager closes only one child window
- Fixes VcsSlider to also accept number 0 inputs
- Fixes BalloonFeatureInfoView to also be able to deal with array of numbers as a value
- Change apply button to icon in `VcsFeatureTransforms.vue`
- Fixes layout issue where input placeholder text had been cut of
- Changed input layout, so that the bottom border is extended for append items
- Add `getListItemForItem` API to `CollectionComponentClass.js`.
- Updated to @vcmap/core 5.1
- Added viewshed plugin to demo application and external plugins
- Added measurement plugin to demo application and external plugins
- Added flight plugin to demo application and external plugins
- Added callback functions `onSubmit`, `onReset` and `onCancel` as props to `AbstractConfigEditor.vue`.
- Added `version` option to `getHelpUrlCallback` function to allow for mapVersion independent Help.
- Added `createSupportedMapMappingFunction` helper to handle supported maps on list items in CollectionComponentClass
- Changed behaviour of `CategoryManager` to per default only include items of the defaultDynamicModuleId. Additional moduleIds can be added via newly introduced `addModuleId` API.

### Ui Behaviour ChangesF

- `CollectionManager.vue` now opens `show all` list inside its own Component.
- `CollectionComponent.vue` now emits an `openList` event instead of opening a list view in another window.
- `CollectionComponentList.vue` now emits a `closeList` event on using the `show less` Button.
- FeatureInfo Windows now open in DYNAMIC_RIGHT per default.
- Child windows can now be opened without having the parent open. In
  this case, the child window acts as a dynamic left window.

# 5.0.3

- Fix translation of VcsDataTable header
- Fixes a bug where disable was not properly propagated on
  tree view items and form sections.
- Fixes a bug where file inputs would not emit input events.
- Fixes a bug where removed items were not removed from CollectionComponent selection
- Adds new toolbar-example plugin
- Fixes createZoomToFeatureAction to be aware of feature geometry changes
- Fixes ContentTreeItem serialization by adding missing properties in toJSON
- Allow tristate for SelectToolboxComponent by passing background prop and make all toolbox components shallow reactive
- Fix style selector to handle defaultStyle and an empty style array
- Fixes Bug in tableFeatureInfoView where the option `showSearchBar` could not be set to false;

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
