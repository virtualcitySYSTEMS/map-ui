import VectorSource from 'ol/source/Vector.js';
import { Feature } from 'ol';
import { ButtonLocation, createToggleAction, windowSlot } from '@vcmap/ui';
import { toolboxData } from './toolbox-data.js';
import editor from './editor.vue';
import windowManagerExample from './windowManagerExample.vue';

let source;

function getSource() {
  if (!source) {
    source = new VectorSource();
  }
  return source;
}

/**
 * @returns {VcsPlugin}
 */
export default async function () {
  return {
    name: '@vcmap/test',
    onVcsAppMounted(app) {
      const { action: configEditorAction, destroy: destroyConfigEditorAction } = createToggleAction(
        {
          name: 'Config Editor',
        },
        {
          id: 'config-editor',
          state: {
            headerTitle: 'Context Editor',
          },
          component: editor,
          slot: windowSlot.STATIC,
          position: {
            width: 500,
          },
        },
        app.windowManager,
        '@vcmap/test',
      );
      const { action: windowAction, destroy: destroyWindowAction } = createToggleAction(
        {
          name: 'Windows',
        },
        {
          id: 'windowManagerExample',
          state: {
            headerTitle: 'windowManager Example',
          },
          component: windowManagerExample,
          position: {
            left: '60%',
            right: '10%',
            top: '10%',
          },
        },
        app.windowManager,
        '@vcmap/test',
      );
      this._destroyActions = [destroyConfigEditorAction, destroyWindowAction];
      const alertAction = {
        name: 'VC Systems',
        callback() {
          getSource().addFeature(new Feature({}));
          window.alert(`there are ${getSource().getFeatures().length} features ${app.maps.activeMap.name}`);
        },
      };
      app.navbarManager.add({
        id: 'config-editor',
        location: ButtonLocation.TOOL,
        action: configEditorAction,
      }, '@vcmap/test');
      app.navbarManager.add({
        id: 'windowManagerExample',
        location: ButtonLocation.TOOL,
        action: windowAction,
      }, '@vcmap/test');
      app.navbarManager.add({
        id: 'alert',
        location: ButtonLocation.TOOL,
        action: alertAction,
      }, '@vcmap/test');
      // toolboxData.forEach(([group, id]) => app.toolboxManager.addToolboxGroup(group, id));
    },
    destroy() {
      if (this._destroyActions) {
        this._destroyActions.forEach(cb => cb());
        this._destroyActions = null;
      }
    },
  };
}
