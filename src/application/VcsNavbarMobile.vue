<template>
  <v-toolbar
    absolute
    density="comfortable"
    elevation="0"
    class="px-4 vcs-navbar-mobile"
    :height="toolbarHeight"
  >
    <v-container fluid class="pa-0">
      <v-row no-gutters class="align-center">
        <v-col>
          <v-toolbar-items>
            <div class="d-flex justify-space-between w-100">
              <VcsToolButton
                v-if="mobileMenuAction"
                :key="mobileMenuAction.name"
                :data-action-name="mobileMenuAction.name"
                :tooltip="mobileMenuAction.title"
                :icon="mobileMenuAction.icon"
                :active="mobileMenuAction.active"
                @click.stop="mobileMenuAction.callback($event)"
                v-bind="{ ...$attrs }"
              />
              <VcsToolButton
                v-if="searchAction"
                :data-action-name="searchAction.name"
                :key="searchAction.name"
                :tooltip="searchAction.title"
                :icon="searchAction.icon"
                :active="searchAction.active"
                @click.stop="searchAction.callback($event)"
                v-bind="{ ...$attrs }"
              />

              <MapsGroupMobileMenu> </MapsGroupMobileMenu>

              <template v-if="contentActions.length > 0">
                <VcsToolButton
                  v-for="(action, index) in contentActions"
                  :key="action.name || index"
                  :tooltip="action.title"
                  :icon="action.icon"
                  :active="action.active"
                  :data-action-name="action.name"
                  @click.stop="action.callback($event)"
                  v-bind="{ ...$attrs }"
                />
              </template>
              <VcsToolButton
                v-if="toolboxToggleAction"
                :key="toolboxToggleAction.name"
                :tooltip="toolboxToggleAction.title"
                :icon="toolboxToggleAction.icon"
                :active="toolboxToggleAction.active"
                :data-action-name="toolboxToggleAction.name"
                @click.stop="toolboxToggleAction.callback($event)"
                v-bind="{ ...$attrs }"
              />
            </div>
          </v-toolbar-items>
        </v-col>
      </v-row>
    </v-container>
  </v-toolbar>
</template>

<script>
  import { computed, inject, onUnmounted, shallowRef } from 'vue';
  import {
    VCol,
    VContainer,
    VRow,
    VToolbar,
    VToolbarItems,
  } from 'vuetify/components';
  import {
    ButtonLocation,
    deviceSymbol,
    getActionsByLocation,
  } from '../manager/navbarManager.js';
  import VcsToolButton from '../components/buttons/VcsToolButton.vue';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import {
    createSearchButtonAction,
    createToggleAction,
  } from '../actions/actionHelper.js';
  import { useFontSize } from '../vuePlugins/vuetify.js';
  import VcsMobileMenuList from './VcsMobileMenuList.vue';
  import { WindowSlot } from '../manager/window/windowManager.js';
  import MapsGroupMobileMenu from './MapsGroupMobileMenu.vue';
  import { toolboxComponentId } from '../manager/toolbox/ToolboxManagerComponent.vue';

  export const mobileMenuListId = 'mobileMenuList';

  /**
   * @description The menu bar of a VcsMap application in Mobile view.
   * Consists of three sections (first: Menu & Search, second: Map & Content, third: Toolbox).
   * They rearrange the buttons of the desktop view according to the new sections.
   * The ButtonLocation of MENU & imprint/dataprotection buttons are now in the Mobile Menu, the MAP and CONTENT are now in the second section, and the Toolbox is in the third section.
   */
  export default {
    name: 'VcsNavbarMobile',
    components: {
      VcsToolButton,
      VToolbar,
      VContainer,
      VRow,
      VCol,
      VToolbarItems,
      MapsGroupMobileMenu,
    },
    setup() {
      const app = inject('vcsApp');

      const mobileButtonComponents = computed(() =>
        app.navbarManager.componentIds
          .map((id) => app.navbarManager.get(id))
          .filter((buttonComponent) => {
            return buttonComponent[deviceSymbol].mobile;
          }),
      );
      const getActions = (location) =>
        computed(() =>
          getActionsByLocation(
            mobileButtonComponents.value,
            location,
            [...app.plugins].map((p) => p.name),
          ),
        );

      const { searchAction, destroy: destroySearchAction } =
        createSearchButtonAction(app);

      onUnmounted(() => {
        destroySearchAction();
      });

      const fontSize = useFontSize();
      const toolbarHeight = computed(() => {
        return fontSize.value * 3 + 1;
      });

      const mobileMenuList = {
        id: mobileMenuListId,
        component: VcsMobileMenuList,
        slot: WindowSlot.DYNAMIC_LEFT,
        state: {
          headerIcon: '$vcsMenu',
          headerTitle: 'Menu',
        },
      };

      const { action: mobileMenuAction } = createToggleAction(
        {
          name: 'mobileMenuAction',
          title: 'mobileMenu.title',
          icon: '$vcsMenu',
        },
        mobileMenuList,
        app.windowManager,
        vcsAppSymbol,
      );

      // only show the first two actions, rest handled in VcsMobileMenuList
      const contentActions = computed(() => {
        return getActions(ButtonLocation.CONTENT)?.value?.slice(0, 2);
      });

      const toolboxToggleAction = shallowRef(
        app.navbarManager.get(toolboxComponentId)?.action,
      );
      const navbarManagerAddedListener =
        app.navbarManager.added.addEventListener(({ id }) => {
          if (id === toolboxComponentId) {
            toolboxToggleAction.value =
              app.navbarManager.get(toolboxComponentId).action;
          }
        });

      onUnmounted(() => {
        navbarManagerAddedListener();
      });

      return {
        mobileMenuAction,
        contentActions,
        toolboxToggleAction,
        searchAction,
        toolbarHeight,
      };
    },
  };
</script>

<style lang="scss" scoped>
  .v-toolbar.v-toolbar--bottom {
    bottom: 0;
    position: fixed;
  }
  .flex-grow-2 {
    flex-grow: 2;
  }
  .vcs-navbar-mobile {
    bottom: 0;
    padding-top: calc(var(--v-vcs-font-size) - 5px);
    padding-bottom: calc(var(--v-vcs-font-size) - 5px);
  }
</style>
