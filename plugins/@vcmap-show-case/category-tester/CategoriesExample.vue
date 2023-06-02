<template>
  <div>
    <v-container class="pa-0">
      <v-expansion-panels
        accordion
        multiple
        v-if="componentIds.length > 0"
        class="rounded-0"
      >
        <collection-component-provider
          v-for="componentId in componentIds"
          :component-id="componentId"
          :key="componentId"
        >
          <collection-component-options />
        </collection-component-provider>
      </v-expansion-panels>
    </v-container>
    <div class="d-flex gap-2 px-2 pt-2 pb-1">
      <div class="d-flex gap-2 w-full justify-end">
        <VcsFormButton @click="newDialog = true" variant="filled"
          >Request Category</VcsFormButton
        >
        <VcsFormButton @click="requestFoobar">Request Foobar</VcsFormButton>
        <VcsFormButton @click="clear">Clear</VcsFormButton>
      </div>
    </div>
    <v-dialog v-model="newDialog" width="200">
      <v-card class="pa-2">
        <v-form @submit.prevent="requestCategory">
          <VcsTextField
            v-model="categoryName"
            :rules="[(value) => value !== '' || 'Please provide a name!']"
          />
          <VcsFormButton type="submit"> Request </VcsFormButton>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
  import { inject, provide, ref } from 'vue';
  import {
    VcsFormButton,
    VcsTextField,
    CollectionComponentProvider,
  } from '@vcmap/ui';
  import {
    VContainer,
    VExpansionPanels,
    VCard,
    VForm,
    VDialog,
  } from 'vuetify/lib';
  import { name as owner } from './package.json';
  import CollectionComponentOptions from './CollectionComponentOptions.vue';

  const foobarMappingFunction = (item, c, listItem) => {
    listItem.title = item.name;
    listItem.actions = [{ name: 'foobar', callback: () => {} }];
  };

  export default {
    name: 'CategoriesExample',
    components: {
      CollectionComponentProvider,
      CollectionComponentOptions,
      VcsFormButton,
      VcsTextField,
      VContainer,
      VExpansionPanels,
      VCard,
      VForm,
      VDialog,
    },
    setup() {
      const app = inject('vcsApp');
      provide('collectionManager', app.categoryManager);
      const componentIds = ref(app.categoryManager.componentIds);
      const newDialog = ref(false);
      const categoryName = ref('');

      function requestCategory() {
        app.categoryManager.requestCategory(
          { name: categoryName.value },
          owner,
        );
        newDialog.value = false;
      }

      function clear() {
        app.categoryManager.clear();
      }

      async function requestFoobar() {
        const { collectionComponent, category } =
          await app.categoryManager.requestCategory(
            {
              name: 'foobar',
              title: 'Foobar',
            },
            owner,
            {
              actions: [{ name: 'foobar', callback: () => {} }],
              draggable: true,
            },
          );

        app.categoryManager.addMappingFunction(
          () => true,
          foobarMappingFunction,
          owner,
          [collectionComponent.id],
        );
        for (let i = 0; i <= 12; i++) {
          category.collection.add({
            name: `foobar-${i}`,
          });
        }
      }

      return {
        componentIds,
        categoryName,
        newDialog,
        requestCategory,
        requestFoobar,
        clear,
      };
    },
  };
</script>

<style scoped></style>
