<template>
  <div class="d-flex flex-row align-center" v-if="item">
    <div class="position-relative col-8 pa-0 d-flex align-center">
      <span v-if="item.icon" class="d-inline-flex">
        <v-icon v-if="isStringIcon" :size="16" class="mr-1">
          {{ item.icon }}
        </v-icon>
        <ImageElementInjector :element="item.icon" v-else />
      </span>
      <VcsTooltip :tooltip="item.tooltip || item.title">
        <template #activator="{ on, attrs }">
          <span v-bind="attrs" v-on="on" class="d-inline-block text-truncate">{{
            $t(item.title)
          }}</span>
        </template>
      </VcsTooltip>
    </div>

    <VcsActionButtonList
      v-if="item.actions.length > 0"
      :actions="item.actions"
      :block-overflow="true"
      :overflow-count="3"
      small
      right
      class="col-4 pa-0 d-flex align-center"
    />
  </div>
</template>

<script>
  import { computed } from 'vue';
  import { VIcon } from 'vuetify/lib';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import ImageElementInjector from '../imageElementInjector.vue';
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

      return {
        isStringIcon: computed(() => typeof props.item.icon === 'string'),
        leaf,
      };
    },
  };
</script>
