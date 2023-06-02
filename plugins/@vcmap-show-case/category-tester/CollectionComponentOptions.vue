<template>
  <div>
    <v-expansion-panel @change="active = !active">
      <v-expansion-panel-header hide-actions class="px-2">
        <template #default="{ open }">
          <div class="d-flex justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-1" :class="{ rotate: !open }">
                mdi-chevron-down
              </v-icon>
              {{ $t(title) }}
            </div>
            <VcsActionButtonList
              v-if="actions?.length > 0"
              :actions="actions"
            />
          </div>
        </template>
      </v-expansion-panel-header>
      <v-expansion-panel-content class="pb-1">
        <v-container class="py-0 px-2">
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="title" dense>
                {{ $t('categoryTester.title') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField id="title" clearable dense v-model="title" />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="draggable" dense>
                {{ $t('categoryTester.draggable') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsCheckbox id="draggable" dense v-model="draggable" />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="selectable" dense>
                {{ $t('categoryTester.selectable') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsCheckbox id="selectable" dense v-model="selectable" />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="singleSelect" dense>
                {{ $t('categoryTester.singleSelect') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsCheckbox id="singleSelect" dense v-model="singleSelect" />
            </v-col>
          </v-row>
        </v-container>
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-dialog v-model="dialog" width="300">
      <v-card class="pa-2">
        <v-form @submit.prevent="addItem">
          <vcs-text-area v-model="jsonString" />
          <vcs-form-button type="submit"> Add </vcs-form-button>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
  import { inject, ref } from 'vue';
  import {
    VExpansionPanel,
    VExpansionPanelHeader,
    VExpansionPanelContent,
    VIcon,
    VContainer,
    VRow,
    VCol,
    VDialog,
    VCard,
    VForm,
  } from 'vuetify/lib';
  import {
    VcsCheckbox,
    VcsLabel,
    VcsTextField,
    VcsTextArea,
    VcsActionButtonList,
    VcsFormButton,
    downloadText,
  } from '@vcmap/ui';
  import { getObjectFromClassRegistry } from '@vcmap/core';

  /**
   * Shows CollectionComponentOptions of a provided collectionComponent
   */
  export default {
    name: 'CollectionComponent',
    components: {
      VcsFormButton,
      VcsActionButtonList,
      VcsCheckbox,
      VcsLabel,
      VcsTextField,
      VcsTextArea,
      VExpansionPanel,
      VExpansionPanelHeader,
      VExpansionPanelContent,
      VIcon,
      VContainer,
      VRow,
      VCol,
      VDialog,
      VCard,
      VForm,
    },
    setup() {
      const app = inject('vcsApp');
      /**
       * @type {CollectionComponent}
       */
      const collectionComponent = inject('collectionComponent');
      const category = app.categories.getByKey(collectionComponent.id);
      const active = ref(false);
      const dialog = ref(false);
      const jsonString = ref(JSON.stringify({ name: 'newItem' }, null, 2));

      async function addItem() {
        try {
          const config = JSON.parse(jsonString.value);
          if (category.classRegistryName) {
            category.collection.add(
              getObjectFromClassRegistry(
                app[category.classRegistryName],
                config,
              ),
            );
          } else {
            category.collection.add(config);
          }
          jsonString.value = JSON.stringify({ name: 'newItem' }, null, 2);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('invalid JSON');
        }
        dialog.value = false;
      }

      function download() {
        const stringObject = JSON.stringify(
          category.serializeModule(app.dynamicModuleId),
          null,
          2,
        );
        downloadText(stringObject, `${category.name}.json`);
      }

      const actions = [
        {
          name: 'add',
          icon: '$vcsPlus',
          callback() {
            dialog.value = true;
          },
        },
        {
          name: 'download',
          icon: 'mdi-download',
          callback: download,
        },
      ];

      return {
        title: collectionComponent.title,
        draggable: collectionComponent.draggable,
        selectable: collectionComponent.selectable,
        singleSelect: collectionComponent.singleSelect,
        active,
        dialog,
        jsonString,
        actions,
        addItem,
      };
    },
  };
</script>

<style lang="scss" scoped>
  .rotate {
    transform: rotate(-90deg);
  }
  .v-icon {
    font-size: 16px;
  }
  ::v-deep {
    .v-list {
      .v-list-item {
        padding: 4px 8px 4px 28px;
      }
    }
  }
</style>
