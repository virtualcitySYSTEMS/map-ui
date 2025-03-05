import './src/setup.js';
import './src/styles/main.scss';

export { default as StyleSelector } from './src/actions/StyleSelector.vue';
export {
  callSafeAction,
  createMapButtonAction,
  createToggleAction,
  createOverviewMapAction,
  createModalAction,
  createLinkAction,
  createGoToViewpointAction,
  createZoomToFeatureAction,
  searchComponentId,
} from './src/actions/actionHelper.js';
export {
  createDeepPickingAction,
  deepPickingWindowId,
} from './src/actions/deepPickingAction.js';
export { parseAndSanitizeMarkdown } from './src/components/form-output/markdownHelper.js';
export { renderTemplate } from '@vcmap/core';
export {
  createStateRefAction,
  StateActionState,
} from './src/actions/stateRefAction.js';
export {
  createLayerToggleAction,
  createZoomToExtentAction,
  createExtentFeatureAction,
  setupExtentComponentActions,
} from './src/actions/extentActions.js';
export {
  createPlayAction,
  PlayerDirection,
  createStepAction,
  createFastAction,
  createFlightPlayerActions,
  setupFlightListItemPlayer,
  createZoomToFlightAction,
  createFlightVisualizationAction,
  createExportFlightAction,
  importFlights,
} from './src/actions/flightActions.js';
export {
  createListItemDeleteAction,
  createListItemBulkAction,
  createListExportAction,
  createListImportAction,
  importIntoLayer,
} from './src/actions/listActions.js';
export {
  default as VcsCallback,
  executeCallbacks,
} from './src/callback/vcsCallback.js';
export { default as ActivateLayersCallback } from './src/callback/activateLayersCallback.js';
export { default as DeactivateLayersCallback } from './src/callback/deactivateLayersCallback.js';
export { default as GoToViewpointCallback } from './src/callback/goToViewpointCallback.js';
export { default as ApplyLayerStyleCallback } from './src/callback/applyLayerStyleCallback.js';
export { default as StopRotationCallback } from './src/callback/stopRotationCallback.js';
export { default as StartRotationCallback } from './src/callback/startRotationCallback.js';
export { default as AddModuleCallback } from './src/callback/addModuleCallback.js';
export { default as RemoveModuleCallback } from './src/callback/removeModuleCallback.js';
export { default as ActivateClippingPolygonCallback } from './src/callback/activateClippingPolygonCallback.js';
export { default as DeactivateClippingPolygonCallback } from './src/callback/deactivateClippingPolygonCallback.js';
export { default as OpenSplashScreenCallback } from './src/callback/openSplashScreenCallback.js';
export { default as CloseSplashScreenCallback } from './src/callback/closeSplashScreenCallback.js';
export { default as ToggleNavbarButtonCallback } from './src/callback/toggleNavbarButtonCallback.js';
export { default as VcsNavbar } from './src/application/VcsNavbar.vue';
export {
  default as VcsApp,
  setupMapNavbar,
  setupPluginMountedListeners,
  setupCategoryManagerWindow,
  attributionsComponentId,
  categoryManagerWindowId,
  customScreenComponentId,
  helpComponentId,
  legendComponentId,
  settingsComponentId,
  splashScreenComponentId,
} from './src/application/VcsApp.vue';
export { default as VcsAppWrapper } from './src/application/VcsAppWrapper.vue';
export { default as VcsMap } from './src/application/VcsMap.vue';
export {
  default as ContentTreeCollection,
  createContentTreeCollection,
  defaultContentTreeComponentId,
} from './src/contentTree/contentTreeCollection.js';
export { default as ContentTreeItem } from './src/contentTree/contentTreeItem.js';
export { default as GroupContentTreeItem } from './src/contentTree/groupContentTreeItem.js';
export { default as WMSGroupContentTreeItem } from './src/contentTree/wmsGroupContentTreeItem.js';
export {
  default as LayerContentTreeItem,
  setViewpointAction,
  getStateFromLayer,
} from './src/contentTree/layerContentTreeItem.js';
export { default as LayerGroupContentTreeItem } from './src/contentTree/layerGroupContentTreeItem.js';
export { default as FlightContentTreeItem } from './src/contentTree/flightContentTreeItem.js';
export { default as LayerTree } from './src/contentTree/LayerTree.vue';
export { default as NodeContentTreeItem } from './src/contentTree/nodeContentTreeItem.js';
export { default as ObliqueCollectionContentTreeItem } from './src/contentTree/obliqueCollectionContentTreeItem.js';
export { default as SubContentTreeItem } from './src/contentTree/subContentTreeItem.js';
export { default as VcsObjectContentTreeItem } from './src/contentTree/vcsObjectContentTreeItem.js';
export { default as ViewpointContentTreeItem } from './src/contentTree/viewpointContentTreeItem.js';
export { default as WindowComponent } from './src/manager/window/WindowComponent.vue';
export { default as WindowComponentHeader } from './src/manager/window/WindowComponentHeader.vue';
export { default as VcsWindowManager } from './src/manager/window/WindowManager.vue';
export {
  default as WindowManager,
  WindowSlot,
  WindowPositions,
  posToPixel,
  windowPositionFromOptions,
} from './src/manager/window/windowManager.js';
export {
  WindowAlignment,
  getFittedWindowPositionOptions,
  getFittedWindowPositionOptionsFromMapEvent,
  getTargetSize,
  getWindowPositionOptions,
  getWindowPositionOptionsFromMapEvent,
  posToNumber,
  posToPercent,
  optionsFromWindowPosition,
  updateWindowPosition,
  clipToTargetSize,
  moveWindow,
  applyParentPosition,
  getPositionAppliedOnTarget,
} from './src/manager/window/windowHelper.js';
export {
  default as PanelManager,
  PanelLocation,
} from './src/manager/panel/panelManager.js';
export { default as PanelManagerComponent } from './src/manager/panel/PanelManagerComponent.vue';
export { default as PanelComponent } from './src/manager/panel/PanelComponent.vue';
export { default as ButtonManager } from './src/manager/buttonManager.js';
export {
  default as NavbarManager,
  ButtonLocation,
  getActionsByLocation,
} from './src/manager/navbarManager.js';
export {
  default as ToolboxManager,
  ToolboxType,
  defaultToolboxName,
} from './src/manager/toolbox/toolboxManager.js';
export {
  default as ToolboxManagerComponent,
  toolboxComponentId,
} from './src/manager/toolbox/ToolboxManagerComponent.vue';
export { default as CategoryManager } from './src/manager/collectionManager/categoryManager.js';
export { default as CollectionManager } from './src/manager/collectionManager/collectionManager.js';
export { default as CollectionManagerComponent } from './src/manager/collectionManager/CollectionManager.vue';
export { default as CollectionComponentProvider } from './src/manager/collectionManager/CollectionComponentProvider.vue';
export {
  default as CollectionComponentClass,
  createSupportedMapMappingFunction,
} from './src/manager/collectionManager/collectionComponentClass.js';
export {
  makeEditorCollectionComponentClass,
  isEditorCollectionComponentClass,
} from './src/manager/collectionManager/editorCollectionComponentClass.js';
export { default as CollectionComponent } from './src/manager/collectionManager/CollectionComponent.vue';
export { default as CollectionComponentStandalone } from './src/manager/collectionManager/CollectionComponentStandalone.vue';
export { default as CollectionComponentList } from './src/manager/collectionManager/CollectionComponentList.vue';
export { default as CollectionComponentContent } from './src/manager/collectionManager/CollectionComponentContent.vue';
export { default as ContextMenuManager } from './src/manager/contextMenu/contextMenuManager.js';
export { default as ContextMenuComponent } from './src/manager/contextMenu/ContextMenuComponent.vue';
export { default as ContextMenuInteraction } from './src/manager/contextMenu/contextMenuInteraction.js';
export {
  applyKeyMapping,
  applyValueMapping,
  default as AbstractFeatureInfoView,
} from './src/featureInfo/abstractFeatureInfoView.js';
export {
  extractNestedKey,
  default as BalloonFeatureInfoView,
} from './src/featureInfo/balloonFeatureInfoView.js';
export { default as AddressBalloonFeatureInfoView } from './src/featureInfo/addressBalloonFeatureInfoView.js';
export {
  getBalloonPosition,
  setBalloonPosition,
  setupBalloonPositionListener,
} from './src/featureInfo/balloonHelper.js';
export { default as BalloonComponent } from './src/featureInfo/BalloonComponent.vue';
export { default as AddressBalloonComponent } from './src/featureInfo/AddressBalloonComponent.vue';
export { default as IframeComponent } from './src/featureInfo/IframeComponent.vue';
export { default as IframeFeatureInfoView } from './src/featureInfo/iframeFeatureInfoView.js';
export { default as IframeWmsFeatureInfoView } from './src/featureInfo/iframeWmsFeatureInfoView.js';
export { default as TableFeatureInfoView } from './src/featureInfo/tableFeatureInfoView.js';
export { default as MarkdownFeatureInfoView } from './src/featureInfo/markdownFeatureInfoView.js';
export { default as MarkdownBalloonFeatureInfoView } from './src/featureInfo/markdownBalloonFeatureInfoView.js';
export {
  getHighlightStyleFromStyle,
  getHighlightStyle,
  getClusterHighlightStyle,
  featureInfoViewSymbol,
} from './src/featureInfo/featureInfo.js';
export { default as ClusterFeatureComponent } from './src/featureInfo/ClusterFeatureComponent.vue';

export { default as MapNavCompass } from './src/navigation/MapNavCompass.vue';
export { default as MapNavigation } from './src/navigation/MapNavigation.vue';
export { default as ObliqueRotation } from './src/navigation/ObliqueRotation.vue';
export { default as OrientationToolsButton } from './src/navigation/OrientationToolsButton.vue';
export {
  getWindowComponentOptions,
  default as OverviewMap,
  overviewMapWindowId,
} from './src/navigation/overviewMap.js';
export { default as OverviewMapClickedInteraction } from './src/navigation/overviewMapClickedInteraction.js';
export { default as TiltSlider } from './src/navigation/TiltSlider.vue';
export { default as VcsCompass } from './src/navigation/VcsCompass.vue';
export { default as VcsZoomButton } from './src/navigation/VcsZoomButton.vue';
//
export { createVueI18n, setupI18n } from './src/vuePlugins/i18n.js';
export {
  default as I18nCollection,
  i18nPluginSymbol,
} from './src/i18n/i18nCollection.js';
export { default as UiConfig } from './src/uiConfig.js'; // export UiConfig types
export {
  createVcsThemes,
  createVcsVuetify,
  isDark,
  getDefaultPrimaryColor,
  getColorByKey,
  useFontSize,
} from './src/vuePlugins/vuetify.js';
export {
  downloadURI,
  downloadBlob,
  downloadText,
  downloadCanvas,
} from './src/downloadHelper.js';
export {
  getFromLocalStorage,
  setToLocalStorage,
  removeFromLocalStorage,
  hideSplashScreenKey,
} from './src/localStorage.js';
export {
  default as initApp,
  VcsUiAppConfigPattern,
  initAppFromModule,
  initAppFromAppConfig,
  createModuleFromObjectOrUrl,
} from './src/init.js';
export {
  vcsAppSymbol,
  pluginFactorySymbol,
  pluginBaseUrlSymbol,
  pluginModuleUrlSymbol,
  getPluginAssetUrl,
  isValidPackageName,
  loadPlugin,
  serializePlugin,
  deserializePlugin,
} from './src/pluginHelper.js';
export {
  getStateFromURL,
  createEmptyState,
  setStateToUrl,
} from './src/state.js';
export { default as VcsUiApp } from './src/vcsUiApp.js';
export {
  default as Notifier,
  NotificationType,
} from './src/notifier/notifier.js';
export {
  default as Icons,
  getColoredMapIcon,
} from './src/components/icons/+all.js';

export { default as VcsButton } from './src/components/buttons/VcsButton.vue';
export { default as VcsToolButton } from './src/components/buttons/VcsToolButton.vue';
export { default as VcsFormButton } from './src/components/buttons/VcsFormButton.vue';
export { default as VcsActionButtonList } from './src/components/buttons/VcsActionButtonList.vue';
export { default as VcsHelp } from './src/components/notification/VcsHelp.vue';
export { default as VcsTable } from './src/components/tables/VcsTable.vue';
export { default as VcsDataTable } from './src/components/tables/VcsDataTable.vue';
export { default as VcsLabel } from './src/components/form-inputs-controls/VcsLabel.vue';
export { default as VcsCheckbox } from './src/components/form-inputs-controls/VcsCheckbox.vue';
export { default as VcsRadio } from './src/components/form-inputs-controls/VcsRadio.vue';
export { default as VcsFormSection } from './src/components/section/VcsFormSection.vue';
export { default as VcsSelect } from './src/components/form-inputs-controls/VcsSelect.vue';
export { default as VcsSlider } from './src/components/form-inputs-controls/VcsSlider.vue';
export { default as VcsTextField } from './src/components/form-inputs-controls/VcsTextField.vue';
export { default as VcsFileInput } from './src/components/form-inputs-controls/VcsFileInput.vue';
export { default as VcsChipArrayInput } from './src/components/form-inputs-controls/VcsChipArrayInput.vue';
export { default as VcsCoordinate } from './src/components/form-inputs-controls/VcsCoordinate.vue';
export { default as VcsTextArea } from './src/components/form-inputs-controls/VcsTextArea.vue';
export { default as VcsWizard } from './src/components/form-inputs-controls/VcsWizard.vue';
export { default as VcsWizardStep } from './src/components/form-inputs-controls/VcsWizardStep.vue';
export { default as VcsDatePicker } from './src/components/form-inputs-controls/VcsDatePicker.vue';
export { default as VcsFormattedNumber } from './src/components/form-output/VcsFormattedNumber.vue';
export { default as VcsMarkdown } from './src/components/form-output/VcsMarkdown.vue';
export { default as VcsTemplateMarkdown } from './src/components/form-output/VcsTemplateMarkdown.vue';
export { default as VcsTextPage } from './src/application/VcsTextPage.vue';
export {
  default as VcsActionList,
  validateAction,
  validateActions,
} from './src/components/lists/VcsActionList.vue';
export { default as VcsList } from './src/components/lists/VcsList.vue';
export { default as VcsListItemComponent } from './src/components/lists/VcsListItemComponent.vue';
export { default as VcsGroupedList } from './src/components/lists/VcsGroupedList.vue';
export * from './src/components/lists/listHelper.js';
export { default as VcsTreeview } from './src/components/lists/VcsTreeview.vue';
export { default as VcsTreeNode } from './src/components/lists/VcsTreeNode.vue';
export { default as VcsTreeviewTitle } from './src/components/lists/VcsTreeviewTitle.vue';
export { default as VcsTreeviewSearchbar } from './src/components/lists/VcsTreeviewSearchbar.vue';
export { default as VcsBadge } from './src/components/notification/VcsBadge.vue';
export { default as VcsDefaultLogo } from './src/logo.svg';
export { default as VcsDefaultMobileLogo } from './src/logo-mobile.svg';
export { default as StyleMenuWrapper } from './src/components/style/StyleMenuWrapper.vue';
export { default as VcsFillSelector } from './src/components/style/VcsFillSelector.vue';
export { default as VcsFillMenu } from './src/components/style/VcsFillMenu.vue';
export { default as VcsStrokeSelector } from './src/components/style/VcsStrokeSelector.vue';
export { default as VcsStrokeMenu } from './src/components/style/VcsStrokeMenu.vue';
export { default as VcsImageSelector } from './src/components/style/VcsImageSelector.vue';
export { default as VcsImageMenu } from './src/components/style/VcsImageMenu.vue';
export { default as VcsTextSelector } from './src/components/style/VcsTextSelector.vue';
export { default as VcsTextMenu } from './src/components/style/VcsTextMenu.vue';
export { default as VcsExtent } from './src/components/extent/VcsExtent.vue';
export { default as VcsExtentEditor } from './src/components/extent/VcsExtentEditor.vue';
export { default as VcsProjection } from './src/components/projection/VcsProjection.vue';
export {
  default as VcsVectorStyleComponent,
  VectorStyleMenus,
} from './src/components/style/VcsVectorStyleComponent.vue';
export {
  default as VcsVectorPropertiesComponent,
  vectorProperties,
} from './src/components/vector-properties/VcsVectorPropertiesComponent.vue';
export { default as VcsViewpointComponent } from './src/components/viewpoint/VcsViewpointComponent.vue';
export { default as VcsViewpointEditor } from './src/components/viewpoint/VcsViewpointEditor.vue';
export { default as VcsFlightComponent } from './src/components/flight/VcsFlightComponent.vue';
export { default as VcsFlightAnchorsComponent } from './src/components/flight/VcsFlightAnchorsComponent.vue';
export { default as VcsFlightPlayer } from './src/components/flight/VcsFlightPlayer.vue';
export { default as VcsFlightEditor } from './src/components/flight/VcsFlightEditor.vue';
export {
  getProvidedFlightInstance,
  setupFlightAnchorEditingListener,
} from './src/components/flight/composables.js';
export {
  default as VcsFeatureEditingWindow,
  EditorTransformationIcons,
  getAllowedEditorTransformationModes,
} from './src/components/vector-properties/VcsFeatureEditingWindow.vue';
export { default as VcsFeatureTransforms } from './src/components/vector-properties/VcsFeatureTransforms.vue';
export { default as VcsSnapTo } from './src/components/vector-properties/VcsSnapTo.vue';
export { default as VcsFeatureStyleComponent } from './src/components/style/VcsFeatureStyleComponent.vue';
export { default as AbstractConfigEditor } from './src/components/plugins/AbstractConfigEditor.vue';
export { default as VcsFileDrop } from './src/components/import/VcsFileDrop.vue';
export { default as VcsImportComponent } from './src/components/import/VcsImportComponent.vue';
export { default as VcsExpansionPanel } from './src/components/section/VcsExpansionPanel.vue';
export { default as VcsSplashScreen } from './src/application/VcsSplashScreen.vue';
export * from './src/application/attributionsHelper.js';
export * from './src/components/attrsHelpers.js';
export * from './src/components/modelHelper.js';
export * from './src/components/composables.js';
export {
  LegendType,
  StyleRowType,
  getLegendEntries,
} from './src/legend/legendHelper.js';
export { default as Search } from './src/search/search.js';
export { markText } from './src/search/markText.js';
export { default as ResultItemComponent } from './src/search/ResultItem.vue';
export { default as ResultsComponent } from './src/search/ResultsComponent.vue';
