<template>
  <v-sheet>
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
          <a :href="attribution.url" target="_blank">
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
  @import '../styles/shades.scss';

  .theme--light {
    a {
      color: map-get($shades, 'black');
    }
  }
  .theme--dark {
    a {
      color: map-get($shades, 'white');
    }
  }
  a {
    &:hover {
      color: var(--v-primary-base);
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
