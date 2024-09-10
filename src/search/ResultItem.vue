<template>
  <v-list-item v-if="item" v-bind="$attrs" class="result-item">
    <template #prepend v-if="item.icon">
      <v-icon>
        {{ item.icon }}
      </v-icon>
    </template>
    <template #title>
      <v-list-item-title>
        <span v-html="marked" />
      </v-list-item-title>
    </template>
    <v-tooltip activator="parent">
      {{ $st('search.select') }}
    </v-tooltip>
    <template #append>
      <VcsActionButtonList
        v-if="hasActions"
        :actions="item.actions"
        :overflow-count="2"
        right
      />
    </template>
  </v-list-item>
</template>

<script>
  import { computed } from 'vue';
  import {
    VIcon,
    VListItem,
    VListItemTitle,
    VTooltip,
  } from 'vuetify/components';
  import VcsActionButtonList from '../components/buttons/VcsActionButtonList.vue';

  /**
   * @param {string} text
   * @param {string} query
   * @returns {string}
   */
  function markText(text, query) {
    let replacement = text;
    if (query) {
      const partials = query
        .split(/[.,\s]/)
        .filter((partial) => partial.trim());
      partials.forEach((partial) => {
        replacement = replacement.replaceAll(
          new RegExp(`(^|[^>])(${partial})`, 'ig'),
          '<span>$1<span class="text-primary">$2</span></span>',
        );
      });
    }
    return replacement;
  }

  /**
   * @description ResultItem with optional icon or image, title and optional actions
   * @vue-prop {string} query - The query string to mark results
   * @vue-prop {ResultItem} resultItem
   * @vue-computed {boolean} hasActions - Whether result item has actions or not
   * @vue-computed {string} marked - The result item's title with highlighted query string
   */
  export default {
    name: 'ResultItem',
    components: {
      VcsActionButtonList,
      VIcon,
      VListItem,
      VListItemTitle,
      VTooltip,
    },
    props: {
      query: {
        type: String,
        default: '',
      },
      item: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      const hasActions = computed(() => props.item?.actions?.length > 0);
      const marked = computed(() => markText(props.item.title, props.query));

      return {
        hasActions,
        marked,
      };
    },
  };
</script>

<style lang="scss" scoped></style>
