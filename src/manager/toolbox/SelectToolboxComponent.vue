<template>
  <div
    v-if="group.action"
    :class="{ 'vcs-toolbox-action-select-button--active': open }"
    style="width: fit-content"
  >
    <VcsToolButton
      :key="group.action.tools[group.action.currentIndex].name"
      :tooltip="group.action.tools[group.action.currentIndex].title"
      :icon="group.action.tools[group.action.currentIndex].icon"
      :active="group.action.active"
      :disabled="group.action.disabled"
      :background="group.action.background"
      @click="group.action.callback($event)"
      v-bind="{ ...$attrs }"
      class="vcs-toolbox-action-selected"
      :min-width="32"
      :width="32"
    />
    <v-menu
      v-model="open"
      @input="$emit('toggle', open)"
      offset-y
      :nudge-left="nudgeLeft"
      z-index="0"
    >
      <template #activator="{ on, attrs }">
        <VcsToolButton
          :tooltip="group.action.title"
          :disabled="group.action.disabled"
          v-bind="attrs"
          v-on="on"
          class="vcs-toolbox-action-select"
          :min-width="16"
          :width="16"
        >
          <v-icon>{{ open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </VcsToolButton>
      </template>

      <v-toolbar
        class="vcs-toolbox-2 toolbar__secondary mx-auto v-sheet marginToTop justify-center"
        :height="40"
        width="fit-content"
        dense
      >
        <v-toolbar-items class="w-full">
          <div class="d-flex align-center justify-space-between w-full mx-1">
            <VcsToolButton
              v-for="(item, index) in group.action.tools"
              :key="`${item.name}-${index}`"
              :tooltip="item.title"
              :icon="item.icon"
              :disabled="item.disabled"
              @click="group.action.selected(index)"
              v-bind="{ ...$attrs }"
            />
          </div>
        </v-toolbar-items>
      </v-toolbar>
    </v-menu>
  </div>
</template>
<style lang="scss">
  @import '../../styles/shades.scss';

  .vcs-toolbox-action-selected > .v-btn.vcs-button--large {
    max-width: 40px;
  }

  .vcs-toolbox-action-select > .v-btn.vcs-button--large {
    max-width: 8px;
  }

  .vcs-toolbox-action-select-button--active {
    //border: 2px solid var(--v-shades-base);
    border-radius: 4px;
  }
  .theme--light .vcs-toolbox-action-select-button--active {
    background: map-get($shades, 'white');
  }
  .theme--dark .vcs-toolbox-action-select-button--active {
    background: map-get($shades, 'black');
  }

  .vcs-toolbox-2 {
    .v-toolbar__content {
      padding: 0;
    }
  }

  .marginToTop {
    margin-top: 3px;
  }
</style>
<script>
  import { ref, computed } from 'vue';
  import { VMenu, VIcon, VToolbar, VToolbarItems } from 'vuetify/lib';
  import VcsToolButton from '../../components/buttons/VcsToolButton.vue';

  /**
   * @description
   * A dynamic Toolbox Button rendering a selected item and a dropdown to select an item using {@link https://vuetifyjs.com/en/api/v-menu/|vuetify v-menu} and {@link VcsButton}.
   * @vue-prop {SelectToolboxComponent} group - A toolbox group of type 'select'.
   * @vue-computed {number} nudgeLeft - offset of the dropdown toolbar to the left
   */
  export default {
    name: 'ToolboxActionSelect',
    components: {
      VcsToolButton,
      VMenu,
      VIcon,
      VToolbar,
      VToolbarItems,
    },
    props: {
      group: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      const open = ref(false);

      /**
       * v-menu auto prop is not working as expected.
       * Workaround using hardcoded button sizes and paddings
       * @type {ComputedRef<number>}
       */
      const nudgeLeft = computed(() => {
        const toolboxBtnWidth = 42 + 8; // with padding
        const menuBtnWidth = 16;
        return (
          props.group.action.tools.length * (toolboxBtnWidth / 2) +
          menuBtnWidth / 2
        );
      });

      return {
        open,
        nudgeLeft,
      };
    },
  };
</script>
