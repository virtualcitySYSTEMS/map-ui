<script setup>
  import {
    VExpansionPanel,
    VExpansionPanelText,
    VExpansionPanelTitle,
    VIcon,
    VTooltip,
    VListItemTitle,
  } from 'vuetify/components';
  import { computed, ref, useSlots } from 'vue';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import { createEllipseTooltip } from '../composables.js';

  const props = defineProps({
    heading: {
      type: String,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    headerActions: {
      type: Array,
      default: () => [],
    },
    actionButtonListOverflowCount: {
      type: Number,
      required: false,
      default: undefined,
    },
  });

  const slots = useSlots();

  const panelHeader = ref(null);
  const panelHeaderTooltip = createEllipseTooltip(
    computed(() => panelHeader.value?.$el),
    computed(() => undefined),
    computed(() => props.heading),
  );
</script>
<template>
  <v-expansion-panel :disabled="disabled" v-bind="$attrs">
    <v-expansion-panel-title static class="px-2">
      <template #default="{ expanded }">
        <v-list-item-title ref="panelHeader">
          <v-icon v-if="!expanded" class="pr-1"> mdi-chevron-right </v-icon>
          <v-icon v-if="expanded" class="pr-1"> mdi-chevron-down </v-icon>
          <span
            :class="{
              'vcs-panel-title__append':
                !!slots['header-append'] && !!panelHeaderTooltip,
            }"
          >
            {{ $st(heading) }}
          </span>
          <v-tooltip
            v-if="panelHeaderTooltip"
            activator=".v-expansion-panel-title"
          >
            {{ $st(panelHeaderTooltip) }}
          </v-tooltip>
          <slot name="header-append" />
        </v-list-item-title>
      </template>
      <template #actions>
        <VcsActionButtonList
          v-if="headerActions?.length > 0"
          :actions="headerActions"
          :overflow-count="actionButtonListOverflowCount"
        />
      </template>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <slot name="default" />
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<style scoped lang="scss">
  :deep(.v-expansion-panel-title) {
    font-size: var(--v-vcs-font-size);
    min-height: unset;
    height: var(--v-vcs-item-height);
    line-height: 1.2;
    padding: 0 8px;
  }

  .vcs-panel-title__append {
    width: 90%;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
  }

  :deep(.v-expansion-panel-text__wrapper) {
    padding: 0 0;
  }
</style>
