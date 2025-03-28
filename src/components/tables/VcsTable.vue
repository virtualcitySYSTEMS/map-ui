<template>
  <VcsDataTable
    class="vcs-table"
    v-bind="$attrs"
    :items="items"
    :headers="[keyHeader, valueHeader]"
  >
    <template #item="{ index, item }">
      <tr class="v-data-table__tr" :key="`row-${index}`">
        <vcs-table-cell :title="item.key" :width="keyHeader.width" />
        <vcs-table-cell
          :title="item.value"
          :width="valueHeader.width"
          :tag="getTag(tags, item.key)"
          :tag-options="getTagOptions(tags, item.key)"
        >
        </vcs-table-cell>
      </tr>
    </template>
  </VcsDataTable>
</template>
<script>
  import { computed } from 'vue';
  import VcsTableCell from './VcsTableCell.vue';
  import VcsDataTable from './VcsDataTable.vue';

  /**
   * @typedef {Object} TableItem
   * @property {string} key
   * @property {string} value
   */

  /**
   * @param {Object} attributes
   * @param {Array<TableItem>} [items]
   * @param {string} [parent]
   * @returns {Array<TableItem>}
   */
  export function attributesToItems(
    attributes,
    items = [],
    parent = undefined,
  ) {
    const nestedKey = (key, nested) => (nested ? `${nested}.${key}` : key);
    Object.entries(attributes).forEach(([key, value]) => {
      if (value instanceof Object) {
        attributesToItems(value, items, nestedKey(key, parent));
      } else {
        const item = { key: nestedKey(key, parent), value };
        if (parent) {
          item.group = parent;
        }
        items.push(item);
      }
    });
    return items;
  }

  /**
   * Defines which HTML tags can be used within the VcsTable value column and provides default options
   * @type {Object<string,Object<string,*>>}
   */
  export const defaultTagOptions = {
    a: {
      href: undefined,
      target: '_blank',
    },
    audio: {
      controls: '',
      src: undefined,
    },
    b: {},
    i: {},
    iframe: {
      src: undefined,
      width: undefined,
      height: undefined,
    },
    img: {
      src: undefined,
      width: undefined,
    },
    meter: {
      value: undefined,
    },
    progress: {
      value: undefined,
    },
    s: {},
    strong: {},
    video: {
      controls: '',
      src: undefined,
      width: 175,
    },
  };

  /**
   * @param {import("../../featureInfo/abstractFeatureInfoView.js").HTMLTagOptions} tags
   * @param {string} key
   * @returns {string}
   */
  export function getTag(tags, key) {
    return tags?.[key]?.tag ?? 'div';
  }

  /**
   * @param {Object} tags
   * @param {string} key
   * @returns {import("../../featureInfo/abstractFeatureInfoView.js").HTMLTagOptions|Record<never, never>}
   */
  export function getTagOptions(tags, key) {
    if (tags?.[key]) {
      return { ...defaultTagOptions[tags[key].tag], ...tags[key] };
    }
    return {};
  }

  /**
   * @description A table view for feature attributes using VcsDataTable
   * @vue-prop {Object} attributes - feature's attributes
   * @vue-prop {Object} tags - Allows to render the value column for specific attribute keys with special html elements. See 'defaultTagOptions' for supported html tags.
   * @vue-prop {{title: string, key: 'key', width: string|undefined}} [keyHeader] - optional header defining the key column
   * @vue-prop {{title: string, key: 'value', width: string|undefined}} [valueHeader] - optional header defining the value column
   * @vue-computed {Array<TableItem>} items - from attributes derived table items
   */
  export default {
    name: 'VcsTable',
    components: {
      VcsTableCell,
      VcsDataTable,
    },
    props: {
      attributes: {
        type: Object,
        required: true,
      },
      tags: {
        type: Object,
        default: undefined,
      },
      keyHeader: {
        type: Object,
        default: () => ({
          title: 'components.vcsTable.key',
          key: 'key',
          width: '128px',
        }),
        validator: (value) => value.key === 'key',
      },
      valueHeader: {
        type: Object,
        default: () => ({
          title: 'components.vcsTable.value',
          key: 'value',
          width: '192px',
        }),
        validator: (value) => value.key === 'value',
      },
    },
    setup(props) {
      /**
       * @type {ComputedRef<Array<TableItem>>}
       */
      const items = computed(() => {
        return attributesToItems(props.attributes);
      });

      return {
        items,
        getTag,
        getTagOptions,
      };
    },
  };
</script>

<style lang="scss" scoped>
  :deep(.v-data-table__mobile-row__cell) {
    td.vcs-table.overflow-max-width {
      max-width: 100% !important;
    }
  }
  :deep(.v-table__wrapper) {
  }
</style>
