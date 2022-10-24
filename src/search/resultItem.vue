<template>
  <div
    class="ma-1 d-flex flex-row align-center"
    v-if="item"
  >
    <v-list-item-icon v-if="item.icon" class="px-1">
      <v-icon>
        {{ item.icon }}
      </v-icon>
    </v-list-item-icon>
    <div
      class="px-2 d-flex align-center"
      :title="$t('search.select')"
    >
      <span v-html="marked" />
    </div>
    <VcsActionButtonList
      v-if="hasActions"
      :actions="item.actions"
      :block-overflow="true"
      :overflow-count="2"
      small
      right
    />
  </div>
</template>

<script>
  import { computed } from 'vue';
  import VcsActionButtonList from '../components/buttons/VcsActionButtonList.vue';

  /**
   * @param {string} text
   * @param {string} query
   * @returns {string}
   */
  function markText(text, query) {
    let replacement = text;
    if (query) {
      const partials = query.split(/[.,\s]/)
        .filter(partial => partial.trim());
      partials.forEach((partial) => {
        replacement = replacement
          .replaceAll(new RegExp(`(^|[^>])(${partial})`, 'ig'), '<span class="primary--text">$2</span>');
      });
    }
    return replacement;
  }

  /**
   * ResultItem with optional icon or image, title and optional actions
   * @vue-prop {string} query - The query string to mark results
   * @vue-prop {ResultItem} resultItem
   * @vue-computed {boolean} hasActions - Whether result item has actions or not
   * @vue-computed {string} marked - The result item's title with highlighted query string
   */
  export default {
    name: 'ResultItem',
    components: { VcsActionButtonList },
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

<style lang="scss" scoped>

</style>
