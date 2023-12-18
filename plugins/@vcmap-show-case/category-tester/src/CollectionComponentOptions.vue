<template>
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
</template>

<script>
  import { inject } from 'vue';
  import { VContainer, VRow, VCol } from 'vuetify/lib';
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
      /**
       * @type {CollectionComponentClass}
       */
      const collectionComponent = inject('collectionComponent');

      return {
        title: collectionComponent.title,
        draggable: collectionComponent.draggable,
        selectable: collectionComponent.selectable,
        singleSelect: collectionComponent.singleSelect,
      };
    },
  };
</script>

<style lang="scss" scoped></style>
