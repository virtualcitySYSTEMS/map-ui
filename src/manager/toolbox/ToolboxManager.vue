<template>
  <v-toolbar
    v-if="
      toolboxOpen && orderedGroups.length > 0 && $vuetify.breakpoint.mdAndUp
    "
    class="vcs-toolbox toolbar__secondary mx-auto v-sheet marginToTop"
    :class="{
      'rounded-b': !open,
      primary: !isDefaultToolbox,
      'lighten-5': !isDefaultToolbox,
    }"
    :height="40"
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
          @toggle="(groupOpen) => (open = groupOpen)"
        />
        <ToolboxActionSelect
          v-else-if="group.type === ToolboxType.SELECT"
          :group="group"
          @toggle="(selectOpen) => (open = selectOpen)"
        />
        <VcsToolButton
          v-else
          :tooltip="group.action.title"
          :icon="group.action.icon"
          :active="group.action.active"
          :background="group.action.background"
          :disabled="group.action.disabled"
          @click.stop="group.action.callback($event)"
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
   * @property {Array<ButtonComponent>} buttons
   * @property {string} [selected]
   * @property {function(index:number):void} [selectCb]
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
      });

      return {
        toolboxOpen,
        orderedGroups,
        isDefaultToolbox: computed(
          () => toolboxName.value === defaultToolboxName,
        ),
        ToolboxType,
        open: ref(false),
      };
    },
  };
</script>
