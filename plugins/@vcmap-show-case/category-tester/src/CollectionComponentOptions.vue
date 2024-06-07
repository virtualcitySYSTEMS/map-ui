<template>
  <v-container class="py-0 px-2">
    <v-row no-gutters>
      <v-col>
        <VcsLabel html-for="title">
          {{ $t('categoryTester.title') }}
        </VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField id="title" clearable dense v-model="title" />
      </v-col>
    </v-row>
    <v-row no-gutters v-for="key in keys" :key="key">
      <v-col>
        <VcsLabel :html-for="key">
          {{ $st(`categoryTester.${key}`) }}
        </VcsLabel>
      </v-col>
      <v-col>
        <VcsCheckbox :id="key" dense v-model="getComputed(key).value" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import { computed, inject, isRef } from 'vue';
  import { VContainer, VRow, VCol } from 'vuetify/components';
  import { VcsCheckbox, VcsLabel, VcsTextField } from '@vcmap/ui';

  /**
   * Shows CollectionComponentOptions of a provided collectionComponent
   */
  export default {
    name: 'CollectionComponentOptions',
    components: {
      VcsCheckbox,
      VcsLabel,
      VcsTextField,
      VContainer,
      VRow,
      VCol,
    },
    setup() {
      const collectionComponent = inject('collectionComponent');

      return {
        title: collectionComponent.title,
        keys: [
          'draggable',
          'selectable',
          'singleSelect',
          'renamable',
          'removable',
        ],
        getComputed(key) {
          return computed({
            get() {
              return collectionComponent[key];
            },
            set(value) {
              if (isRef(collectionComponent[key])) {
                collectionComponent[key].value = value;
              } else {
                collectionComponent[key] = value;
              }
            },
          });
        },
      };
    },
  };
</script>

<style lang="scss" scoped></style>
