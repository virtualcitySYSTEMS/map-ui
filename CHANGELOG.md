# 6.0.8

- Fixed a bug in the @vcmap/core

# 6.0.7

- Fixes a bug that masked some application titles that were too long.
- Fix contentTreeActiveOnStartup behaviour
- Add vcs-solar-balloon plugin
- Adds the `VcsSnapTo` component to set the snap to values for editor sessions.
- Renders the `VcsSnapTo` component by default in the VcsFeatureEditingWindow when the appropriate session is set.

# 6.0.6

- Fix IframeFeatureInfoView, which bound attributes on the iframe HTML element. Document how to prevent attrs inheritance. See [FEATURE_INFO.md](./documentation/FEATURE_INFO.md)

# 6.0.5

- Fixes a bug in `VcsExtent`, where feature were not reset, if extent creation was canceled
- Fixes a bug where selecting a HEX color would fail and fallback to black
- Fixes a bug where selecting an EPSG in PositionDisplay could fail
- Fixes a bug, where `Select all` was disabled after adding the first entry in a category.
- Changed the Behaviour of the PositionDisplay to not display 1000 seperators.
- Added locale and NumberFormatOptions to the `numberToLocaleString` function
- Add layer-slider plugin

# 6.0.4

- changes `placeOnTerrain()` in `VcsFeatureTransforms` to not use selectSession anymore
- fix `@vcmap-show-case/plugin-editors` displaying of window header and info url
- add `create-link` plugin to base.config.json

# 6.0.3

- Fixes handling of uiConfig changes on `splashScreen`, `contentTreeActiveOnStartup` and `hideMapNavigation`

# 6.0.2

### Fixes

- fixed an English localization error for help buttons: 'Further Information'
- fixed a bug in the VcsViewpointComponent, where syncing the view would reset the animate and duration property
- fixed a bug in VCSSelect where v-model was not allowed to be an Object

# 6.0.1

### Fixes

- fixed a Problem with Plugin dependencies

# 6.0.0

### Updated Peer dependencies

- Updated @vcmap/core to 6.0.0
  - Updates Cesium to 1.121
  - Updated Openlayers to 10.2.1
- Updated Vue to 3.4
- Updated Vuetify to 3.7

### New Plugins

- module-selector a new plugin, which allows configuring and selection Modules.
- line-of-sight a new plugin to calculate the visibility along a line.

### Breaking Changes

- VcsDatePicker now expects a `Date` input.
- `vuetify` is no longer global, but attached to the `VcsUiApp`.
  - `getDefaultPrimaryColor` now requires the app as a parameter.
  - `getColorByKey` now requires the app as a parameter.
- `i18n` update
  - We use the new `Composition API` and not the legacy API.
  - The `$t` mixin no longer supports any other type of input but `string`. If you have potentially undefined input (user input or configurations such as `item.tooltip`) you can use the `safe translate`mixin `$st` which will return `''` on null or undefined.
- `ContentTreeCollection.getTreeOpenStateRef` now returns `string[]` instead of `Ref<string[]>` and was renamed to `getTreeOpenState`
- Changed the `Notification.open` type, it is now a boolean. To get the ref, there is a readonly `openRef` property.
- access to color scss variables changed, `var(--v-primary-base)` becomes `rgb(var(--v-theme-primary))` see:https://vuetifyjs.com/en/getting-started/upgrade-guide/#theme
- `VcsList` component now only accepts reactive items via the API (using v-model still works the same).
  - `createListItemRenameAction` and `@rename-item` event has been removed.
  - Renaming is now handled directly by the new `VcsListItem` component. You need to provide a titleChanged function on the item!
  - The `VcsListItem` interface is extended by a prop `renamable`, which can be a boolean or action options.
- @vcmap/ui css utility classes are removed (https://github.com/virtualcitySYSTEMS/map-ui/tree/release-v5.2/src/styles/utils), use vuetify utility classes: https://vuetifyjs.com/en/styles/borders/#usage
- Globally removed `dense` property of all Components, which supported `dense` Components will now render in the vcs default
- Globally removed `noPadding` property of all Components, which supported `noPadding`, default component padding can be deactivated by adding py-0 to the component
- `VcsTooltip.vue` is removed. Use `v-tooltip` instead.
- Legacy style `legend` handling was completely removed. Use the new `properties.legend`.
- VcsTextField
  - `showSpinButtons` has been removed, this is now the default behaviour, can be changed with the vuetify `hideSpinButtons` api
  - added `tooltip` to show a tooltip on hover over the element
  - progress bar changes: loading="primary" can now be used to get a progress bar in the primary color
  - input type `file` has been moved to a new component `VcsFileInput.vue`
- `VcsRadioGrid.vue` is removed. Use `VcsRadio` with properties `inline`, `labelPosition="top"` and `class="d-flex justify-center"` instead.
- `ImportComponent.vue` has been renamed to `VcsImportComponent.vue` and is now exported as `VcsImportComponent`
- `FileDrop.vue` has been renamed to `VcsFileDrop.vue` and is now exported as `VcsFileDrop`
- `setupExtentComponentActions()` has no longer a param `disabled`. Change the disabled state on the returned actions instead.
- `PluginEditorComponent` is more strictly typed. You must ensure the types of the `setConfig` and `getConfig` props actually fit the interface.
- Removed `VcsCustomScreen.vue`. Use `VcsTextPage.vue` instead.
- Changed interface of `VcsTable.vue`. You can provide `keyHeader` and `valueHeader` props instead of a `headers` array.
- Changed featureInfo classes `IframeFeatureInfoView`, `MarkdownFeatureInfoView` and `MarkdownBalloonFeatureInfoView` to all support same markdown template syntax and style expressions for attribute replacement.
- Removed `show` property from `VcsHelp.vue`. Use `<VcsHelp v-if="">` instead.
- Changed API of `AbstractConfigEditor.vue`.
  - No longer calls callback props `onSubmit`, `onCancel` and `onReset`. Use event handler instead.
  - Removed prop `setConfigOnCancel`. Explicitly add a `@cancel` event listener, if required.
- The `title` property for plugin editors has moved from `PluginConfigEditorComponent` to the `PluginConfigEditor`.
- Plugins which provide editors can no longer return promises from `getConfig` or `setConfig`.
- `StyleSelector.vue` expects now a layerNames `Array<string>` prop instead of a single layerName
- Changed the parameters of `getAllowedEditorTransformationModes` to respect new capabilities.
- Changed the type of `WindowComponentOptions.state`. The state now has its own type and accepts `Ref` or `ComputedRef` for certain properties.

### Changes

- New API story description for VCS Components, see: [API story docs](https://lib.virtualcitymap.de/ui/6.0/story/) or `npm run story:dev`
- New UI/UX guidelines (WIP) see: [Guidelines](./documentation/guidelines/VCMap_UI.md)
- New Query parameter documentation see: [Query parameters](./documentation/QUERY_PARAMETER.md)
- The current oblique image name is shown in the footer.
- LayerGroupContentTreeItem will now also support a styleSelector which will activate the selected style on all Layers in the Group.
- Conditional Markdown Templates. Allows for Conditions and Loops over the Feature Attributes. Can be used to create more complex balloons and Featureinfo windows.
  - Removed `replaceAttributes` and renamed to `renderTemplate`.
  - Top level attributes with spaces in their names shall no longer be expanded with
    `["spaced attributes"]`, but `"spaced attribute"`. Nested spaced attributes remain as `nested["spaced attribute"]`
  - Templates now support ol style expressions which evaluate to a string in normal attribute expansion (`{{ attribute }}` can now
    also be written as `{{ ["get", "attribute"] }}` or any other style expression).
  - Templates can now be rendered with expressions. These follow mustache syntax using the special
    expansions `{{#if $expression}}`, `{{elseif $expression}}`, `{{else}}` and
    have to be closed with `{{/if}}`. Expression can be attribute keys directly or
    any ol style expression that will evaluate to a boolean (same as with normal attribute expansion, just not a string).
  - Templates can now iterate over Arrays and Objects to render a block multiple times using the `{{#each (item) in object}}` syntax.
- Several changes in the default texts/tooltips.
- New `VcsProjection` component.
- panelManager now has a `positionChanged` event, which is raised whenever a panel position changes
- VcsTextPage now uses i18n to translate the url, can be used to configure a locale aware imprint or data privacy
- There is a new VcsMarkdown component that should be used for rendering markdown text.
- There is a new VcsExpansionPanel component that should be used for expandable sections.
- `VcsLabel`
  - added tooltip and tooltipPosition
- `VcsFormattedNumber`
  - added tooltip and tooltipPosition
- `VcsSlider`
  - added tooltip and tooltipPosition
- Added `useComponentId()` helper to generate unique html ids for inputs with labels.
- Every VCS Component has now the component name as a class, `<VcsMainMap class="vcs-main-map">`

### New uiConfig Options

- `obliqueFooterTemplate` can be used to change the template which is used to render the current image name in the footer
- `hideHeader` can be used to completely hide the Header
- `hideSearch` can be used to hide the default search button, can be used to implement a custom search ui.
- `hideMapButtons` can be used to hide the default map buttons.
- `hideToolbox` can be used to hide the default toolbox.
- `hideMapNavigation` can be used to hide the whole map navigation.
- `hideMyWorkspace` can be used to not show the myWorkspace section.
- `hideContentTree` can be used to hide the default ContentTree, can be used to implement a custom contentTree ui.
- `hideLegend` can be used to hide the Legend.
- `hideSettings` will hide the settings button in the burger menu.
- `hideObliqueFooter` can be used to now show the current oblique image name in the footer
- `overviewMapActiveOnStartup` will open the overviewMap on startup
- `contentTreeActiveOnStartup` will open the contentTree on startup
- `openLegendOnAdd` will automatically open the legend window if a new legend entry appears
- `theming`: it is now possible to change default vuetify Theming in the config, for example the default fontsize, or fontfamiliy can be changed.
  - example configuration see: [config](https://github.com/virtualcitySYSTEMS/map-ui/blob/main/config/theming.config.json)
  - default settings see: [default settings](https://github.com/virtualcitySYSTEMS/map-ui/blob/main/src/vuePlugins/vuetify.js#L64)

### Bugfixes

- Fixed a problem that windows were not focused after opening.
- Fixed a problem, where layers could not be shown in the overviewmap, if mapNames was used.
- Fixed several problems with the flightplayer, where different instances and ui components where not correctly synchronized.
- Fixed a problem where attributions where shown, but the source was not visible.

# 5.3.6

- Added export `LegendTypes` and `StyleRowType` enums and typedefs from `legendHelper.js`

# 5.3.5

- Oblique fallback warnings have been re-instated as notifications.

# 5.3.4

- Update @vcmap/core to 5.3.2 to fix a reading legacy oblique datasets

# 5.3.3

- Updates `splashScreen` to use the filled variant of the button.
- Fixes bug in `createSupportedMapMappingFunction` where `mapCollection.activeMap === null` caused an error
- Update @vcmap/core to 5.3.1 to fix a Declarative Style Icon rendering Problem in 2D

# 5.3.2

- Fixes Bug in `splashScreen`

# 5.3.1

- Fixes Bug in `splashScreen`
- Added @vcmap/walk plugin

# 5.3

- Added new uiConfig options `splashScreen` and `customScreen` to allow showing splashscreens or additional help screens
- Added locator for mobile
- Added support for setting display quality
- Fixes a bug in overviewMap, where an error was thrown when in 3D viewpoint had no groundPosition
- Fixes anchor of overviewMap position image
- Changes initialization of `mapClicked` event of overviewMap to happen on creation.
- Adds disabling MapNavigation components when for the active map `movementApiCallsDisabled` is true

# 5.2.4

- Fixes bug in createZoomToFlightAction
- Updated Planning Plugin Version to 5.2 in VCMap Bundle

# 5.2.2

- Fixes a bug, where panel resizing was not stopped on mouse leave
- Updated @vcmap/core
- Added search-esri, search-wfs and link-button Plugins to MapBundle
- Added locator for mobile

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
