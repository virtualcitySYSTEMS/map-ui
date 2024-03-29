<template>
  <v-toolbar
    v-if="
      toolboxOpen && orderedGroups.length > 0 && $vuetify.breakpoint.mdAndUp
    "
    class="vcs-toolbox mx-auto v-sheet marginToTop"
    :class="{
      'rounded-b': !open,
      toolbar__secondary: !isDefaultToolbox,
    }"
    :height="40"
    :style="{ zIndex }"
    @click.stop="bringToTop"
    width="fit-content"
    dense
  >
    <v-toolbar-items class="w-full">
      <div
        class="d-flex align-center justify-space-between w-full mx-1"
        v-for="group in orderedGroups"
        :key="group.id"
      >
        <ToolboxActionGroup
          v-if="group.type === ToolboxType.GROUP"
          :group="group"
          @toggle="openGroup"
        />
        <ToolboxActionSelect
          v-else-if="group.type === ToolboxType.SELECT"
          :group="group"
          @toggle="openGroup"
        />
        <VcsToolButton
          v-else
          :tooltip="group.action.title"
          :icon="group.action.icon"
          :active="group.action.active"
          :background="group.action.background"
          :disabled="group.action.disabled"
          @click="group.action.callback($event)"
          v-bind="{ ...$attrs }"
        />
      </div>
    </v-toolbar-items>
  </v-toolbar>
</template>

<style lang="scss" scoped>
  .toolbar__secondary {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    &.vcs-toolbox.theme {
      &--light {
        background-color: var(--v-primary-lighten3) !important;
      }
      &--dark {
        background-color: var(--v-primary-darken4) !important;
      }
    }
    &.v-toolbar {
      ::v-deep .v-toolbar__content {
        padding: 0;
      }
    }
  }

  .marginToTop {
    margin-top: 2px;
  }

  .v-toolbar__items > div {
    gap: 8px;
    width: fit-content;
  }
</style>

<script>
  import { inject, ref, computed, watch, onUnmounted } from 'vue';
  import { ButtonLocation, vcsAppSymbol } from '@vcmap/ui';
  import { VToolbar, VToolbarItems } from 'vuetify/lib';
  import {
    defaultToolboxName,
    getComponentsByOrder,
    ToolboxType,
  } from './toolboxManager.js';
  import ToolboxActionSelect from './SelectToolboxComponent.vue';
  import ToolboxActionGroup from './GroupToolboxComponent.vue';
  import VcsToolButton from '../../components/buttons/VcsToolButton.vue';

  /**
   * @typedef {Object} ToolboxButtonGroup
   * @property {string} id
   * @property {string} type
   * @property {string} icon
   * @property {string} title
   * @property {Array<import("../buttonManager.js").ButtonComponent>} buttons
   * @property {string} [selected]
   * @property {function(number):void} [selectCb]
   */

  /**
   * @description ToolboxManager component rendering toolbox different kind of Toolbox buttons:
   * - Single toggle button
   * - Select drop down button to select an item, selected button is rendered besides
   * - Group drop down button showing a group of toggle buttons
   * Watches for changes in toolbox components.
   * Adds Toolbox button in Navbar, if components are available or removes it otherwise.
   * @vue-computed {Array<ToolboxButtonGroup>} groups - Array of group components
   * @vue-computed {Array<ToolboxButtonGroup>} orderedGroups - Array of group components sorted by owner
   */
  export default {
    name: 'VcsToolboxManager',
    components: {
      ToolboxActionSelect,
      ToolboxActionGroup,
      VcsToolButton,
      VToolbar,
      VToolbarItems,
    },
    setup() {
      const app = inject('vcsApp');

      const toolboxComponentIds = ref(app.toolboxManager.componentIds);
      const groups = computed(() => {
        return toolboxComponentIds.value.map((id) =>
          app.toolboxManager.get(id),
        );
      });

      const toolboxName = ref(app.toolboxManager.toolboxName);
      const nameChangeListener =
        app.toolboxManager.toolboxNameChanged.addEventListener((name) => {
          toolboxName.value = name;
        });

      const zIndex = app.windowManager.addExternalIdToZIndex(
        'toolbox',
        vcsAppSymbol,
      );

      /**
       * To be rendered in Toolbox components must meet certain conditions:
       * - SingleToolboxComponent: no further conditions
       * - SelectToolboxComponent: must have at least two tools
       * - GroupToolboxComponent: must have at least one member (button)
       * @param {SingleToolboxComponent|SelectToolboxComponent|GroupToolboxComponent} c
       * @returns {boolean}
       */
      function filterFunc(c) {
        return (
          c.type === ToolboxType.SINGLE ||
          c?.action?.tools?.length > 1 ||
          c.buttonManager?.componentIds?.length > 0
        );
      }
      const orderedGroups = computed(() =>
        getComponentsByOrder(groups.value)
          .filter((comp) => comp.toolboxNames.includes(toolboxName.value))
          .filter(filterFunc),
      );

      const toolboxOpen = ref(true);
      const toolboxToggleAction = {
        name: 'toolboxToggleAction',
        icon: '$vcsTools',
        title: 'Toolbox',
        active: true,
        callback() {
          this.active = !this.active;
          toolboxOpen.value = this.active;
        },
      };

      function handleToolboxButton() {
        if (orderedGroups.value.length > 0) {
          if (!app.navbarManager.has('toolbox')) {
            app.navbarManager.add(
              {
                id: 'toolbox',
                action: toolboxToggleAction,
              },
              vcsAppSymbol,
              ButtonLocation.TOOL,
            );
          }
        } else {
          app.navbarManager.remove('toolbox');
        }
      }
      handleToolboxButton();

      const stopWatching = watch(groups, () => handleToolboxButton());

      onUnmounted(() => {
        stopWatching();
        nameChangeListener();
        app.windowManager.removeExternalIdFromZIndex('toolbox');
      });

      watch(toolboxOpen, () => {
        if (toolboxOpen.value) {
          app.windowManager.bringWindowToTop('toolbox');
        }
      });

      const open = ref(false);
      const bringToTop = () => {
        app.windowManager.bringWindowToTop('toolbox');
      };

      return {
        toolboxOpen,
        orderedGroups,
        zIndex,
        isDefaultToolbox: computed(
          () => toolboxName.value === defaultToolboxName,
        ),
        ToolboxType,
        open,
        bringToTop,
        openGroup(group) {
          open.value = group;
          if (open.value) {
            bringToTop();
          }
        },
      };
    },
  };
</script>
