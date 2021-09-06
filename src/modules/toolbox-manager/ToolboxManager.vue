<template>
  <v-toolbar
    dense
    class="vcs-toolbox toolbar__secondary rounded-b mx-auto"
    :style="{ maxWidth: `${getWidth()}px` }"
  >
    <v-toolbar-items class="w-full">
      <div class="d-flex align-center justify-space-between w-full">
        <span
          v-for="(value, key) of items"
          :key="key"
        >
          <ExpandableButton
            v-if="value && value.length"
            :options="value"
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

  import ExpandableButton from '@vcsuite/uicomponents/ExpandableButton.vue';
  import { inject } from '@vue/composition-api';

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
      const { state: { items } } = toolboxManager;
      const getWidth = () => toolboxManager.getNumberOfUsedSlots() * 75;
      return {
        items,
        getWidth,
      };
    },
    components: {
      ExpandableButton,
    },
  });
</script>
