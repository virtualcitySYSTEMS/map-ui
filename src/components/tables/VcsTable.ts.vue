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
          :tag="getTag(tags!, item.key)"
          :tag-options="getTagOptions(tags!, item.key)"
        >
        </vcs-table-cell>
      </tr>
    </template>
  </VcsDataTable>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { computed, defineComponent } from 'vue';
  import VcsTableCell from './VcsTableCell.ts.vue';
  import VcsDataTable from './VcsDataTable.ts.vue';
  import type { HTMLTagOptions } from '../../featureInfo/abstractFeatureInfoView.js';

  type TableItem = {
    key: string;
    value: string;
    group?: string;
  };

  export function attributesToItems(
    attributes: Record<string, unknown>,
    items: TableItem[] = [],
    parent?: string,
  ): TableItem[] {
    const nestedKey = (key: string, nested: string | undefined): string =>
      nested ? `${nested}.${key}` : key;
    Object.entries(attributes).forEach(([key, value]) => {
      if (value instanceof Object) {
        attributesToItems(
          value as Record<string, unknown>,
          items,
          nestedKey(key, parent),
        );
      } else {
        const item = {
          key: nestedKey(key, parent),
          value: String(value),
          group: parent,
        };
        items.push(item);
      }
    });
    return items;
  }

  /**
   * Defines which HTML tags can be used within the VcsTable value column and provides default options
   */
  export const defaultTagOptions: Record<string, Record<string, unknown>> = {
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

  export function getTag(
    tags: HTMLTagOptions,
    key: keyof HTMLTagOptions,
  ): string {
    // @ts-expect-error access tag property
    return tags?.[key]?.tag ?? 'div';
  }

  export function getTagOptions(
    tags: HTMLTagOptions,
    key: keyof HTMLTagOptions,
  ): Record<string, unknown> {
    if (tags?.[key]) {
      // @ts-expect-error access tag property
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
  export default defineComponent({
    name: 'VcsTable',
    components: { VcsTableCell, VcsDataTable },
    props: {
      attributes: {
        type: Object as PropType<Record<string, unknown>>,
        required: true,
      },
      tags: {
        type: Object as PropType<HTMLTagOptions>,
        default: undefined,
      },
      keyHeader: {
        type: Object as PropType<{
          title: string;
          key: 'key';
          width: string | undefined;
        }>,
        default: () => ({
          title: 'components.vcsTable.key',
          key: 'key',
          width: '128px',
        }),
        validator: (value: {
          title: string;
          key: 'key';
          width: string | undefined;
        }) => value.key === 'key',
      },
      valueHeader: {
        type: Object as PropType<{
          title: string;
          key: 'value';
          width: string | undefined;
        }>,
        default: () => ({
          title: 'components.vcsTable.value',
          key: 'value',
          width: '192px',
        }),
        validator: (value: {
          title: string;
          key: 'value';
          width: string | undefined;
        }) => value.key === 'value',
      },
    },
    setup(props) {
      const items = computed<Array<TableItem>>(() =>
        attributesToItems(props.attributes),
      );

      return {
        items,
        getTag,
        getTagOptions,
      };
    },
  });
</script>

<style lang="scss" scoped>
  :deep(.v-data-table__mobile-row__cell) {
    td.vcs-table.overflow-max-width {
      max-width: 100% !important;
    }
  }
</style>
