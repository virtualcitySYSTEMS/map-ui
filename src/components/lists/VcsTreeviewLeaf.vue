<template>
  <div
    class="d-flex flex-row align-center"
    v-if="item"
  >
    <div
      class="position-relative col-8 pa-0 d-flex align-center vcs-treeview-leaf"
      :title="$t(item.tooltip || item.title)"
    >
      <span
        v-if="item.icon"
      >
        <v-icon
          v-if="isStringIcon"
          v-text="item.icon"
          :size="16"
          class="mr-1"
        />
        <ImageElementInjector :element="item.icon" v-else />
      </span>
      <span class="vcs-treeview-item-title">{{ $t(item.title) }}</span>
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
<style lang="css" scoped>
.vcs-treeview-leaf .vcs-treeview-item-title{
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<script>
  import { computed } from 'vue';
  import { VIcon } from 'vuetify/lib';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import ImageElementInjector from '../imageElementInjector.vue';

  /**
   * @description
   * Template for a treeview leaf, see: https://vuetifyjs.com/en/api/v-treeview/
   * @vue-prop {TreeViewItem} item - A ContentTreeItem
   * @vue-computed {boolean} leaf - Whether the item is a leaf item or not
   */
  export default {
    components: {
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
