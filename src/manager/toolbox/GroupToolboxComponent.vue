<template>
  <div v-if="orderedButtons.length > 0">
    <v-menu
      v-model="open"
      @update:model-value="$emit('toggle', open)"
      location="bottom center"
      z-index="0"
    >
      <template #activator="{ props }">
        <VcsToolButton
          class="vcs-toolbox-toggle-button"
          width="48"
          :icon="group.icon"
          :disabled="group.disabled"
          :tooltip="group.title"
          :active="hasActiveAction"
          :color="hasActiveAction ? 'primary' : ''"
          v-bind="props"
        >
          <v-icon>{{ open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </VcsToolButton>
      </template>

      <v-toolbar
        id="vcs-toolbox-toolbar--secondary"
        class="mx-auto marginToTop rounded-b elevation-4 opacity-80 px-1"
        :height="itemHeight + 8"
      >
        <v-toolbar-items class="w-100">
          <div class="d-flex align-center justify-space-between gc-1 w-100">
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
<style lang="scss" scoped>
  .marginToTop {
    margin-top: 3px;
  }
</style>
<script>
  import { computed, ref } from 'vue';
  import { VMenu, VIcon, VToolbar, VToolbarItems } from 'vuetify/components';
  import VcsToolButton from '../../components/buttons/VcsToolButton.vue';
  import { getComponentsByOrder } from './toolboxManager.js';
  import { useItemHeight } from '../../vuePlugins/vuetify.js';

  /**
   * @description
   * A Toolbox Button rendering a menu dropdown with actions using {@link https://vuetifyjs.com/en/api/v-menu/|vuetify v-menu} and {@link VcsButton}.
   * The button is rendered in primary color if at least one action is active.
   * The button is rendered in basic color if menu is open and no action is active.
   * @vue-prop {GroupToolboxComponent} group - A toolbox group of type 'group'.
   * @vue-computed {Array<ButtonComponent>} buttons - Buttons of the group.
   * @vue-computed {Array<ButtonComponent>} orderedButtons - Buttons of the group sorted by owner.
   * @vue-computed {boolean} hasActiveAction - Whether the group has an active action.
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
        return buttonManager.componentIds.map((id) => buttonManager.get(id));
      });
      const orderedButtons = computed(() =>
        getComponentsByOrder(buttons.value),
      );
      const hasActiveAction = computed(() =>
        orderedButtons.value.some((a) => a.action.active),
      );

      const itemHeight = useItemHeight();

      return {
        open,
        orderedButtons,
        hasActiveAction,
        itemHeight,
      };
    },
  };
</script>
