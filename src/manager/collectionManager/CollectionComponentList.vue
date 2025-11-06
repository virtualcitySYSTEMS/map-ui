<template>
  <div class="collection-component-list">
    <div v-if="!hideHeader" class="pr-2 pl-4 py-1">
      <div class="d-flex justify-space-between inner-header">
        <div class="d-flex align-center gc-1">
          <span>
            {{ $st(title) }}
          </span>
          <span v-if="selectable && selection.length > 0">
            {{ `(${selection.length})` }}
          </span>
        </div>
        <VcsActionButtonList
          v-if="actions?.length > 0"
          :actions="actions"
          :overflow-count="overflowCount"
        />
      </div>
    </div>
    <vcs-list
      :items="items"
      :draggable="draggable"
      :selectable="selectable"
      :single-select="singleSelect"
      v-model="selection"
      :show-title="false"
      @item-moved="move"
    />
    <v-sheet v-if="showLessButton" class="ma-2 pl-2">
      <VcsButton @click="closeList">
        {{ $t('collectionManager.less') }}
      </VcsButton>
    </v-sheet>
  </div>
</template>

<script>
  import { computed, inject } from 'vue';
  import { VSheet } from 'vuetify/components';
  import { createSelectionActions } from '../../components/lists/listHelper.js';
  import VcsList from '../../components/lists/VcsList.vue';
  import VcsActionButtonList from '../../components/buttons/VcsActionButtonList.vue';
  import VcsButton from '../../components/buttons/VcsButton.vue';
  import { moveItem } from '../../components/lists/dragHelper.js';

  /**
   * @description
   * Renders the items of a CollectionComponentClass in a List.
   * The collectionComponent must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   * @vue-prop {boolean} showLessButton - Show a `show less button` at the end of the list, which will emit a closeList event
   * @vue-prop {boolean} hideHeader - Whether to hide the header or not
   */
  export default {
    name: 'CollectionComponentList',
    components: {
      VcsButton,
      VcsActionButtonList,
      VcsList,
      VSheet,
    },
    props: {
      showLessButton: {
        type: Boolean,
        default: true,
      },
      hideHeader: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['closeList'],
    setup(_props, { emit }) {
      /**
       * @type {import("./collectionComponentClass.js").CollectionComponentClass}
       */
      const collectionComponent = inject('collectionComponent');

      const selectionActions = createSelectionActions(
        collectionComponent.items,
        collectionComponent.selection,
        emit,
      );

      const actions = collectionComponent.getActions();

      return {
        title: collectionComponent.title,
        items: collectionComponent.items,
        selection: collectionComponent.selection,
        draggable: collectionComponent.draggable,
        selectable: collectionComponent.selectable,
        singleSelect: collectionComponent.singleSelect,
        overflowCount: collectionComponent.overflowCount,
        limit: collectionComponent.limit,
        actions: computed(() => {
          if (
            collectionComponent.selectable.value &&
            !collectionComponent.singleSelect.value
          ) {
            return [...selectionActions, ...actions.value];
          }
          return actions.value;
        }),
        move(event) {
          moveItem(collectionComponent.collection, event);
        },
        closeList() {
          emit('closeList', collectionComponent.id);
        },
      };
    },
  };
</script>

<style lang="scss" scoped>
  .inner-header {
    height: calc(var(--v-vcs-font-size) * 2 - 2px);
  }
</style>
