<template>
  <v-app-bar app absolute dense>
    <v-container fluid class="pa-0">
      <v-row no-gutters>
        <v-col>
          <v-toolbar-items>
            <div class="d-flex align-center">
              <VcsActionButtonList
                :actions="mapActions"
                :overflow-count="3"
                large
              />
              <v-divider
                v-if="mapActions.length > 0 && (contentActions.length > 0 || toolActions.length > 0)"
                vertical
                inset
              />
              <VcsActionButtonList
                :actions="contentActions"
                large
              />
              <v-divider
                v-if="contentActions.length > 0 && toolActions.length > 0"
                vertical
                inset
              />
              <VcsActionButtonList
                :actions="toolActions"
                large
              />
            </div>
          </v-toolbar-items>
        </v-col>
        <v-col class="align-center d-flex justify-center">
          <div class="company-logo" />
        </v-col>
        <v-col class="align-content-end d-flex justify-end">
          <v-toolbar-items>
            <div class="d-flex align-center">
              <VcsActionButtonList
                :actions="projectActions"
                large
              />
              <v-divider
                v-if="projectActions.length > 0 && menuActions.length > 0"
                vertical
                inset
              />
              <VcsActionButtonList
                :actions="menuActions"
                :overflow-count="3"
                large
              />
            </div>
          </v-toolbar-items>
        </v-col>
      </v-row>
    </v-container>
  </v-app-bar>
</template>

<script>

  import { VcsActionButtonList } from '@vcsuite/ui-components';
  import { inject, ref, computed } from '@vue/composition-api';
  import { ButtonLocation, getActionsByLocation } from '../manager/buttonManager.js';

  export default {
    name: 'VcsNavbar',
    components: { VcsActionButtonList },
    setup() {
      const app = inject('vcsApp');

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
  };
</script>
