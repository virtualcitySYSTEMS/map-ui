import VectorSource from 'ol/source/Vector.js';
import { Feature } from 'ol';
import { ButtonLocation, createModalAction, createToggleAction, setStateToUrl, WindowSlot } from '@vcmap/ui';
import { toolboxData } from './toolbox-data.js';
import editor from './editor.vue';
import windowManagerExample from './windowManagerExample.vue';
import AllIconsComponent from './allIconsComponent.vue';

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
          slot: WindowSlot.STATIC,
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
      const { action: iconAction, destroy: destroyIconAction } = createToggleAction(
        {
          name: 'Icons',
        },
        {
          id: 'allIcons',
          state: {
            headerTitle: 'All Icons',
          },
          component: AllIconsComponent,
        },
        app.windowManager,
        '@vcmap/test',
      );
      const { action: clipboardDialogAction, destroy: destroryClipboardDialogAction } = createModalAction(
        {
          name: 'Create Link',
        },
        {
          component: {
            template: '<div>{{url}}</div>',
            data() {
              return {
                url: '',
              };
            },
            async created() {
              this.url = setStateToUrl(await app.getState(true)).toString();
            },
          },
          position: {
            top: '50px',
            left: '8%',
            right: '8%',
          },
        },
        app.windowManager,
        '@vcmap/test',
      );
      this._destroyActions = [
        destroyConfigEditorAction,
        destroyWindowAction,
        destroyIconAction,
        destroryClipboardDialogAction,
      ];
      const alertAction = {
        name: 'VC Systems',
        callback() {
          getSource().addFeature(new Feature({}));
          window.alert(`there are ${getSource().getFeatures().length} features ${app.maps.activeMap.name}`);
        },
      };
      app.navbarManager.add(
        { id: 'config-editor', action: configEditorAction },
        '@vcmap/test',
        ButtonLocation.TOOL,
      );
      app.navbarManager.add(
        { id: 'windowManagerExample', action: windowAction },
        '@vcmap/test',
        ButtonLocation.TOOL,
      );
      app.navbarManager.add(
        { id: 'allIcons', action: iconAction },
        '@vcmap/test',
        ButtonLocation.TOOL,
      );
      app.navbarManager.add(
        { id: 'alert', action: alertAction },
        '@vcmap/test',
        ButtonLocation.TOOL,
      );
      app.navbarManager.add(
        {
          id: 'createLink',
          action: clipboardDialogAction,
        },
        '@vcmap/test',
        ButtonLocation.TOOL,
      );
      toolboxData.forEach(([{ id, icon, title, buttonComponents }, owner]) => {
        const group = app.toolboxManager.requestGroup(id, icon, title);
        buttonComponents.forEach(c => group.buttonManager.add(c, owner));
      });

      app.contextMenuManager.addEventHandler(async (event) => {
        const actions = [{
          id: 'foo2',
          name: 'Log Position',
          icon: '$vcsInfo',
          callback() {
            console.log(event.positionOrPixel);
          },
        }];
        if (event.feature) {
          actions.push({
            id: 'foo',
            name: 'Log Feature',
            icon: '$vcsInfo',
            callback() {
              console.log('feature right clicked');
              console.log(event.feature);
            },
          });
        }
        return actions;
      }, '@vcmap/test');
    },
    destroy() {
      if (this._destroyActions) {
        this._destroyActions.forEach(cb => cb());
        this._destroyActions = null;
      }
    },
  };
}
