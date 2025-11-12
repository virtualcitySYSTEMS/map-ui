<script setup>
  import { VExpansionPanels, VContainer, VRow, VCol } from 'vuetify/components';
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import { createActions } from '../../storyHelper.js';
  import VcsExpansionPanel from '../../../src/components/section/VcsExpansionPanel.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsLabel from '../../../src/components/form-inputs-controls/VcsLabel.vue';
  import VcsTextField from '../../../src/components/form-inputs-controls/VcsFileInput.vue';

  const state = getStoryState();
  const heading = ref('Heading');
  const disabled = ref(false);
  const overflowCount = ref(undefined);
  const actions = createActions();
  const text = ref('');
</script>

<template>
  <Story title="VcsExpansionPanel" :meta="{ wrapper: { ...state.wrapper } }">
    <v-expansion-panels variant="accordion" multiple>
      <VcsExpansionPanel
        :heading="heading"
        :header-actions="actions"
        :action-button-list-overflow-count="overflowCount"
        :disabled="disabled"
        v-bind="{ ...state.bind }"
      >
        <p class="px-2">
          Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
          nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
          sed diam voluptua. At vero eos et accusam et justo duo dolores et ea
          rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem
          ipsum dolor sit amet.
        </p>
      </VcsExpansionPanel>
      <vcs-expansion-panel heading="With container">
        <v-container>
          <v-row no-gutters>
            <v-col cols="4">
              <vcs-label>Label</vcs-label>
            </v-col>
            <v-col>
              <vcs-text-field v-model="text" />
            </v-col>
          </v-row>
        </v-container>
      </vcs-expansion-panel>
    </v-expansion-panels>

    <template #controls>
      <GlobalControls v-model="state">
        <HstText v-model="heading">heading</HstText>
        <HstCheckbox v-model="disabled">disabled</HstCheckbox>
        <HstNumber v-model="overflowCount"
          >actionButtonListOverflowCount</HstNumber
        >
      </GlobalControls>
    </template>
  </Story>
</template>
