<template>
  <v-list class="px-1">
    <v-list-item v-for="({key, title, attributions}) in entries" :key="key" class="px-1">
      <v-list-item-content>
        <v-list-item-title>{{ $t(title) }}</v-list-item-title>
        <v-list-item-subtitle
          v-for="attribution in attributions"
          :key="attribution.provider"
          :title="`${$t(attribution.provider)} ${attribution.year}`"
        >
          <a
            :href="attribution.url"
            target="_blank"
            class="text--secondary"
          >
            {{ $t(attribution.provider) }} {{ attribution.year }}
          </a>
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<style lang="scss" scoped>

  ::v-deep {
    a:before {
      content: '\00a9\00a0'
    }
  }

</style>

<script >
  import {
    VList,
    VListItem,
    VListItemContent,
    VListItemTitle,
    VListItemSubtitle,
  } from 'vuetify/lib';

  /**
   * Lists attributions of maps, layers and oblique collections
   * @vue-prop {import("vue").Ref<Array<AttributionEntry>} entries - array with one entry per active VcsObject
   */
  export default {
    name: 'VcsAttributions',
    components: {
      VList,
      VListItem,
      VListItemContent,
      VListItemTitle,
      VListItemSubtitle,
    },
    props: {
      entries: {
        type: Object,
        default: () => {},
      },
    },
  };
</script>
