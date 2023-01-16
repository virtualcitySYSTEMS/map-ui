# 5.0.0-rc.next
- Adds the `Notifier` API to `VcsUiApp`.
- Adds a `VcsList` component for standard item list rendering.
- Adds new `VcsWizard` component as stylized wrapper of Vuetify VStepper
- `WindowManager` refactoring and better window handling.
- Added `background` flag to `VcsAction`

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
