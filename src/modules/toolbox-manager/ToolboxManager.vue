<template>
  <v-toolbar
    dense
    class="vcs-toolbox toolbar__secondary rounded-b mx-auto v-sheet"
    :style="{ maxWidth: `${getWidth()}px` }"
  >
    <v-toolbar-items class="w-full">
      <div class="d-flex align-center justify-space-between w-full">
        <span
          v-for="group of groups"
          :key="group.id"
        >
          <component
            v-if="group.type === 'customComponent'"
            :is="group.component"
            :icon="'$vcsObjectAttribute'"
            :value="group.active"
            @click.native="group.active = !group.active"
            :group="group"
          />
          <Button
            v-if="group.type === 'toggleButton'"
            :group="group"
            :icon="'$vcsObjectAttribute'"
            :value="group.active"
            @click.native="group.active = !group.active"
          />
          <ToolboxSingleSelectButton
            v-if="toolboxGroupVisible(group) && group.type === 'singleSelectButton'"
            :group="group"
            @selected="id => selectSingleSelectOption(id)"
            @set-open="({ id, open }) => setGroupOpen({ id, open })"
          />
          <ToolboxMultiSelectButton
            v-if="toolboxGroupVisible(group) && group.type === 'multiSelectButton'"
            :group="group"
            @selected="id => selectMultiSlectOption(id)"
            @set-open="({ id, open }) => setGroupOpen({ id, open })"
          />
        </span>
      </div>
    </v-toolbar-items>
  </v-toolbar>
</template>

<style lang="scss" scoped>
  .toolbar__secondary {
    position: absolute;
    top: 48px;
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
</style>

<script>
  import Vue from 'vue';

  import { inject } from '@vue/composition-api';
  import { VcsButton } from '@vcsuite/ui-components';

  import ToolboxSingleSelectButton from './ToolboxSingleSelectButton.vue';
  import ToolboxMultiSelectButton from './ToolboxMultiSelectButton.vue';

  export default Vue.extend({
    name: 'VcsToolbox',
    props: {
      width: {
        type: Number,
        default: 600,
      },
    },
    setup() {
      const app = inject('vcsApp');
      const { toolboxManager } = app;
      const { state: { groups } } = toolboxManager;
      const getWidth = () => toolboxManager.getNumberOfUsedSlots() * 75;
      const toolboxGroupVisible = value => value &&
        value.options &&
        value.options.length;
      const selectSingleSelectOption = (id) => {
        toolboxManager.bringToTop(id);
      };
      const selectMultiSlectOption = (id) => {
        toolboxManager.selectOption(id);
      };
      const setGroupOpen = ({ id, open }) => {
        toolboxManager.setGroupOpen(id, open);
      };

      return {
        groups,
        getWidth,
        selectSingleSelectOption,
        selectMultiSlectOption,
        setGroupOpen,
        toolboxGroupVisible,
      };
    },
    components: {
      ToolboxSingleSelectButton,
      ToolboxMultiSelectButton,
      VcsButton,
    },
  });
</script>
