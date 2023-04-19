<template>
  <vcs-list
    :items="category.items"
    :selectable="category.selectable"
    :single-select="category.singleSelect"
    v-model="selection"
    :title="category.title"
  />
</template>

<script>
  import { computed, inject, watch } from 'vue';
  import VcsList from '../../components/lists/VcsList.vue';

  export default {
    name: 'CategoryComponenList',
    components: {
      VcsList,
    },
    props: {
      category: {
        type: Object,
        required: true,
      },
      windowId: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      /** @type {VcsUiApp} */
      const app = inject('vcsApp');

      const selection = computed({
        get() {
          return props.category.selection;
        },
        set(value) {
          // eslint-disable-next-line vue/no-mutating-props
          props.category.selection = value;
        },
      });

      watch(app.categoryManager.componentIds, () => {
        if (!app.categoryManager.get(props.category.id)) {
          app.windowManager.remove(props.windowId);
        }
      });

      return {
        selection,
      };
    },
  };
</script>

<style scoped></style>
