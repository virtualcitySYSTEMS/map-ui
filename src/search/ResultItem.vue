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
  import { VIcon, VListItem, VListItemTitle } from 'vuetify/components';
  import DOMPurify from 'dompurify';
  import VcsActionButtonList from '../components/buttons/VcsActionButtonList.vue';
  import { markText } from './markText.js';

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
      const marked = computed(() =>
        DOMPurify.sanitize(markText(props.item.title, props.query)),
      );

      return {
        hasActions,
        marked,
      };
    },
  };
</script>

<style lang="scss" scoped></style>
