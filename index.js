import './src/setup.ts';
import './src/styles/main.scss';
import './src/vuePlugins/i18n.ts';

export { default as StyleSelector } from './src/actions/StyleSelector.ts.vue';
export {
  addLoadingOverlay,
  callSafeAction,
  createMapButtonAction,
  createToggleAction,
  createModalAction,
  createLinkAction,
  createGoToViewpointAction,
  createZoomToFeatureAction,
} from './src/actions/actionHelper.ts';
export {
  createDeepPickingAction,
  deepPickingWindowId,
} from './src/actions/deepPickingAction.ts';
export { parseAndSanitizeMarkdown } from './src/components/form-output/markdownHelper.ts';
export { renderTemplate } from '@vcmap/core';
export {
  createStateRefAction,
  StateActionState,
} from './src/actions/stateRefAction.ts';
export {
  createLayerToggleAction,
  createZoomToExtentAction,
  createExtentFeatureAction,
  setupExtentComponentActions,
} from './src/actions/extentActions.ts';
export {
  createPlayAction,
  PlayerDirection,
  createStepAction,
  createFastAction,
  createFlightPlayerActions,
  setupFlightListItemPlayer,
  createZoomToFlightAction,
  createFlightVisualizationAction,
  createFlightMovieActions,
  createExportFlightAction,
  importFlights,
} from './src/actions/flightActions.ts';
export {
  createListItemDeleteAction,
  createListItemBulkAction,
  createListExportAction,
  createListImportAction,
  importIntoLayer,
} from './src/actions/listActions.ts';
export {
  default as VcsCallback,
  executeCallbacks,
  executeAsyncCallbacks,
} from './src/callback/vcsCallback.ts';
export { default as ActivateLayersCallback } from './src/callback/activateLayersCallback.ts';
export { default as DeactivateLayersCallback } from './src/callback/deactivateLayersCallback.ts';
export { default as GoToViewpointCallback } from './src/callback/goToViewpointCallback.ts';
export { default as ApplyLayerStyleCallback } from './src/callback/applyLayerStyleCallback.ts';
export { default as StopRotationCallback } from './src/callback/stopRotationCallback.ts';
export { default as StartRotationCallback } from './src/callback/startRotationCallback.ts';
export { default as AddModuleCallback } from './src/callback/addModuleCallback.ts';
export { default as RemoveModuleCallback } from './src/callback/removeModuleCallback.ts';
export { default as ActivateClippingPolygonCallback } from './src/callback/activateClippingPolygonCallback.ts';
export { default as DeactivateClippingPolygonCallback } from './src/callback/deactivateClippingPolygonCallback.ts';
export { default as OpenSplashScreenCallback } from './src/callback/openSplashScreenCallback.ts';
export { default as CloseSplashScreenCallback } from './src/callback/closeSplashScreenCallback.ts';
export { default as ToggleNavbarButtonCallback } from './src/callback/toggleNavbarButtonCallback.ts';
export { default as ToggleToolbarButtonCallback } from './src/callback/toggleToolbarButtonCallback.ts';
export { default as ActivateMapCallback } from './src/callback/activateMapCallback.ts';
export { default as ActivateOverviewMapCallback } from './src/callback/activateOverviewMapCallback.ts';
export { default as DeactivateOverviewMapCallback } from './src/callback/deactivateOverviewMapCallback.ts';
export { default as HighlightObjectsCallback } from './src/callback/highlightObjectsCallback.ts';
export { default as ShowObjectsCallback } from './src/callback/showObjectsCallback.ts';
export { default as StartFlightCallback } from './src/callback/startFlightCallback.ts';
export { default as StopFlightCallback } from './src/callback/stopFlightCallback.ts';
export { default as UnHighlightObjectsCallback } from './src/callback/unHighlightObjectsCallback.ts';
export { default as HideObjectsCallback } from './src/callback/hideObjectsCallback.ts';
export { default as VcsNavbar } from './src/application/VcsNavbar.ts.vue';
export { default as VcsApp } from './src/application/VcsApp.ts.vue';
export {
  attributionsComponentId,
  categoryManagerWindowId,
  customScreenComponentId,
  helpComponentId,
  legendComponentId,
  settingsComponentId,
  splashScreenComponentId,
  setupCategoryManagerWindow,
  setupMapNavbar,
  setupPluginMountedListeners,
} from './src/application/vcsAppHelper.ts';
export { default as VcsAppWrapper } from './src/application/VcsAppWrapper.ts.vue';
export { default as VcsMap } from './src/application/VcsMap.ts.vue';
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
export {
  default as LayerSwap,
  layerSwapId,
} from './src/contentTree/LayerSwap.vue';
export { default as NodeContentTreeItem } from './src/contentTree/nodeContentTreeItem.js';
export { default as ObliqueCollectionContentTreeItem } from './src/contentTree/obliqueCollectionContentTreeItem.js';
export { default as SubContentTreeItem } from './src/contentTree/subContentTreeItem.js';
export { default as VcsObjectContentTreeItem } from './src/contentTree/vcsObjectContentTreeItem.js';
export { default as ViewpointContentTreeItem } from './src/contentTree/viewpointContentTreeItem.js';
export { default as WindowComponent } from './src/manager/window/WindowComponent.ts.vue';
export { default as WindowComponentHeader } from './src/manager/window/WindowComponentHeader.ts.vue';
export { default as VcsWindowManager } from './src/manager/window/WindowManager.ts.vue';
export {
  default as WindowManager,
  WindowPositions,
  posToPixel,
  windowPositionFromOptions,
} from './src/manager/window/windowManager.ts';
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
} from './src/manager/window/windowHelper.ts';
export {
  default as PanelManager,
  PanelLocation,
} from './src/manager/panel/panelManager.ts';
export { default as PanelManagerComponent } from './src/manager/panel/PanelManagerComponent.ts.vue';
export { default as PanelComponent } from './src/manager/panel/PanelComponent.ts.vue';
export { default as ButtonManager } from './src/manager/buttonManager.ts';
export {
  default as NavbarManager,
  ButtonLocation,
  getActionsByLocation,
  locationSymbol,
  deviceSymbol,
} from './src/manager/navbarManager.ts';
export {
  default as ToolboxManager,
  ToolboxType,
  defaultToolboxName,
} from './src/manager/toolbox/toolboxManager.ts';
export {
  default as ToolboxManagerComponent,
  toolboxComponentId,
} from './src/manager/toolbox/ToolboxManagerComponent.ts.vue';
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
export { default as ContextMenuManager } from './src/manager/contextMenu/contextMenuManager.ts';
export { default as ContextMenuComponent } from './src/manager/contextMenu/ContextMenuComponent.ts.vue';
export { default as ContextMenuInteraction } from './src/manager/contextMenu/contextMenuInteraction.ts';
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
  getBalloonPositionFromFeature,
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

export { default as MapNavCompass } from './src/navigation/MapNavCompass.ts.vue';
export { default as MapNavigation } from './src/navigation/MapNavigation.ts.vue';
export { default as ObliqueRotation } from './src/navigation/ObliqueRotation.ts.vue';
export { default as OrientationToolsButton } from './src/navigation/OrientationToolsButton.ts.vue';
export { default as OverviewMap } from './src/navigation/overviewMap.ts';
export { default as OverviewMapClickedInteraction } from './src/navigation/overviewMapClickedInteraction.ts';
export { default as TiltSlider } from './src/navigation/TiltSlider.ts.vue';
export { default as VcsCompass } from './src/navigation/VcsCompass.ts.vue';
export { default as VcsZoomButton } from './src/navigation/VcsZoomButton.ts.vue';
//
export { createVueI18n, setupI18n } from './src/vuePlugins/i18n.ts';
export {
  default as I18nCollection,
  i18nPluginSymbol,
} from './src/i18n/i18nCollection.ts';
export { default as UiConfig } from './src/uiConfig.ts'; // export UiConfig types
export {
  createVcsThemes,
  createVcsVuetify,
  isDark,
  getDefaultPrimaryColor,
  getColorByKey,
  useFontSize,
} from './src/vuePlugins/vuetify.ts';
export {
  downloadURI,
  downloadBlob,
  downloadText,
  downloadCanvas,
} from './src/downloadHelper.ts';
export {
  getFromLocalStorage,
  setToLocalStorage,
  removeFromLocalStorage,
  hideSplashScreenKey,
} from './src/localStorage.ts';
export {
  default as initApp,
  vcsUiAppConfigPattern,
  initAppFromModule,
  initAppFromAppConfig,
  createModuleFromObjectOrUrl,
} from './src/init.ts';
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
} from './src/pluginHelper.ts';
export {
  getStateFromURL,
  createEmptyState,
  setStateToUrl,
} from './src/state.ts';
export { default as VcsUiApp } from './src/vcsUiApp.ts';
export {
  default as Notifier,
  NotificationType,
} from './src/notifier/notifier.ts';
export {
  default as Icons,
  getColoredMapIcon,
} from './src/components/icons/+all.ts';

export { default as VcsButton } from './src/components/buttons/VcsButton.ts.vue';
export { default as VcsToolButton } from './src/components/buttons/VcsToolButton.ts.vue';
export { default as VcsFormButton } from './src/components/buttons/VcsFormButton.ts.vue';
export { default as VcsActionButtonList } from './src/components/buttons/VcsActionButtonList.ts.vue';
export { default as VcsHelp } from './src/components/notification/VcsHelp.ts.vue';
export { default as VcsHelpTooltip } from './src/components/notification/VcsHelpTooltip.ts.vue';
export { default as VcsTable } from './src/components/tables/VcsTable.ts.vue';
export { default as VcsDataTable } from './src/components/tables/VcsDataTable.ts.vue';
export { default as VcsLabel } from './src/components/form-inputs-controls/VcsLabel.ts.vue';
export { default as VcsLabeledSlider } from './src/components/form-inputs-controls/VcsLabeledSlider.ts.vue';
export { default as VcsCheckbox } from './src/components/form-inputs-controls/VcsCheckbox.ts.vue';
export { default as VcsRadio } from './src/components/form-inputs-controls/VcsRadio.ts.vue';
export { default as VcsFormSection } from './src/components/section/VcsFormSection.ts.vue';
export { default as VcsSelect } from './src/components/form-inputs-controls/VcsSelect.ts.vue';
export { default as VcsSlider } from './src/components/form-inputs-controls/VcsSlider.ts.vue';
export { default as VcsTextField } from './src/components/form-inputs-controls/VcsTextField.ts.vue';
export { default as VcsFileInput } from './src/components/form-inputs-controls/VcsFileInput.ts.vue';
export { default as VcsChipArrayInput } from './src/components/form-inputs-controls/VcsChipArrayInput.ts.vue';
export { default as VcsCoordinate } from './src/components/form-inputs-controls/VcsCoordinate.ts.vue';
export { default as VcsTextArea } from './src/components/form-inputs-controls/VcsTextArea.ts.vue';
export { default as VcsWizard } from './src/components/form-inputs-controls/VcsWizard.ts.vue';
export { default as VcsWizardStep } from './src/components/form-inputs-controls/VcsWizardStep.ts.vue';
export { default as VcsDatePicker } from './src/components/form-inputs-controls/VcsDatePicker.ts.vue';
export { default as VcsFormattedNumber } from './src/components/form-output/VcsFormattedNumber.ts.vue';
export { default as VcsMarkdown } from './src/components/form-output/VcsMarkdown.ts.vue';
export { default as VcsTemplateMarkdown } from './src/components/form-output/VcsTemplateMarkdown.vue';
export { default as VcsTextPage } from './src/application/VcsTextPage.ts.vue';
export {
  default as VcsActionList,
  validateAction,
  validateActions,
} from './src/components/lists/VcsActionList.ts.vue';
export { default as VcsList } from './src/components/lists/VcsList.ts.vue';
export { default as VcsListItemComponent } from './src/components/lists/VcsListItemComponent.ts.vue';
export { default as VcsGroupedList } from './src/components/lists/VcsGroupedList.ts.vue';
export * from './src/components/lists/listHelper.ts';
export { moveDraggableItems } from './src/components/lists/dragHelper.js';
export { default as VcsTreeview } from './src/components/lists/VcsTreeview.ts.vue';
export { default as VcsTreeNode } from './src/components/lists/VcsTreeNode.ts.vue';
export { default as VcsTreeviewTitle } from './src/components/lists/VcsTreeviewTitle.ts.vue';
export { default as VcsTreeviewSearchbar } from './src/components/lists/VcsTreeviewSearchbar.ts.vue';
export { default as VcsBadge } from './src/components/notification/VcsBadge.ts.vue';
export { default as VcsDefaultLogo } from './src/logo.svg';
export { default as VcsDefaultMobileLogo } from './src/logo-mobile.svg';
export { default as StyleMenuWrapper } from './src/components/style/StyleMenuWrapper.ts.vue';
export { default as VcsFillSelector } from './src/components/style/VcsFillSelector.ts.vue';
export { default as VcsFillMenu } from './src/components/style/VcsFillMenu.ts.vue';
export { default as VcsStrokeSelector } from './src/components/style/VcsStrokeSelector.ts.vue';
export { default as VcsStrokeMenu } from './src/components/style/VcsStrokeMenu.ts.vue';
export { default as VcsImageSelector } from './src/components/style/VcsImageSelector.ts.vue';
export { default as VcsImageMenu } from './src/components/style/VcsImageMenu.ts.vue';
export { default as VcsTextSelector } from './src/components/style/VcsTextSelector.ts.vue';
export { default as VcsTextMenu } from './src/components/style/VcsTextMenu.ts.vue';
export { default as VcsExtent } from './src/components/extent/VcsExtent.ts.vue';
export { default as VcsExtentEditor } from './src/components/extent/VcsExtentEditor.ts.vue';
export { default as VcsProjection } from './src/components/projection/VcsProjection.ts.vue';
export { default as VcsVectorStyleComponent } from './src/components/style/VcsVectorStyleComponent.ts.vue';
export {
  default as VcsVectorPropertiesComponent,
  vectorProperties,
} from './src/components/vector-properties/VcsVectorPropertiesComponent.vue';
export { default as VcsViewpointComponent } from './src/components/viewpoint/VcsViewpointComponent.ts.vue';
export { default as VcsViewpointEditor } from './src/components/viewpoint/VcsViewpointEditor.ts.vue';
export { default as VcsFlightComponent } from './src/components/flight/VcsFlightComponent.ts.vue';
export { default as VcsFlightAnchorsComponent } from './src/components/flight/VcsFlightAnchorsComponent.ts.vue';
export { default as VcsFlightPlayer } from './src/components/flight/VcsFlightPlayer.ts.vue';
export { default as VcsFlightEditor } from './src/components/flight/VcsFlightEditor.ts.vue';
export {
  getProvidedFlightInstance,
  setupFlightAnchorEditingListener,
} from './src/components/flight/composables.ts';
export {
  default as VcsFeatureEditingWindow,
  EditorTransformationIcons,
  getAllowedEditorTransformationModes,
} from './src/components/vector-properties/VcsFeatureEditingWindow.vue';
export { default as VcsFeatureTransforms } from './src/components/vector-properties/VcsFeatureTransforms.vue';
export { default as VcsSnapTo } from './src/components/vector-properties/VcsSnapTo.ts.vue';
export { VectorStyleMenus } from './src/components/style/composables.ts';
export { default as VcsFeatureStyleComponent } from './src/components/style/VcsFeatureStyleComponent.vue';
export { default as AbstractConfigEditor } from './src/components/plugins/AbstractConfigEditor.ts.vue';
export { default as VcsWorkspaceWrapper } from './src/components/plugins/VcsWorkspaceWrapper.ts.vue';
export { default as VcsLoadingOverlay } from './src/components/plugins/VcsLoadingOverlay.ts.vue';
export { default as VcsFileDrop } from './src/components/import/VcsFileDrop.ts.vue';
export { default as VcsImportComponent } from './src/components/import/VcsImportComponent.ts.vue';
export { default as VcsExpansionPanel } from './src/components/section/VcsExpansionPanel.ts.vue';
export { default as VcsSplashScreen } from './src/application/VcsSplashScreen.ts.vue';
export * from './src/application/attributionsHelper.ts';
export * from './src/components/attrsHelpers.ts';
export * from './src/components/modelHelper.ts';
export * from './src/components/composables.ts';
export {
  legendSymbol,
  LegendType,
  StyleRowType,
  getLegendEntries,
} from './src/legend/legendHelper.ts';
export { default as Search } from './src/search/search.ts';
export { searchComponentId } from './src/search/helper.ts';
export { markText } from './src/search/markText.ts';
export { default as ResultItemComponent } from './src/search/ResultItem.ts.vue';
export { default as ResultsComponent } from './src/search/ResultsComponent.ts.vue';
