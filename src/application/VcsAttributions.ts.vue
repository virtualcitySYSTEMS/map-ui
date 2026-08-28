<template>
  <v-sheet class="vcs-attributions">
    <v-list v-if="entries.length" class="px-2">
      <v-list-item
        v-for="{ key, title, attributions } in entries"
        :key="key"
        class="px-0"
      >
        <v-list-item-title>{{ $st(title) }}</v-list-item-title>
        <v-list-item-subtitle
          v-for="attribution in attributions"
          :key="attribution.provider"
          :title="`${$st(attribution.provider)} ${attribution.year}`"
          class="d-inline-flex align-end"
        >
          <v-icon v-if="attribution.icon" class="mr-2 attribution-icon">
            {{ attribution.icon }}
          </v-icon>
          <a
            :href="attribution.url ? attribution.url : undefined"
            target="_blank"
          >
            {{ $st(attribution.provider) }} {{ attribution.year }}
          </a>
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
    <v-sheet v-else class="ma-2">
      {{ $st('footer.attributions.empty') }}
    </v-sheet>
  </v-sheet>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent } from 'vue';
  import {
    VIcon,
    VList,
    VListItem,
    VListItemTitle,
    VListItemSubtitle,
    VSheet,
  } from 'vuetify/components';
  import type { AttributionEntry } from './attributionsHelper.js';

  /**
   * @description Lists attributions of maps, layers and oblique collections
   * @vue-prop {import("vue").UnwrapRef<Array<AttributionEntry>>} entries - array with one entry per active VcsObject
   */
  export default defineComponent({
    name: 'VcsAttributions',
    components: {
      VIcon,
      VList,
      VListItem,
      VListItemTitle,
      VListItemSubtitle,
      VSheet,
    },
    props: {
      entries: {
        type: Array as PropType<Array<AttributionEntry>>,
        default: () => [],
      },
    },
  });
</script>

<style lang="scss" scoped>
  a {
    color: var(--v-theme-surface);
    &:hover {
      color: rgb(var(--v-theme-primary));
    }
    &:before {
      content: '\00a9';
    }
  }
  .attribution-icon {
    max-width: 30px;
  }
</style>
