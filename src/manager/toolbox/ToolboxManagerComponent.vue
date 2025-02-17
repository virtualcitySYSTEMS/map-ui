<template>
  <v-toolbar
    v-if="toolboxOpen && orderedGroups.length > 0"
    class="vcs-toolbox mx-auto elevation-4 opacity-80 toolbox-manager-component"
    :class="{
      'rounded-b': !open && !xs,
      'rounded-t': xs,
      'vcs-toolbox__secondary': !isDefaultToolbox,
      mobileToolbox: xs,
    }"
    :height="toolboxHeight"
    :style="{ zIndex: xs ? zIndexMobile : zIndex }"
    @click.stop="bringToTop"
  >
    <v-toolbar-items class="w-100 px-4 gc-1">
      <div
        class="d-flex align-center justify-space-between w-100"
        v-for="group in orderedGroups"
        :key="group.id"
      >
        <ToolboxActionGroup
          v-if="group.type === ToolboxType.GROUP"
          :group="group"
          @toggle="openGroup"
          @click="
            bringToTop;
            xs && toolboxToggleAction.callback();
          "
        />
        <ToolboxActionSelect
          v-else-if="group.type === ToolboxType.SELECT"
          :group="group"
          @toggle="openGroup"
          @click="
            bringToTop;
            xs && toolboxToggleAction.callback();
          "
        />
        <VcsToolButton
          v-else
          :tooltip="group.action.title"
          :icon="group.action.icon"
          :active="group.action.active"
          :background="group.action.background"
          :disabled="group.action.disabled"
          @click.stop="
            bringToTop();
            xs && toolboxToggleAction.callback();
            group.action.callback($event);
          "
          v-bind="{ ...$attrs }"
        />
      </div>
    </v-toolbar-items>
  </v-toolbar>
</template>

<style lang="scss" scoped>
  .vcs-toolbox__secondary {
    &.vcs-toolbox.v-theme {
      &--light {
        background-color: rgba(var(--v-theme-primary-lighten-3));
      }
      &--dark {
        background-color: rgba(var(--v-theme-primary-darken-4));
      }
    }
  }
  .vcs-toolbox {
    margin-top: 2px;
    width: fit-content;
  }
  .mobileToolbox {
    bottom: 0px !important;
    position: absolute !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
  }
</style>

<script>
  import { inject, ref, computed, watch, onUnmounted, reactive } from 'vue';
  import { useDisplay } from 'vuetify';
  import { VToolbar, VToolbarItems } from 'vuetify/components';
  import {
    defaultToolboxName,
    getComponentsByOrder,
    ToolboxType,
  } from './toolboxManager.js';
  import ToolboxActionSelect from './SelectToolboxComponent.vue';
  import ToolboxActionGroup from './GroupToolboxComponent.vue';
  import VcsToolButton from '../../components/buttons/VcsToolButton.vue';
  import { vcsAppSymbol } from '../../pluginHelper.js';
  import { ButtonLocation, deviceSymbol } from '../navbarManager.js';
  import { useFontSize } from '../../vuePlugins/vuetify.js';

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

  export const toolboxComponentId = 'toolbox';

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
    name: 'ToolboxManagerComponent',
    components: {
      ToolboxActionSelect,
      ToolboxActionGroup,
      VcsToolButton,
      VToolbar,
      VToolbarItems,
    },
    setup() {
      const app = inject('vcsApp');

      const { smAndUp, xs, sm, mdAndUp } = useDisplay();

      const groups = computed(() => {
        return app.toolboxManager.componentIds.map((id) =>
          app.toolboxManager.get(id),
        );
      });

      const toolboxName = ref(app.toolboxManager.toolboxName);
      const nameChangeListener =
        app.toolboxManager.toolboxNameChanged.addEventListener((name) => {
          toolboxName.value = name;
        });

      const zIndex = app.windowManager.addExternalIdToZIndex(
        toolboxComponentId,
        vcsAppSymbol,
      );
      // The zIndex of the mobile toolbox is two higher than the desktop toolbox because it needs to be above the windows
      const zIndexMobile = computed(() => zIndex.value + 2);

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
          (c.type === ToolboxType.SINGLE ||
            c?.action?.tools?.length > 1 ||
            c.buttonManager?.componentIds?.length > 0) &&
          ((xs.value === true && c[deviceSymbol]?.mobile === true) ||
            (sm.value === true && c[deviceSymbol]?.tablet === true) ||
            (mdAndUp.value === true && c[deviceSymbol]?.desktop === true))
        );
      }

      const orderedGroups = computed(() =>
        getComponentsByOrder(groups.value)
          .filter((comp) => comp.toolboxNames.includes(toolboxName.value))
          .filter(filterFunc),
      );

      const toolboxOpen = app.toolboxManager.open;
      if (xs.value) {
        toolboxOpen.value = false;
      }
      const toolboxToggleAction = reactive({
        name: 'toolboxToggleAction',
        icon: '$vcsTools',
        title: 'toolbox.title',
        active: toolboxOpen.value,
        callback() {
          this.active = !this.active;
          toolboxOpen.value = this.active;
        },
      });

      function handleToolboxButton() {
        if (orderedGroups.value.length > 0) {
          if (!app.navbarManager.has(toolboxComponentId)) {
            app.navbarManager.add(
              {
                id: toolboxComponentId,
                action: toolboxToggleAction,
              },
              vcsAppSymbol,
              ButtonLocation.TOOL,
              { desktop: true, tablet: true, mobile: true },
            );
          }
        } else {
          app.navbarManager.remove(toolboxComponentId);
        }
      }
      handleToolboxButton();

      watch(groups, () => handleToolboxButton());

      onUnmounted(() => {
        nameChangeListener();
        app.windowManager.removeExternalIdFromZIndex(toolboxComponentId);
        app.navbarManager.remove(toolboxComponentId);
      });

      watch(toolboxOpen, () => {
        if (toolboxOpen.value) {
          app.windowManager.bringWindowToTop(toolboxComponentId);
        }
      });

      const open = ref(false);
      const bringToTop = () => {
        app.windowManager.bringWindowToTop(toolboxComponentId);
      };

      const fontSize = useFontSize();
      const toolboxHeight = computed(() => {
        return fontSize.value * 3 + 1;
      });
      return {
        smAndUp,
        toolboxOpen,
        toolboxToggleAction,
        orderedGroups,
        zIndex,
        zIndexMobile,
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
        toolboxHeight,
        xs,
      };
    },
  };
</script>
