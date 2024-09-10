<script setup>
  import { computed, ref } from 'vue';
  import { VTooltip } from 'vuetify/components';
  import { createEllipseTooltip } from '../composables.js';

  const props = defineProps({
    item: {
      type: Object,
      default: undefined,
    },
  });

  const titleParent = ref();

  const tooltip = createEllipseTooltip(
    computed(() => titleParent.value),
    computed(() => props.item.tooltip),
    computed(() => props.item.title || props.item.name),
  );
</script>
<style lang="scss" scoped>
  .title-parent {
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
<template>
  <div
    class="title-parent pr-2 vcs-treeview-title"
    ref="titleParent"
    @click.stop="item.clicked && !item.disabled && item.clicked($event)"
  >
    <span>
      {{ $st(item.title || item.name) }}
    </span>
    <v-tooltip v-if="tooltip" activator="parent">
      {{ $st(tooltip) }}
    </v-tooltip>
  </div>
</template>
