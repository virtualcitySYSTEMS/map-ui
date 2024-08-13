<template>
  <v-toolbar
    absolute
    :density="density"
    elevation="0"
    class="px-4"
    :style="xs ? { bottom: 0 } : { top: 0 }"
  >
    <v-container fluid class="pa-0">
      <v-row no-gutters class="align-center">
        <v-col>
          <v-toolbar-items>
            <div class="d-flex">
              <VcsActionButtonList
                :actions="mapActions"
                :overflow-count="3"
                :force-overflow="false"
                button="VcsToolButton"
              />
              <v-divider
                v-if="
                  mapActions.length > 0 &&
                  (contentActions.length > 0 || toolActions.length > 0)
                "
                class="mx-2"
                vertical
                inset
              />
              <VcsActionButtonList
                :actions="contentActions"
                :overflow-count="xs ? 3 : 4"
                :force-overflow="false"
                button="VcsToolButton"
              />
              <v-divider
                v-if="contentActions.length > 0 && toolActions.length > 0"
                class="mx-2"
                vertical
                inset
              />
              <VcsActionButtonList
                :actions="toolActions"
                :force-overflow="false"
                v-if="mdAndUp"
                button="VcsToolButton"
              />
            </div>
          </v-toolbar-items>
        </v-col>
        <v-col class="d-flex justify-center">
          <div class="d-flex align-center">
            <template v-if="!xs">
              <img class="logo" :src="logo" draggable="false" alt="Logo" />
            </template>
            <div
              v-if="mdAndUp && config.appTitle"
              class="ml-4 text-h6 font-weight-bold"
            >
              {{ $st(config.appTitle) }}
            </div>
          </div>
        </v-col>
        <v-col class="align-content-end d-flex justify-end">
          <v-toolbar-items v-if="mdAndUp">
            <div class="d-flex">
              <VcsActionButtonList
                :actions="projectActions"
                :force-overflow="false"
                button="VcsToolButton"
              />
              <v-divider
                v-if="projectActions.length > 0 && menuActions.length > 0"
                vertical
                inset
                class="mx-2"
              />
              <div class="d-flex gc-2">
                <v-menu v-if="shareActions.length > 0">
                  <template #activator="{ props }">
                    <VcsToolButton
                      v-bind="props"
                      tooltip="navbar.share.tooltip"
                      icon="$vcsShare"
                    />
                  </template>
                  <VcsActionList
                    :actions="shareActions"
                    tooltip-position="left"
                    :show-icon="true"
                  />
                </v-menu>
                <VcsToolButton
                  class="d-flex"
                  v-if="searchAction"
                  :key="searchAction.name"
                  :tooltip="searchAction.title"
                  :icon="searchAction.icon"
                  :active="searchAction.active"
                  @click.stop="searchAction.callback($event)"
                  v-bind="{ ...$attrs }"
                />
                <v-menu v-if="menuActions.length > 0">
                  <template #activator="{ props }">
                    <VcsToolButton
                      v-bind="props"
                      tooltip="navbar.menu.tooltip"
                      icon="$vcsMenu"
                    />
                  </template>
                  <VcsActionList
                    :actions="menuActions"
                    tooltip-position="left"
                    :show-icon="true"
                  />
                </v-menu>
              </div>
            </div>
          </v-toolbar-items>
        </v-col>
      </v-row>
    </v-container>
  </v-toolbar>
</template>

<style lang="scss" scoped>
  .logo {
    max-height: 36px;
    margin: 0 auto;
  }
  .v-toolbar.v-toolbar--bottom {
    bottom: 0;
    position: fixed;
  }
</style>

<script>
  import { inject, computed, onUnmounted } from 'vue';
  import { useDisplay } from 'vuetify';
  import {
    VCol,
    VContainer,
    VDivider,
    VMenu,
    VRow,
    VToolbar,
    VToolbarItems,
  } from 'vuetify/components';
  import {
    ButtonLocation,
    getActionsByLocation,
  } from '../manager/navbarManager.js';
  import VcsActionButtonList from '../components/buttons/VcsActionButtonList.vue';
  import VcsActionList from '../components/lists/VcsActionList.vue';
  import VcsToolButton from '../components/buttons/VcsToolButton.vue';
  import { createSearchButtonAction } from '../actions/actionHelper.js';
  import VcsDefaultLogo from '../logo.svg';

  /**
   * @description The menu bar of a VcsMap application.
   * Consists of six sections, where buttons can be placed at.
   * Renders a centered logo and or title.
   */
  export default {
    name: 'VcsNavbar',
    components: {
      VcsActionButtonList,
      VcsActionList,
      VcsToolButton,
      VToolbar,
      VContainer,
      VRow,
      VCol,
      VToolbarItems,
      VDivider,
      VMenu,
    },
    setup() {
      const app = inject('vcsApp');

      const buttonComponents = computed(() =>
        app.navbarManager.componentIds.map((id) => app.navbarManager.get(id)),
      );
      const getActions = (location) =>
        computed(() =>
          getActionsByLocation(
            buttonComponents.value,
            location,
            [...app.plugins].map((p) => p.name),
          ),
        );

      const logo = computed(() => {
        return app.uiConfig.config.logo ?? VcsDefaultLogo;
      });

      const { searchAction, destroy: destroySearchAction } =
        createSearchButtonAction(app);

      onUnmounted(() => {
        destroySearchAction();
      });

      const { xs, mdAndUp } = useDisplay();

      const density = computed(() => {
        return xs.value ? 'comfortable' : 'compact';
      });

      return {
        mapActions: getActions(ButtonLocation.MAP),
        contentActions: getActions(ButtonLocation.CONTENT),
        toolActions: getActions(ButtonLocation.TOOL),
        projectActions: getActions(ButtonLocation.PROJECT),
        shareActions: getActions(ButtonLocation.SHARE),
        searchAction,
        menuActions: getActions(ButtonLocation.MENU),
        config: app.uiConfig.config,
        logo,
        xs,
        density,
        mdAndUp,
      };
    },
  };
</script>
