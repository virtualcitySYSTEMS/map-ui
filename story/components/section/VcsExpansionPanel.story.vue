<script setup>
  import { VExpansionPanels } from 'vuetify/components';
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import { createActions } from '../../storyHelper.js';
  import VcsExpansionPanel from '../../../src/components/section/VcsExpansionPanel.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState();
  const heading = ref('Heading');
  const disabled = ref(false);
  const overflowCount = ref(undefined);
  const actions = createActions();
</script>

<template>
  <Story title="VcsExpansionPanel" :meta="{ wrapper: { ...state.wrapper } }">
    <v-expansion-panels>
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
