<template>
  <div class="d-flex flex-row align-center" v-if="item">
    <div class="position-relative col-8 pa-0 d-flex align-center">
      <span v-if="item.icon" class="d-inline-flex">
        <v-icon v-if="isStringIcon" :size="16" class="mr-1">
          {{ item.icon }}
        </v-icon>
        <ImageElementInjector :element="item.icon" v-else />
      </span>
      <VcsTooltip :tooltip="tooltip">
        <template #activator="{ props }">
          <span
            v-bind="props"
            class="d-inline-block text-truncate"
            ref="titleElem"
            >{{ $st(item.title || item.name) }}</span
          >
        </template>
      </VcsTooltip>
    </div>

    <VcsActionButtonList
      v-if="item.actions.length > 0"
      :actions="item.actions"
      :block-overflow="true"
      :overflow-count="3"
      :disabled="item.disabled"
      right
      class="col-4 pa-0 d-flex align-center"
    />
  </div>
</template>

<script>
  import { computed, ref } from 'vue';
  import { VIcon } from 'vuetify/components';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import ImageElementInjector from '../ImageElementInjector.vue';
  import VcsTooltip from '../notification/VcsTooltip.vue';

  /**
   * @description
   * Template for a treeview leaf, see: https://vuetifyjs.com/en/api/v-treeview/
   * @vue-prop {TreeViewItem} item - A ContentTreeItem
   * @vue-computed {boolean} leaf - Whether the item is a leaf item or not
   */
  export default {
    components: {
      VcsTooltip,
      VcsActionButtonList,
      VIcon,
      ImageElementInjector,
    },
    props: {
      item: {
        type: Object,
        default: undefined,
      },
    },
    setup(props) {
      const leaf = computed(() => props.item?.children?.length === 0);
      const titleElem = ref(null);

      return {
        isStringIcon: computed(() => typeof props.item.icon === 'string'),
        leaf,
        titleElem,
        tooltip: computed(() => {
          if (props.item.tooltip) {
            return props.item.tooltip;
          }
          const elem = titleElem.value;
          if (elem && elem.offsetWidth < elem.scrollWidth) {
            return props.item.title;
          }
          return '';
        }),
      };
    },
  };
</script>
