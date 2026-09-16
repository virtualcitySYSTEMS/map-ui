<script setup lang="ts">
  import type { PropType } from 'vue';
  import { inject, onUnmounted, ref, shallowRef, watch } from 'vue';
  import { type EventFeature, LayerState } from '@vcmap/core';
  import type VcsUiApp from '../vcsUiApp.js';
  import type {
    VcsGroupedListItem,
    VcsListGroup,
  } from '../components/lists/VcsGroupedList.ts.vue';
  import VcsGroupedList from '../components/lists/VcsGroupedList.ts.vue';

  const props = defineProps({
    items: { type: Array as PropType<VcsGroupedListItem[]>, default: () => [] },
    groups: { type: Array as PropType<VcsListGroup[]>, default: () => [] },
  });

  const emit = defineEmits(['close']);

  const app = inject('vcsApp') as VcsUiApp;
  const open = ref(true);
  const selected = shallowRef<VcsGroupedListItem[]>([]);

  const selectCurrentFeature = (f: EventFeature | null): void => {
    if (f == null) {
      selected.value = [];
    } else {
      const item = props.items.find((i) => i.name === f.getId());
      if (item) {
        selected.value = [item];
      }
    }
  };
  selectCurrentFeature(app.featureInfo.selectedFeature);

  const selectionListener =
    app.featureInfo.featureChanged.addEventListener(selectCurrentFeature);

  const items = ref(props.items);
  const groups = ref(props.groups);

  watch(
    () => props.items,
    (newItems) => {
      items.value = newItems;
      selectCurrentFeature(app.featureInfo.selectedFeature);
    },
  );
  watch(
    () => props.groups,
    (newGroups) => {
      groups.value = newGroups;
    },
  );

  const layerListener = app.layers.stateChanged.addEventListener((layer) => {
    if (
      layer.state === LayerState.INACTIVE &&
      items.value.some((item) => item.group === layer.name)
    ) {
      items.value = items.value.filter((item) => item.group !== layer.name);
      groups.value = groups.value.filter((group) => group.name !== layer.name);
      if (items.value.length === 0) {
        emit('close');
      }
    }
  });

  onUnmounted(() => {
    selectionListener();
    layerListener();
  });
</script>

<template>
  <div>
    <template v-if="items.length > 0">
      <VcsGroupedList
        v-if="open"
        :items="items"
        :groups="groups"
        v-model="selected"
        selectable
        single-select
        searchable
        open-all
      />
    </template>
    <p v-else class="ma-2">{{ $st('featureInfo.cluster.empty') }}</p>
  </div>
</template>

<style scoped lang="scss"></style>
