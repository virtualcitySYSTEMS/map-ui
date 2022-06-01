<template>
  <v-app-bar
    app
    absolute
    dense
    elevation="0"
    :height="$vuetify.breakpoint.xs ? '56px' : '48px'"
    :color="'var(--v-basic-base)'"
    :bottom="$vuetify.breakpoint.xs ? 'bottom' : undefined"
  >
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
                class="mx-2"
                vertical
                inset
              />
              <VcsActionButtonList
                :actions="contentActions"
                :overflow-count="$vuetify.breakpoint.xs ? 2 : 3"
                large
              />
              <v-divider
                v-if="contentActions.length > 0 && toolActions.length > 0"
                class="mx-2"
                vertical
                inset
              />
              <VcsActionButtonList
                :actions="toolActions"
                v-if="$vuetify.breakpoint.mdAndUp"
                large
              />
            </div>
          </v-toolbar-items>
        </v-col>
        <v-col class="align-center d-flex justify-center">
          <div v-if="$vuetify.breakpoint.mdAndUp" class="company-logo" />
        </v-col>
        <v-col class="align-content-end d-flex justify-end">
          <v-toolbar-items v-if="$vuetify.breakpoint.mdAndUp">
            <div class="d-flex align-center">
              <VcsActionButtonList
                :actions="projectActions"
                large
              />
              <v-divider
                v-if="projectActions.length > 0 && menuActions.length > 0"
                vertical
                inset
                class="mx-2"
              />
              <v-menu
                offset-y
                v-if="shareActions.length > 0"
              >
                <template #activator="{ on, attrs }">
                  <VcsButton
                    v-bind="attrs"
                    v-on="on"
                    large
                    tooltip="Share current view of the map."
                    icon="$vcsShare"
                  />
                </template>
                <VcsActionList
                  :actions="shareActions"
                  tooltip-position="left"
                  :show-icon="true"
                />
              </v-menu>
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

<style lang="scss" scoped>
  .v-toolbar__items > div{
    gap: 8px;
  }
</style>

<script>

  import { inject, ref, computed } from '@vue/composition-api';
  import { ButtonLocation, getActionsByLocation } from '../manager/navbarManager.js';
  import VcsActionButtonList from '../components/buttons/VcsActionButtonList.vue';
  import VcsActionList from '../components/lists/VcsActionList.vue';
  import VcsButton from '../components/buttons/VcsButton.vue';

  export default {
    name: 'VcsNavbar',
    components: { VcsActionButtonList, VcsActionList, VcsButton },
    setup() {
      const app = inject('vcsApp');

      const navbarButtonIds = ref(app.navbarManager.componentIds);
      const buttonComponents = computed(() => navbarButtonIds.value.map(id => app.navbarManager.get(id)));
      const getActions = location => computed(
        () => getActionsByLocation(buttonComponents.value, location, [...app.plugins].map(p => p.name)),
      );

      return {
        mapActions: getActions(ButtonLocation.MAP),
        contentActions: getActions(ButtonLocation.CONTENT),
        toolActions: getActions(ButtonLocation.TOOL),
        projectActions: getActions(ButtonLocation.PROJECT),
        shareActions: getActions(ButtonLocation.SHARE),
        menuActions: getActions(ButtonLocation.MENU),
      };
    },
  };
</script>
