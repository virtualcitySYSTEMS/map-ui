<template>
  <div>
    <div
      class="overflow-auto"
    >
      <Category
        v-for="category in categories"
        :key="category"
        :category-name="category"
      />
    </div>
    <hr>
    <span>
      <VcsButton icon="$vcsPlus" @click="newDialog = true" />
      <VcsButton icon="$vcsExport" @click="uploadDialog = true" />
      <VcsButton @click="addManagedCategories">Add Categories To Manager</VcsButton>
      <VcsButton @click="addFoobar">Add Foobar</VcsButton>
    </span>
    <v-dialog
      v-model="newDialog"
    >
      <v-card
        class="pa-2"
      >
        <v-form
          @submit.prevent="add"
        >
          <v-select v-model="newCategory.type" :items="['Category', 'AppBackedCategory']" />
          <v-select
            v-model="newCategory.collectionName"
            v-if="newCategory.type === 'category.AppBackedCategory'"
            :items="appBackedCollectionNames"
            placeholder="Collection Name"
          />
          <v-text-field v-model="newCategory.name" v-else />
          <v-btn type="submit">
            Add
          </v-btn>
        </v-form>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="uploadDialog"
    >
      <v-card>
        <v-form
          @submit.prevent="upload"
        >
          <v-textarea v-model="uploadString" />
          <v-btn type="submit">
            Upload
          </v-btn>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
  import { inject, ref, onUnmounted } from 'vue';
  import { VcsButton } from '@vcmap/ui';
  import { GeoJSONLayer } from '@vcmap/core';
  import {
    VDialog,
    VCard,
    VForm,
    VSelect,
    VTextField,
    VBtn,
    VTextarea,
  } from 'vuetify/lib';
  import packageJSON from './package.json';
  import Category from './Category.vue';

  export default {
    name: 'CategoriesComponent',
    components: {
      Category,
      VcsButton,
      VDialog,
      VCard,
      VForm,
      VSelect,
      VTextField,
      VBtn,
      VTextarea,
    },
    setup() {
      const app = inject('vcsApp');
      const categories = ref([...app.categories].map(c => c.name));
      const newDialog = ref(false);
      const uploadDialog = ref(false);
      const uploadString = ref('');
      const newCategory = ref({
        name: 'new',
        type: 'Category',
        collectionName: null,
      });
      const listeners = [
        app.categories.added.addEventListener(() => {
          categories.value = [...app.categories].map(c => c.name);
        }),
        app.categories.removed.addEventListener(() => {
          categories.value = [...app.categories].map(c => c.name);
        }),
      ];

      onUnmounted(() => {
        listeners.forEach((cb) => { cb(); });
      });

      return {
        categories,
        newDialog,
        newCategory,
        uploadDialog,
        uploadString,
        appBackedCollectionNames: [
          'layers',
          'maps',
          'plugins',
          'viewpoints',
          'styles',
        ],
        async addFoobar() {
          if (!app.categories.hasKey('foobar')) {
            const category = await app.categories.requestCategory({
              name: 'foobar',
              type: 'Category',
              title: 'Foobar',
            });
            app.categoryManager.add({ categoryName: category.name }, packageJSON.name);
            app.categoryManager.addMappingFunction(() => true, (item, c, listItem) => {
              listItem.title = item.name;
            }, [category.name], packageJSON.name);
            for (let i = 0; i <= 12; i++) {
              category.collection.add({
                name: `foobar-${i}`,
              });
            }
          }
        },
        async add() {
          const { value: newCategoryValue } = newCategory;
          if (newCategoryValue.type === 'AppBackedCategory') {
            newCategoryValue.name = newCategoryValue.collectionName;
          }
          const category = await app.categories.requestCategory(newCategoryValue);
          newCategory.value = {
            name: 'new',
            type: 'Category',
            collectionName: null,
          };
          app.categoryManager.add({ categoryName: category.name }, packageJSON.name);
          newDialog.value = false;
        },
        async upload() {
          try {
            const jsonUpload = JSON.parse(uploadString.value);
            if (!jsonUpload.name) {
              console.error('must provide name');
              return;
            }
            const category = await app.categories.requestCategory({ name: jsonUpload.name, type: 'Category' });
            if (jsonUpload?.items?.length > 0) {
              await app.categories.parseCategoryItems(jsonUpload.name, jsonUpload.items, app.dynamicContextId);
            }
            app.categoryManager.add({ categoryName: category.name }, packageJSON.name);
            uploadString.value = '';
            uploadDialog.value = false;
          } catch (e) {
            console.error('not a valid JSON');
          }
        },
        async addManagedCategories() {
          if (!app.categories.hasKey('layers')) {
            const layersCat = await app.categories.requestCategory({
              name: 'layers',
              type: 'AppBackedCategory',
              collectionName: 'layers',
              title: 'categories.layers',
            });
            const actions = [{
              name: 'mySuperAction',
              icon: 'mdi-plus',
              callback: () => {
                layersCat.collection.add(new GeoJSONLayer({
                  features: [
                    {
                      type: 'Feature',
                      properties: {},
                      geometry: {
                        type: 'Polygon',
                        coordinates: [
                          [
                            [
                              13.376044753386196,
                              52.51700747314845,
                              34.434221826595746,
                            ],
                            [
                              13.375890137534464,
                              52.51683412207231,
                              34.43535288837092,
                            ],
                            [
                              13.376141126603242,
                              52.51641627693124,
                              34.66410424636929,
                            ],
                            [
                              13.376773170085109,
                              52.516279904694215,
                              34.73478984011562,
                            ],
                            [
                              13.376887028670879,
                              52.51695485856382,
                              34.72412287410914,
                            ],
                            [
                              13.376044753386196,
                              52.51700747314845,
                              34.434221826595746,
                            ],
                          ],
                        ],
                      },
                    }],
                }));
              },
            }];
            app.categoryManager.add({ categoryName: layersCat.name, actions }, packageJSON.name);
            app.categoryManager.addMappingFunction(() => true, (item, category, treeViewItem) => {
              // eslint-disable-next-line no-console
              const action = {
                name: 'mySuperAction',
                icon: '$vcsSimpleCircleFilled',
                callback: () => {
                  console.log(item, category, treeViewItem);
                },
              };
              treeViewItem.actions.push(action);
              const action2 = {
                name: 'mySuperAction3',
                icon: 'mdi-minus',
                callback: () => {
                  category.collection.remove(item);
                },
              };
              treeViewItem.actions.push(action2);
            }, ['layers'], packageJSON.name);
          }
        },
      };
    },
  };
</script>

<style scoped>
.max-height {
  max-height: 50%;
}
</style>
