import VectorSource from 'ol/source/Vector.js';
import { Feature } from 'ol';
import {
  ButtonLocation, createModalAction, createToggleAction, setStateToUrl, ToolboxType, WindowSlot,
} from '@vcmap/ui';
import { toolboxData } from './toolbox-data.js';
import editor from './editor.vue';
import windowManagerExample from './windowManagerExample.vue';
import AllIconsComponent from './allIconsComponent.vue';
import TestList from './testList.vue';

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
          slot: WindowSlot.DYNAMIC_LEFT,
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
      const { action: clipboardDialogAction, destroy: destroyClipboardDialogAction } = createModalAction(
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
              const url = new URL(window.location.href);
              setStateToUrl(await app.getState(true), url);
              this.url = url.toString();
            },
          },
          position: {
            top: '50px',
            left: '8%',
            right: '8%',
          },
        },
        app,
        '@vcmap/test',
      );
      const { action: listAction, destroy: destroyList } = createToggleAction(
        {
          name: 'TestList',
        },
        {
          id: 'testList',
          state: {
            headerTitle: 'Test List',
          },
          slot: WindowSlot.DYNAMIC_LEFT,
          component: TestList,
        },
        app.windowManager,
        '@vcmap/test',
      );
      this._destroyActions = [
        destroyConfigEditorAction,
        destroyWindowAction,
        destroyIconAction,
        destroyClipboardDialogAction,
        destroyList,
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
        { id: 'list', action: listAction },
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
      toolboxData.forEach(([{ buttonComponents, ...toolboxComponentOptions }, owner]) => {
        let group;
        if (app.toolboxManager.has(toolboxComponentOptions.id)) {
          group = app.toolboxManager.get(toolboxComponentOptions.id);
        } else {
          group = app.toolboxManager.add(toolboxComponentOptions, owner);
        }
        if (group.type === ToolboxType.GROUP && buttonComponents) {
          buttonComponents.forEach(c => group.buttonManager.add(c, owner));
        }
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
