<script src="../../vcsUiApp.js"></script>
<template>
  <v-toolbar
    v-if="toolboxOpen && actionGroups.length > 0 && $vuetify.breakpoint.mdAndUp"
    dense
    class="vcs-toolbox toolbar__secondary mx-auto v-sheet marginToTop"
    :class="{ 'rounded-b': groupId === null }"
    :width="width"
  >
    <v-toolbar-items class="w-full">
      <div class="d-flex align-center justify-space-between w-full">
        <ToolboxGroupComponent
          v-for="(group, idx) in actionGroups"
          :key="group.id"
          :group-icon="group.icon"
          :group-title="group.title"
          :actions="group.actions"
          class="px-2"
          :active="groupId === group.id"
          :position="getPosition(idx)"
          @click="toggleGroup(group.id)"
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

    &.theme--light.v-toolbar.v-sheet {
      background-color: #ffffffda;
    }
  }

  .marginToTop {
    margin-top: 2px;
  }
</style>

<script>

import { inject, ref, computed, watch, onUnmounted } from 'vue';
import ToolboxGroupComponent from './ToolboxGroupComponent.vue';
import {ButtonLocation, vcsAppSymbol} from '@vcmap/ui';

/**
 * @typedef {Object} ActionGroup
 * @property {string} id
 * @property {string} icon
 * @property {string} title
 * @property {Array<VcsAction>} actions
 */

/**
 * @description ToolboxManager component rendering toolbox using {@link ToolboxGroupComponent}.
 * @vue-computed {Array<ActionGroup>} actionGroups - Array of group components
 * @vue-computed {number} width - width of toolbox depending on number of groups
 */
export default {
  name: 'VcsToolboxManager',
  components: {
    ToolboxGroupComponent,
  },
  setup() {
    const app = inject('vcsApp');

    const toolboxComponentIds = ref(app.toolboxManager.componentIds);
    const actionGroups = computed(() => {
      const groups = toolboxComponentIds.value.map(id => app.toolboxManager.get(id));
      return groups
        .map((g) => {
          const buttonIds = ref(g.buttonManager.componentIds);
          return {
            id: g.id,
            icon: g.icon,
            title: g.title,
            actions: buttonIds.value.map(id => g.buttonManager.get(id).action),
          };
        })
        .filter(g => g.actions.length > 0);
    });

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

    const stopWatching = watch([actionGroups],
      ([actionGroups]) => {
        if (actionGroups.length > 0) {
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
    );

    onUnmounted(() => {
      stopWatching();
    });

    // XXX can this solved by CSS to get rid of the hardcoded size and padding?
    const buttonSize = 54;
    const buttonPadding = 8;
    const size = buttonSize + (2 * buttonPadding);
    const width = computed(() => actionGroups.value.length * size);

    /**
     * calculates relative x-position of a button from the left edge of toolbar
     * @param {number} idx
     * @returns {number}
     */
    const getPosition = (idx) => (size * (idx + 1)) - (size / 2);

    return {
      toolboxOpen,
      actionGroups,
      width,
      getPosition,
      groupId: ref(null),
      toggleGroup(groupId) {
        if (this.groupId === groupId) {
          this.groupId = null;
        } else {
          this.groupId = groupId;
        }
      },
    };
  },
};
</script>
