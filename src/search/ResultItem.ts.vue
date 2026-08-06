<template>
  <v-list-item v-if="item" v-bind="$attrs" class="result-item">
    <template #prepend v-if="item.icon">
      <v-icon>
        {{ item.icon }}
      </v-icon>
    </template>
    <template #title>
      <!-- eslint-disable vue/no-v-html -->
      <v-list-item-title>
        <span v-html="marked" />
      </v-list-item-title>
    </template>
    <template #append>
      <VcsActionButtonList
        v-if="actions.length > 0"
        :actions="actions"
        :overflow-count="2"
        right
      />
    </template>
  </v-list-item>
</template>

<script lang="ts">
  import { computed, defineComponent } from 'vue';
  import type { PropType } from 'vue';
  import { VIcon, VListItem, VListItemTitle } from 'vuetify/components';
  import DOMPurify from 'dompurify';
  import type { ResultItem } from './search.js';
  import VcsActionButtonList from '../components/buttons/VcsActionButtonList.ts.vue';
  import { markText } from './markText.js';

  /**
   * @description ResultItem with optional icon or image, title and optional actions
   * @vue-prop {string} query - The query string to mark results
   * @vue-prop {ResultItem} resultItem
   * @vue-computed {boolean} hasActions - Whether result item has actions or not
   * @vue-computed {string} marked - The result item's title with highlighted query string
   */
  export default defineComponent({
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
        type: Object as PropType<ResultItem>,
        required: true,
      },
    },
    setup(props) {
      const actions = computed(() => {
        if (props.item.actions && props.item.actions.length > 0) {
          return props.item.actions;
        }
        return [];
      });
      const marked = computed(() =>
        DOMPurify.sanitize(markText(props.item.title, props.query)),
      );

      return {
        actions,
        marked,
      };
    },
  });
</script>

<style lang="scss" scoped></style>
