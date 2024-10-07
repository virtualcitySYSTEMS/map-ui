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
        >
          <a :href="attribution.url ? attribution.url : null" target="_blank">
            {{ $st(attribution.provider) }} {{ attribution.year }}
          </a>
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
    <v-sheet v-else class="ma-2">
      {{ $t('footer.attributions.empty') }}
    </v-sheet>
  </v-sheet>
</template>

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
</style>

<script>
  import {
    VList,
    VListItem,
    VListItemTitle,
    VListItemSubtitle,
    VSheet,
  } from 'vuetify/components';

  /**
   * @description Lists attributions of maps, layers and oblique collections
   * @vue-prop {import("vue").UnwrapRef<Array<AttributionEntry>} entries - array with one entry per active VcsObject
   */
  export default {
    name: 'VcsAttributions',
    components: {
      VList,
      VListItem,
      VListItemTitle,
      VListItemSubtitle,
      VSheet,
    },
    props: {
      entries: {
        type: Array,
        default: () => [],
      },
    },
  };
</script>
