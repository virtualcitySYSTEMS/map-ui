<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsWizard from '../../../src/components/form-inputs-controls/VcsWizard.vue';
  import VcsWizardStep from '../../../src/components/form-inputs-controls/VcsWizardStep.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState();
  const step = ref(0);
  const heading = ref('heading');
  const helpText = ref('This is some help text for this step.');
</script>

<template>
  <Story
    title="VcsWizard"
    :meta="{ wrapper: { ...state.wrapper } }"
    :layout="{ type: 'grid', width: '100%' }"
  >
    <Variant title="Items">
      <VcsWizard
        :items="[
          'Step 1',
          'Step 2',
          {
            title: 'Step 3',
            text: 'Content Step 3',
          },
        ]"
        v-bind="{ ...state.bind }"
      />
      <template #controls>
        <GlobalControls v-model="state"> </GlobalControls>
      </template>
    </Variant>
    <Variant title="VcsWizardStep">
      <VcsWizard v-bind="{ ...state.bind }">
        <VcsWizardStep
          step="0"
          :heading="heading"
          :help-text="helpText"
          v-bind="{ ...state.bind }"
          v-model.number="step"
        >
          <span
            >Lorem ipsum dolor sit amet consectetur adipisicing elit. Commodi,
            ratione debitis quis est labore voluptatibus! Eaque cupiditate
            minima, at placeat totam, magni doloremque veniam neque porro libero
            rerum unde voluptatem!
          </span>
        </VcsWizardStep>
      </VcsWizard>
      <template #controls>
        <GlobalControls v-model="state">
          <div>
            <h1 class="ma-2">VcsWizardStep</h1>
            <HstText v-model="heading" title="heading" />
            <HstText v-model="helpText" title="helpText" />
          </div>
        </GlobalControls>
      </template>
    </Variant>
  </Story>
</template>
