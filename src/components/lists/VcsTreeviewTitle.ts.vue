<script setup lang="ts">
  import { computed, ref } from 'vue';
  import type { PropType } from 'vue';
  import { VTooltip } from 'vuetify/components';
  import { createEllipseTooltip } from '../composables.js';
  import type { VcsTreeNodeItem } from './VcsTreeNode.ts.vue';

  const props = defineProps({
    item: {
      type: Object as PropType<VcsTreeNodeItem>,
      required: true,
    },
    cursorPointer: {
      type: Boolean,
      default: false,
    },
  });

  const titleParent = ref<HTMLElement | undefined>(undefined);

  const tooltip = createEllipseTooltip(
    computed(() => titleParent.value),
    computed(() => props.item.tooltip),
    computed(() => props.item.title || props.item.name),
  );
</script>
<template>
  <div
    class="title-parent pr-2 vcs-treeview-title w-100"
    :class="{
      'cursor-pointer': cursorPointer && !item.disabled,
      disabled: item.disabled,
    }"
    ref="titleParent"
  >
    <span class="w-100">
      {{ $st(item.title || item.name) }}
    </span>
    <v-tooltip v-if="tooltip" activator="parent">
      {{ $st(tooltip) }}
    </v-tooltip>
  </div>
</template>
<style lang="scss" scoped>
  .title-parent {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cursor-pointer {
    cursor: pointer;
  }
  .disabled {
    cursor: default;
    opacity: var(--v-disabled-opacity);
  }
</style>
