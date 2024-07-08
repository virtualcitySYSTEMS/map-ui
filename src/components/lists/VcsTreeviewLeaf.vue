<script setup>
  import { computed, onUnmounted, ref, watch } from 'vue';
  import { VIcon, VTooltip } from 'vuetify/components';
  import { VTreeviewItem } from 'vuetify/labs/VTreeview';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import ImageElementInjector from '../ImageElementInjector.vue';

  const props = defineProps({
    item: {
      type: Object,
      default: undefined,
    },
  });

  const isStringIcon = computed(() => typeof props.item?.icon === 'string');
  const parentElement = ref();
  const titleElem = ref();
  const offsetWidth = ref(0);
  const scrollWidth = ref(0);

  const observer = new ResizeObserver(() => {
    offsetWidth.value = titleElem.value.offsetWidth;
    scrollWidth.value = titleElem.value.scrollWidth;
  });

  watch(
    parentElement,
    (newValue, oldValue) => {
      if (oldValue) {
        observer.unobserve(oldValue.$el);
      }
      if (newValue) {
        observer.observe(newValue.$el);
      }
    },
    { immediate: true },
  );

  const tooltip = computed(() => {
    // tooltipIteration.value -= 1;
    if (props.item?.tooltip) {
      return props.item.tooltip;
    }
    if (offsetWidth.value < scrollWidth.value) {
      return props.item?.title ?? '';
    }
    return '';
  });

  onUnmounted(() => {
    observer.disconnect();
  });
</script>

<template>
  <v-treeview-item v-if="item" ref="parentElement">
    <template #prepend v-if="item.icon">
      <v-icon v-if="isStringIcon" :size="16" class="mr-1">
        {{ item.icon }}
      </v-icon>
      <ImageElementInjector :element="item.icon" v-else />
    </template>
    <div class="text-truncate" ref="titleElem">
      {{ $st(item.title || item.name) }}
    </div>
    <v-tooltip
      activator="parent"
      v-if="tooltip"
      :text="$st(tooltip)"
      location="bottom"
    />
    <template #append>
      <VcsActionButtonList
        v-if="item.actions?.length > 0"
        :actions="item.actions"
        :overflow-count="3"
        :disabled="item.disabled"
        right
        class="col-4 pa-0 d-flex align-center"
      />
    </template>
  </v-treeview-item>
</template>
