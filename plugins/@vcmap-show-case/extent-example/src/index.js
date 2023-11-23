import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import { Extent, VectorLayer } from '@vcmap/core';
import { ref } from 'vue';
import packageJSON from '../package.json';
import ExtentExample from './ExtentExample.vue';

/**
 * @returns {VcsPlugin}
 */
export default async function extentExample() {
  const sampleLayerOptions = VectorLayer.getDefaultOptions();
  sampleLayerOptions.extent = new Extent().toJSON();

  return {
    get name() {
      return packageJSON.name;
    },
    get version() {
      return packageJSON.version;
    },
    get mapVersion() {
      return packageJSON.mapVersion;
    },
    onVcsAppMounted(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Extent Example',
          title: 'Extent Example Plugin',
          icon: '$vcsBoundingBox',
        },
        {
          id: 'extent-example',
          component: ExtentExample,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'Extent Example',
            headerIcon: '$vcsBoundingBox',
          },
          props: {
            value: ref(sampleLayerOptions),
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add({ action }, packageJSON.name, ButtonLocation.TOOL);
      this._destroyAction = destroy;
    },
    i18n: {
      de: {
        extentExample: {
          title: 'Ausdehnung',
        },
      },
      en: {
        extentExample: {
          title: 'Extent',
        },
      },
    },
    destroy() {
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
