<template>
  <v-toolbar
    absolute
    :density="density"
    elevation="0"
    class="px-4 vcs-navbar"
    :height="toolbarHeight"
    :style="xs ? { bottom: 0 } : { top: 0 }"
  >
    <v-container fluid class="pa-0">
      <v-row no-gutters class="align-center">
        <v-col>
          <v-toolbar-items>
            <div class="d-flex">
              <VcsActionButtonList
                :actions="mapActions"
                :overflow-count="smAndDown ? 2 : 4"
                :force-overflow="false"
                button="VcsToolButton"
                :data-vcs-button-location="ButtonLocation.MAP"
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
                :overflow-count="smAndDown ? 2 : 3"
                :force-overflow="false"
                button="VcsToolButton"
                :data-vcs-button-location="ButtonLocation.CONTENT"
              />
              <v-divider
                v-if="contentActions.length > 0 && toolActions.length > 0"
                class="mx-2"
                vertical
                inset
              />
              <VcsActionButtonList
                :actions="toolActions"
                :overflow-count="smAndDown ? 1 : 2"
                :force-overflow="false"
                v-if="smAndUp"
                button="VcsToolButton"
                :data-vcs-button-location="ButtonLocation.TOOL"
              />
            </div>
          </v-toolbar-items>
        </v-col>
        <v-col class="d-flex justify-center flex-grow-2 mx-2">
          <div class="d-flex align-center">
            <template v-if="!smAndDown && logo">
              <img class="logo" :src="logo" draggable="false" alt="Logo" />
            </template>
            <div
              v-if="mdAndUp && config.appTitle"
              class="ml-4 text-h6 font-weight-bold"
              style="line-height: 1.1"
            >
              {{ $st(config.appTitle) }}
            </div>
          </div>
        </v-col>
        <v-col class="align-content-end d-flex justify-end">
          <v-toolbar-items v-if="smAndUp">
            <div class="d-flex">
              <VcsActionButtonList
                :actions="projectActions"
                :overflow-count="smAndDown ? 1 : 2"
                :force-overflow="false"
                button="VcsToolButton"
                :data-vcs-button-location="ButtonLocation.PROJECT"
              />
              <v-divider
                v-if="projectActions.length > 0 && menuActions.length > 0"
                vertical
                inset
                class="mx-2"
              />
              <div class="d-flex gc-2" data-vcs-nav-general-buttons>
                <v-menu
                  v-if="!config.hideShareButton && shareActions.length > 0"
                >
                  <template #activator="{ props }">
                    <VcsToolButton
                      v-bind="props"
                      tooltip="navbar.share.tooltip"
                      icon="$vcsShare"
                      id="vcs-navbar-share-menu-activator"
                    />
                  </template>
                  <VcsActionList
                    :actions="shareActions"
                    tooltip-position="left"
                    :show-icon="true"
                    :data-vcs-button-location="ButtonLocation.SHARE"
                  />
                </v-menu>
                <VcsToolButton
                  class="d-flex"
                  v-if="searchAction"
                  :data-action-name="searchAction.name"
                  :key="searchAction.name"
                  :tooltip="searchAction.title"
                  :icon="searchAction.icon"
                  :active="searchAction.active"
                  :background="searchAction.background"
                  @click.stop="searchAction.callback($event)"
                  v-bind="{ ...$attrs }"
                />
                <v-menu v-if="!config.hideMenuButton && menuActions.length > 0">
                  <template #activator="{ props }">
                    <VcsToolButton
                      v-bind="props"
                      tooltip="navbar.menu.tooltip"
                      id="vcs-navbar-burger-menu-activator"
                      icon="$vcsMenu"
                    />
                  </template>
                  <VcsActionList
                    :actions="menuActions"
                    tooltip-position="left"
                    :show-icon="true"
                    :data-vcs-button-location="ButtonLocation.MENU"
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
    deviceSymbol,
    getActionsByLocation,
  } from '../manager/navbarManager.js';
  import VcsActionButtonList from '../components/buttons/VcsActionButtonList.vue';
  import VcsActionList from '../components/lists/VcsActionList.vue';
  import VcsToolButton from '../components/buttons/VcsToolButton.vue';
  import { createSearchButtonAction } from '../actions/actionHelper.js';
  import { useFontSize } from '../vuePlugins/vuetify.js';

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

      const { xs, mdAndUp, smAndDown, smAndUp, sm } = useDisplay();

      const buttonComponents = computed(() =>
        app.navbarManager.componentIds
          .map((id) => app.navbarManager.get(id))
          .filter((buttonComponent) => {
            if (sm.value) {
              return buttonComponent[deviceSymbol].tablet;
            } else {
              return buttonComponent[deviceSymbol].desktop;
            }
          }),
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
        const { config } = app.uiConfig;
        const isDark = app.vuetify.theme.current.value.dark;
        return isDark ? (config.logoDark ?? config.logo) : config.logo;
      });

      const { searchAction, destroy: destroySearchAction } =
        createSearchButtonAction(app);

      onUnmounted(() => {
        destroySearchAction();
      });

      const density = computed(() => {
        return xs.value ? 'comfortable' : 'compact';
      });

      const fontSize = useFontSize();
      const toolbarHeight = computed(() => {
        return fontSize.value * 3 + 8 + 16;
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
        smAndDown,
        density,
        mdAndUp,
        smAndUp,
        toolbarHeight,
        ButtonLocation,
      };
    },
  };
</script>

<style lang="scss" scoped>
  .logo {
    max-height: calc(var(--v-vcs-font-size) * 3 - 3px);
    margin: 0 auto;
  }
  .v-toolbar.v-toolbar--bottom {
    bottom: 0;
    position: fixed;
  }
  .flex-grow-2 {
    flex-grow: 2;
  }
</style>
