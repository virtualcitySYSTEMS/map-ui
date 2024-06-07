<script setup>
  import { VContainer, VRow, VCol } from 'vuetify/components';
  import { getStoryState } from '../../setup.js';
  import VcsFormSection from '../../../src/components/form-inputs-controls/VcsFormSection.vue';
  import VcsLabel from '../../../src/components/form-inputs-controls/VcsLabel.vue';
  import VcsTextField from '../../../src/components/form-inputs-controls/VcsTextField.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState();
</script>

<template>
  <Story title="VcsFormSection" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsFormSection>
      <v-container class="py-0 px-1">
        <v-row>
          <v-col>
            <VcsLabel html-for="textInput"> Text </VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField id="textInput" placeholder="some input" />
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>
    <template #controls>
      <GlobalControls v-model="state"></GlobalControls>
    </template>
  </Story>
</template>
