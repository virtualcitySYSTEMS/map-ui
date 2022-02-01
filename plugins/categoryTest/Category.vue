<template>
  <v-sheet>
    <span class="pa-1 mb-2" @click.stop="open = !open">
      <span class="headline">
        {{ categoryName }}
      </span>
      <span class="float-right">
        <vcs-button icon="$vcsPlus" @click="dialog = true" />
        <vcs-button icon="mdi-download" @click="download" />
        <a :href="downloadLink" target="_blank" ref="link" download="category.json"/>
      </span>
    </span>


    <v-virtual-scroll
      item-height="44px"
      v-if="open"
      :height="6 * 44"
      :items="category"
      :bench="6"
      width="100%"
    >
      <template #default="{item}">
        <v-list-item
          :key="item.name"
          class="mb-1"
        >
          <v-list-item-content>
            <v-list-item-title class="subtitle-1" >{{ item.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ item.type }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-virtual-scroll>
    <v-dialog
      v-model="dialog"
    >
      <v-card>
        <v-form
          @submit.prevent="addItem"
        >
          <v-textarea v-model="jsonString" />
          <v-btn type="submit">Add</v-btn>
        </v-form>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<script>
  import { inject, nextTick, ref } from '@vue/composition-api';
  import { VcsButton } from '@vcsuite/ui-components';
  import { getObjectFromOptions } from '../../src/vcsAppContextHelpers.js';

  export default {
    name: 'CategoryComponent',
    components: { VcsButton },
    props: {
      categoryName: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp');
      const categoryObject = app.categories.getByKey(props.categoryName);
      const dialog = ref(false);
      const jsonString = ref('{\n}');
      const category = ref([]);
      const downloadLink = ref('');
      const open = ref(true);
      if (categoryObject) {
        category.value = [...categoryObject.collection].map(c => ({ name: c.name, type: c.className || 'Object' }));
      }

      return {
        dialog,
        category,
        jsonString,
        downloadLink,
        open,
        async addItem() {
          try {
            const config = JSON.parse(jsonString.value);
            // eslint-disable-next-line no-underscore-dangle
            if (categoryObject._typed) {
              categoryObject.collection.add(await getObjectFromOptions(config));
            } else {
              categoryObject.collection.add(config);
            }
            category.value = [...categoryObject.collection].map(c => ({ name: c.name, type: c.className || 'Object' }));
            jsonString.value = '{\n}';
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('invalid JSON');
          }
          dialog.value = false;
        },
        download() {
          const stringObject = JSON.stringify(categoryObject.serializeForContext(app.dynamicContextId), null, 2);
          downloadLink.value = `data:text/json;charset=utf-8,${encodeURIComponent(stringObject)}`;
          if (downloadLink.value) {
            nextTick(() => {
              this.$refs.link.click();
            });
          }
        },
      };
    },
  };
</script>

<style scoped>

</style>
