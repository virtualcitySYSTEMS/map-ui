import './src/setup.js';
import './src/styles/main.scss';

export { default as StyleSelector } from './src/actions/styleSelector.vue';
export {
  createMapButtonAction,
  createToggleAction,
  createOverviewMapAction,
  createModalAction,
  createLinkAction,
  createGoToViewpointAction,
  createZoomToFeatureAction,
} from './src/actions/actionHelper.js';
export {
  createStateRefAction,
  StateActionState,
} from './src/actions/stateRefAction.js';

export { default as VcsNavbar } from './src/application/VcsNavbar.vue';
export {
  default as VcsApp,
  setupMapNavbar,
  setupPluginMountedListeners,
  setupCategoryManagerWindow,
} from './src/application/VcsApp.vue';
export { default as VcsAppWrapper } from './src/application/vcsAppWrapper.vue';
export { default as VcsMap } from './src/application/VcsMap.vue';

export {
  default as ContentTreeCollection,
  createContentTreeCollection,
} from './src/contentTree/contentTreeCollection.js';
export { default as ContentTreeItem } from './src/contentTree/contentTreeItem.js';
export { default as GroupContentTreeItem } from './src/contentTree/groupContentTreeItem.js';
export {
  default as LayerContentTreeItem,
  setViewpointAction,
  getStateFromLayer,
} from './src/contentTree/layerContentTreeItem.js';
export { default as LayerGroupContentTreeItem } from './src/contentTree/layerGroupContentTreeItem.js';
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
  getWindowPositionOptions,
  getWindowPositionOptionsFromMapEvent,
  posToNumber,
  posToPercent,
  optionsFromWindowPosition,
  updateWindowPosition,
  clipToTargetSize,
  moveWindow,
  applyPositionOnTarget,
} from './src/manager/window/windowHelper.js';

export { default as ButtonManager } from './src/manager/buttonManager.js';
export { default as NavbarManager, ButtonLocation, getActionsByLocation } from './src/manager/navbarManager.js';
export { default as ToolboxManager, ToolboxType } from './src/manager/toolbox/toolboxManager.js';
export { default as CategoryManager } from './src/manager/categoryManager/categoryManager.js';
export { default as CategoryManagerComponent } from './src/manager/categoryManager/CategoryManager.vue';
export { default as ContextMenuManager } from './src/manager/contextMenu/contextMenuManager.js';
export { default as ContextMenuComponent } from './src/manager/contextMenu/contextMenuComponent.vue';
export { default as ContextMenuInteraction } from './src/manager/contextMenu/contextMenuInteraction.js';

export { applyKeyMapping, applyValueMapping, default as AbstractFeatureInfoView } from './src/featureInfo/abstractFeatureInfoView.js';
export { extractNestedKey, default as BalloonFeatureInfoView } from './src/featureInfo/balloonFeatureInfoView.js';
export { default as AddressBalloonFeatureInfoView } from './src/featureInfo/addressBalloonFeatureInfoView.js';
export { getBalloonPosition, setBalloonPosition, setupBalloonPositionListener } from './src/featureInfo/balloonHelper.js';
export { default as BalloonComponent } from './src/featureInfo/BalloonComponent.vue';
export { default as AddressBalloonComponent } from './src/featureInfo/AddressBalloonComponent.vue';
export { default as IframeFeatureInfoView } from './src/featureInfo/iframeFeatureInfoView.js';
export { default as TableFeatureInfoView } from './src/featureInfo/tableFeatureInfoView.js';
export { getHighlightStyle, featureInfoViewSymbol } from './src/featureInfo/featureInfo.js';

export { default as MapNavCompass } from './src/navigation/mapNavCompass.vue';
export { default as MapNavigation } from './src/navigation/mapNavigation.vue';
export { default as ObliqueRotation } from './src/navigation/obliqueRotation.vue';
export { default as OrientationToolsButton } from './src/navigation/orientationToolsButton.vue';
export { getWindowComponentOptions, default as OverviewMap } from './src/navigation/overviewMap.js';
export { default as OverviewMapClickedInteraction } from './src/navigation/overviewMapClickedInteraction.js';
export { default as TiltSlider } from './src/navigation/tiltSlider.vue';
export { default as VcsCompass } from './src/navigation/vcsCompass.vue';
export { default as VcsZoomButton } from './src/navigation/vcsZoomButton.vue';

export { createVueI18n, setupI18n } from './src/vuePlugins/i18n.js';
export { createVuetify, vuetify } from './src/vuePlugins/vuetify.js';
export { default as initApp } from './src/init.js';
export {
  vcsAppSymbol,
  pluginFactorySymbol,
  pluginBaseUrlSymbol,
  getPluginAssetUrl,
  isValidPackageName,
  loadPlugin,
  serializePlugin,
  deserializePlugin,
} from './src/pluginHelper.js';
export { getStateFromURL, createEmptyState, setStateToUrl } from './src/state.js';
export { default as VcsUiApp } from './src/vcsUiApp.js';
export { default as Notifier, NotificationType } from './src/notifier/notifier.js';
export { default as Icons } from './src/components/icons/+all.js';

export { default as VcsButton } from './src/components/buttons/VcsButton.vue';
export { default as VcsActionButtonList } from './src/components/buttons/VcsActionButtonList.vue';
export { default as VcsTooltip } from './src/components/notification/VcsTooltip.vue';
export { default as VcsHelp } from './src/components/notification/VcsHelp.vue';

export { default as VcsTable } from './src/components/tables/VcsTable.vue';

// export { default as VcsConfirmationDialog } from './src/components/dialogs/VcsConfirmationDialog.vue';

export { default as VcsLabel } from './src/components/form-inputs-controls/VcsLabel.vue';
export { default as VcsCheckbox } from './src/components/form-inputs-controls/VcsCheckbox.vue';
export { default as VcsRadio } from './src/components/form-inputs-controls/VcsRadio.vue';
// export { default as VcsColorPicker } from './src/components/form-inputs-controls/VcsColorPicker.vue';
export { default as VcsFormSection } from './src/components/form-inputs-controls/VcsFormSection.vue';
// export { default as VcsInputColumnCoordinates } from './src/components/form-inputs-controls/VcsInputColumnCoordinates.vue';
// export { default as VcsInputColumnDimensions } from './src/components/form-inputs-controls/VcsInputColumnDimensions.vue';
// export { default as VcsMinimalCheckbox } from './src/components/form-inputs-controls/VcsMinimalCheckbox.vue';
export { default as VcsSelect } from './src/components/form-inputs-controls/VcsSelect.vue';
export { default as VcsTextField } from './src/components/form-inputs-controls/VcsTextField.vue';
export { default as VcsTextArea } from './src/components/form-inputs-controls/VcsTextArea.vue';
export { default as VcsWizard } from './src/components/form-inputs-controls/VcsWizard.vue';
export { default as VcsWizardStep } from './src/components/form-inputs-controls/VcsWizardStep.vue';

export { default as VcsFormattedNumber } from './src/components/form-output/VcsFormattedNumber.vue';

export { default as VcsActionList, validateAction, validateActions } from './src/components/lists/VcsActionList.vue';
// export { default as VcsEndlessList } from './src/components/lists/VcsEndlessList.vue';
export { default as VcsList } from './src/components/lists/VcsList.vue';
export { default as VcsTreeview } from './src/components/lists/VcsTreeview.vue';
export { default as VcsTreeviewLeaf } from './src/components/lists/VcsTreeviewLeaf.vue';
// export { default as VcsTreeviewSearchbar } from './src/components/lists/VcsTreeviewSearchbar.vue';

// export { default as VcsMediaControls } from './src/components/media-controls/VcsMediaControls.vue';

// export { default as VcsContextMenu } from './src/components/menus/VcsContextMenu.vue';
// export { default as VcsMenu } from './src/components/menus/VcsMenu.vue';
// export { default as VcsOverflowMenu } from './src/components/menus/VcsOverflowMenu.vue';


// export { default as VcsBadge } from './src/components/notification/VcsBadge.vue';

// export { default as VcsFileNamePopover } from './src/components/popovers/VcsFileNamePopover.vue';
// export { default as VcsTexturePopover } from './src/components/popovers/VcsTexturePopover.vue';
