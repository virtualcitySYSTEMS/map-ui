<template>
  <v-app-bar dense class="z-index-100">
    <v-container fluid class="pa-0">
      <v-row no-gutters>
        <v-col>
          <v-toolbar-items>
            <div class="d-flex align-center">
              <VcsActionButtonList :actions="mapActions" :overflow-count="3" />
              <v-divider
                v-if="mapActions.length > 0 && (contentActions.length > 0 || toolActions.length > 0)"
                vertical
                inset
              />
              <VcsActionButtonList :actions="contentActions" />
              <v-divider
                v-if="contentActions.length > 0 && toolActions.length > 0"
                vertical
                inset
              />
              <VcsActionButtonList :actions="toolActions" />
            </div>
          </v-toolbar-items>
        </v-col>
        <v-col class="align-center d-flex justify-center">
          <div class="company-logo" />
        </v-col>
        <v-col class="align-content-end d-flex justify-end">
          <v-toolbar-items>
            <div class="d-flex align-center">
              <VcsActionButtonList :actions="projectActions" />
              <v-divider
                v-if="projectActions.length > 0 && menuActions.length > 0"
                vertical
                inset
              />
              <VcsActionButtonList :actions="menuActions" :overflow-count="3" />
            </div>
          </v-toolbar-items>
        </v-col>
      </v-row>
    </v-container>
  </v-app-bar>
</template>

<script>

  import Vue from 'vue';

  import { VcsActionButtonList } from '@vcsuite/ui-components';
  import { inject, ref, computed } from '@vue/composition-api';
  import LayerTree from '@/components/LayerTree.vue';
  import { windowSlot } from '@/modules/window-manager/windowManager.js';
  import { createToggleAction } from '../actionHelper.js';
  import { ButtonLocation, getActionsByLocation } from '@/modules/component-manager/buttonManager.js';
  import EmptyCmp from './empty-cmp.vue';
  import { vcsAppSymbol } from '../vcsAppContextHelpers.js';

  const staticWindow = {
    id: 'static-win',
    state: {
      headerIcon: '$vcsLayers',
      styles: {
        'max-width': '80%',
      },
    },
    position: {
      width: window.innerWidth * 0.8,
      left: '10%',
      right: '10%',
      top: '10%',
      bottom: '10%',
    },
    component: EmptyCmp,
  };

  const layerTree = {
    id: 'layer-tree',
    component: LayerTree,
    state: {
      headerTitle: 'Static Window',
      headerIcon: '$vcsLayers',
    },
    position: {
      width: 320,
    },
    windowSlot: windowSlot.STATIC,
  };

  const components = {
    id: 'components',
    component: LayerTree,
    state: {
      headerTitle: 'Dynamic Window Left 1',
      headerIcon: '$vcsComponents',
    },
    position: {
      width: 320,
    },
    windowSlot: windowSlot.DYNAMIC_LEFT,
  };

  const dummy1 = {
    ...components,
    id: 'dummy1',
    state: {
      ...components.state,
      headerTitle: 'Dynamic Window Left (2)',
      headerIcon: '$vcsTools',
    },
    windowSlot: windowSlot.DYNAMIC_LEFT,
  };

  const dummy2 = {
    ...dummy1,
    id: 'dummy2',
    state: {
      ...dummy1.state,
      headerTitle: 'Dynamic Window Right',

      headerIcon: '$vcsLegend',
    },
    windowSlot: windowSlot.DYNAMIC_RIGHT,
  };

  const windowComponentOptions = [
    layerTree,
    components,
    dummy1,
    dummy2,
    staticWindow,
  ];


  export default Vue.extend({
    name: 'VcsNavbar',
    components: { VcsActionButtonList },
    setup() {
      const app = inject('vcsApp');

      windowComponentOptions.forEach((c) => {
        const { action } = createToggleAction(
          {
            name: c.id,
            icon: c.state.headerIcon,
          },
          c,
          app.windowManager,
          vcsAppSymbol,
        );
        app.navbarManager.add({
          id: c.id,
          location: ButtonLocation.CONTENT,
          action,
        }, vcsAppSymbol);
      });

      const navbarButtonIds = ref(app.navbarManager.buttonIds);
      const buttonComponents = computed(() => navbarButtonIds.value.map(id => app.navbarManager.get(id)));
      const getActions = location => computed(
        () => getActionsByLocation(buttonComponents.value, location, [...app.plugins].map(p => p.name)),
      );

      return {
        mapActions: getActions(ButtonLocation.MAP),
        contentActions: getActions(ButtonLocation.CONTENT),
        toolActions: getActions(ButtonLocation.TOOL),
        projectActions: getActions(ButtonLocation.PROJECT),
        menuActions: getActions(ButtonLocation.MENU),
      };
    },
  });
</script>
