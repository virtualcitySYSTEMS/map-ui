<script setup>
  import { ref, shallowRef, inject, onUnmounted } from 'vue';
  import { VIcon } from 'vuetify/components';
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
      <div
        class="list-toggle-button d-flex align-center bg-base-lighten-3 px-1"
      >
        <span
          @click="open = !open"
          :aria-expanded="open"
          class="d-flex justify-space-between cursor-pointer"
        >
          <v-icon>{{
            open ? 'mdi-arrow-collapse-vertical' : 'mdi-arrow-expand-vertical'
          }}</v-icon>
          <strong class="px-1">
            {{
              open
                ? $t('featureInfo.cluster.collapse')
                : $t('featureInfo.cluster.expand')
            }}
          </strong>
        </span>
      </div>
    </template>
    <p v-else>{{ $t('featureInfo.cluster.empty') }}</p>
  </div>
</template>

<style scoped lang="scss">
  .list-toggle-button {
    height: calc(var(--v-vcs-font-size) * 2 + 14px);
  }
  // remove hover shadow over button
  :deep(.v-btn__overlay) {
    --v-hover-opacity: 0;
  }
</style>
