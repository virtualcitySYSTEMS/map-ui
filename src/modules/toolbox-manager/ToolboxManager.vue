<template>
  <v-toolbar
    dense
    class="vcs-toolbox toolbar__secondary rounded-b mx-auto v-sheet"
    :style="{ maxWidth: `${getWidth()}px` }"
  >
    <v-toolbar-items class="w-full">
      <div class="d-flex align-center justify-space-between w-full">
        <span
          v-for="(value, key) of groups"
          :key="key"
        >
          <ToolboxButton
            v-if="value && value.options && value.options.length"
            :group="value"
            @selected="id => bringToTop(id)"
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
  import ToolboxButton from './ToolboxButton.vue';

  export default Vue.extend({
    name: 'VcsToolbox',
    props: {
      width: {
        type: Number,
        default: 600,
      },
    },
    setup() {
      const toolboxManager = inject('toolboxManager');
      const { state: { groups } } = toolboxManager;
      const getWidth = () => toolboxManager.getNumberOfUsedSlots() * 75;

      return {
        groups,
        getWidth,
        bringToTop: id => toolboxManager.bringToTop(id),
      };
    },
    components: {
      ToolboxButton,
    },
  });
</script>
