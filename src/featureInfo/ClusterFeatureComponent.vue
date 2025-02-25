<script setup>
  import { ref, shallowRef, inject, onUnmounted, watch } from 'vue';
  import { LayerState } from '@vcmap/core';
  import VcsGroupedList from '../components/lists/VcsGroupedList.vue';

  const props = defineProps({
    /** @type {import("../components/lists/VcsGroupedList.vue").VcsGroupedListItem} */
    items: {
      type: Array,
      default: () => [],
    },
    /** @type {import("../components/lists/VcsGroupedList.vue").VcsListGroup} */
    groups: {
      type: Array,
      default: () => [],
    },
  });

  const emit = defineEmits(['close']);

  const app = inject('vcsApp');
  const open = ref(true);
  const selected = shallowRef([]);

  const selectCurrentFeature = (f) => {
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
      <vcs-grouped-list
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
    <p v-else class="ma-2">{{ $t('featureInfo.cluster.empty') }}</p>
  </div>
</template>

<style scoped lang="scss"></style>
