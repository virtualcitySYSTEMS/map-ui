<template>
  <div v-if="orderedButtons.length > 0">
    <v-menu
      v-model="open"
      @input="$emit('toggle', open)"
      offset-y
      :nudge-left="nudgeLeft"
      z-index="0"
    >
      <template #activator="{ on, attrs }">
        <VcsToolButton
          class="vcs-toolbox-toggle-button"
          width="48"
          :icon="group.icon"
          :disabled="group.disabled"
          :tooltip="group.title"
          :active="open || hasActiveAction"
          :color="hasActiveAction ? 'primary' : ''"
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>{{ open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </VcsToolButton>
      </template>

      <v-toolbar
        id="vcs-toolbox-toolbar--secondary"
        class="vcs-toolbox-2 toolbar__secondary mx-auto v-sheet marginToTop"
        :height="40"
        width="fit-content"
        dense
      >
        <v-toolbar-items class="w-full">
          <div class="d-flex align-center justify-space-between w-full mx-1">
            <VcsToolButton
              v-for="{ id, action } in orderedButtons"
              :key="id"
              :tooltip="action.title"
              :icon="action.icon"
              :disabled="action.disabled"
              :active="action.active"
              @click="action.callback($event)"
              v-bind="{ ...$attrs }"
            />
          </div>
        </v-toolbar-items>
      </v-toolbar>
    </v-menu>
  </div>
</template>
<style lang="scss">
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
  import { computed, ref } from 'vue';
  import { VMenu, VIcon, VToolbar, VToolbarItems } from 'vuetify/lib';
  import VcsToolButton from '../../components/buttons/VcsToolButton.vue';
  import { getComponentsByOrder } from './toolboxManager.js';

  /**
   * @description
   * A Toolbox Button rendering a menu dropdown with actions using {@link https://vuetifyjs.com/en/api/v-menu/|vuetify v-menu} and {@link VcsButton}.
   * The button is rendered in primary color if at least one action is active.
   * The button is rendered in basic color if menu is open and no action is active.
   * @vue-prop {GroupToolboxComponent} group - A toolbox group of type 'group'.
   * @vue-computed {Array<ButtonComponent>} buttons - Buttons of the group.
   * @vue-computed {Array<ButtonComponent>} orderedButtons - Buttons of the group sorted by owner.
   * @vue-computed {boolean} hasActiveAction - Whether the group has an active action.
   * @vue-computed {number} nudgeLeft - offset of the dropdown toolbar to the left
   */
  export default {
    name: 'ToolboxActionGroup',
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

      const buttons = computed(() => {
        const { buttonManager } = props.group;
        const buttonIds = ref(buttonManager.componentIds);
        return buttonIds.value.map((id) => buttonManager.get(id));
      });
      const orderedButtons = computed(() =>
        getComponentsByOrder(buttons.value),
      );
      const hasActiveAction = computed(() =>
        orderedButtons.value.some((a) => a.action.active),
      );

      /**
       * v-menu auto prop is not working as expected.
       * Workaround using hardcoded button sizes and paddings
       * @type {ComputedRef<number>}
       */
      const nudgeLeft = computed(() => {
        const toolboxBtnWidth = 42 + 8; // with padding
        const menuBtnWidth = 48;
        return buttons.value.length * (toolboxBtnWidth / 2) - menuBtnWidth / 2;
      });

      return {
        open,
        orderedButtons,
        nudgeLeft,
        hasActiveAction,
      };
    },
  };
</script>
