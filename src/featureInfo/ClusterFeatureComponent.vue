<script setup>
  import { ref, shallowRef, inject, onUnmounted } from 'vue';
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

  const app = inject('vcsApp');
  const open = ref(true);
  const selected = shallowRef([]);

  const selectionListener = app.featureInfo.featureChanged.addEventListener(
    (f) => {
      if (f === null) {
        selected.value = [];
      } else {
        const item = props.items.find((i) => i.name === f.getId());
        if (item) {
          selected.value = [item];
        }
      }
    },
  );

  onUnmounted(() => {
    selectionListener();
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
    <p v-else>{{ $t('featureInfo.cluster.empty') }}</p>
  </div>
</template>

<style scoped lang="scss"></style>
