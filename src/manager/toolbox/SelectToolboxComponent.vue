<template>
  <div
    v-if="group.action"
    class="d-flex select-toolbox-component"
    :class="{ 'vcs-toolbox-action-select-button--active': open }"
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
      location="bottom center"
      @update:model-value="$emit('toggle', open)"
      z-index="0"
    >
      <template #activator="{ props }">
        <VcsToolButton
          :tooltip="group.action.title"
          :disabled="group.action.disabled"
          v-bind="props"
          class="vcs-toolbox-action-select px-0"
          :min-width="16"
          :width="16"
        >
          <v-icon>{{ open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </VcsToolButton>
      </template>

      <v-toolbar
        class="vcs-toolbox-2 mx-auto marginToTop rounded-b elevation-4 opacity-80 px-1"
        :height="toolboxHeight"
        dense
      >
        <v-toolbar-items class="w-100">
          <div class="d-flex align-center justify-space-between gc-1 w-100">
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
<style lang="scss" scoped>
  .marginToTop {
    margin-top: 3px;
  }
</style>
<script>
  import { ref, computed } from 'vue';
  import { VMenu, VIcon, VToolbar, VToolbarItems } from 'vuetify/components';
  import VcsToolButton from '../../components/buttons/VcsToolButton.vue';
  import { useFontSize } from '../../vuePlugins/vuetify.js';

  /**
   * @description
   * A dynamic Toolbox Button rendering a selected item and a dropdown to select an item using {@link https://vuetifyjs.com/en/api/v-menu/|vuetify v-menu} and {@link VcsButton}.
   * @vue-prop {SelectToolboxComponent} group - A toolbox group of type 'select'.
   */
  export default {
    name: 'SelectToolboxComponent',
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
    setup() {
      const open = ref(false);
      const fontSize = useFontSize();
      const toolboxHeight = computed(() => {
        return fontSize.value * 3 + 1;
      });
      return {
        open,
        toolboxHeight,
      };
    },
  };
</script>
