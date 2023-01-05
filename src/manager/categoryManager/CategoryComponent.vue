<template>
  <v-container>
    <v-row @click="open = !open" class="px-2 py-1 cursor-pointer">
      <span>
        <v-icon v-if="open">mdi-chevron-up</v-icon>
        <v-icon v-else>mdi-chevron-down</v-icon>
      </span>
      <span class="flex-grow-1 flex-shrink-1">{{ $t(category.title) }}</span>
      <vcs-action-button-list
        v-if="category.actions?.length > 0"
        :actions="category.actions"
        small
      />
    </v-row>
    <template v-if="open">
      <v-row>
        <v-col class="pa-0">
          <vcs-list
            :items="category.items.slice(0, 10)"
            :selectable="category.selectable"
            :single-select="category.singleSelect"
            v-model="selection"
            :show-title="false"
          />
        </v-col>
      </v-row>
      <v-row v-if="category.items.length > 10">
        <v-col class="pa-0">
          <VcsButton @click="openCategoryItemWindow" class="pa-2" small>
            {{ $t('categoryManager.more') }}
          </VcsButton>
        </v-col>
      </v-row>
      <v-row v-else-if="category.items.length === 0">
        <v-col class="pa-2">
          {{ $t('categoryManager.empty') }}
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
  import { computed, inject, ref } from 'vue';
  import { VIcon, VContainer, VRow, VCol } from 'vuetify/lib';
  import VcsList from '../../components/lists/VcsList.vue';
  import VcsActionButtonList from '../../components/buttons/VcsActionButtonList.vue';
  import VcsButton from '../../components/buttons/VcsButton.vue';
  import { vcsAppSymbol } from '../../pluginHelper.js';
  import CategoryComponentList from './CategoryComponentList.vue';
  import { WindowSlot } from '../window/windowManager.js';

  export default {
    name: 'CategoryComponent',
    components: {
      VcsActionButtonList,
      VcsList,
      VContainer,
      VRow,
      VcsButton,
      VCol,
      VIcon,
    },
    props: {
      /** @type {ManagedCategory} */
      category: {
        type: Object,
        required: true,
      },
    },
    setup({ category }) {
      /** @type {VcsUiApp} */
      const app = inject('vcsApp');
      const windowId = `${category.id}-category-list`;
      const open = ref(false);

      const selection = computed({
        get() { return category.selection; },
        set(value) {
          // eslint-disable-next-line vue/no-mutating-props
          category.selection = value;
        },
      });

      return {
        selection,
        open,
        openCategoryItemWindow() {
          if (app.windowManager.has(windowId)) {
            setTimeout(() => {
              app.windowManager.bringWindowToTop(windowId);
            }, 0);
          } else {
            app.windowManager.add({
              id: windowId,
              component: CategoryComponentList,
              props: {
                category,
                windowId,
              },
              provides: {
                selection,
              },
              slot: WindowSlot.DYNAMIC_LEFT,
            }, vcsAppSymbol);
          }
        },
      };
    },
  };
</script>

<style scoped>

</style>
