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
  import { inject, ref, onUnmounted } from '@vue/composition-api';
  import { VcsButton } from '@vcsuite/ui-components';
  import Category from './Category.vue';

  export default {
    name: 'CategoriesComponent',
    components: {
      Category,
      VcsButton,
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
        async add() {
          const { value: newCategoryValue } = newCategory;
          if (newCategoryValue.type === 'AppBackedCategory') {
            newCategoryValue.name = newCategoryValue.collectionName;
          }
          await app.categories.requestCategory(newCategoryValue);
          newCategory.value = {
            name: 'new',
            type: 'category.Category',
            collectionName: null,
          };
          newDialog.value = false;
        },
        async upload() {
          try {
            const jsonUpload = JSON.parse(uploadString.value);
            if (!jsonUpload.name) {
              console.error('must provide name');
              return;
            }
            await app.categories.requestCategory({ name: jsonUpload.name, type: 'Category' });
            if (jsonUpload?.items?.length > 0) {
              await app.categories.parseCategoryItems(jsonUpload.name, jsonUpload.items, app.dynamicContextId);
            }
            uploadString.value = '';
            uploadDialog.value = false;
          } catch (e) {
            console.error('not a valid JSON');
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
