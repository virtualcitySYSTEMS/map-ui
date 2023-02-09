<template>
  <VcsWizard
    v-model.number="step"
  >
    <VcsWizardStep
      step="1"
      :complete="step > 1"
      help-text="1. this is the help text"
      heading="This is the first step"
      v-model.number="step"
    >
      <template #content>
        <div>
          This is the content of the first step.
        </div>
        <VcsButton
          @click="increaseStep()"
          class="my-2"
        >
          Next
        </VcsButton>
      </template>
    </VcsWizardStep>
    <VcsWizardStep
      :rules="[() => false]"
      step="2"
      editable
      :header-actions="actions.second"
      heading="This is the second step"
      v-model.number="step"
    >
      <template #help>
        <ol>
          <li>this</li>
          <li>is</li>
          <li>the help slot</li>
        </ol>
      </template>
      <template #content>
        <VcsSelect
          :items="['this', 'is', 'a', 'test']"
          v-model="selection"
          label="Select"
          class="my-2"
        />
        <VcsButton
          @click="decreaseStep()"
        >
          Back
        </VcsButton>
      </template>
    </VcsWizardStep>
  </VcsWizard>
</template>

<script>
  import { VcsWizard, VcsWizardStep, VcsButton, VcsSelect } from '@vcmap/ui';
  import { ref } from 'vue';

  /** Component to showcase the VcsWizard and VcsWizardStep. */
  export default {
    name: 'WizardExample',
    components: {
      VcsWizard,
      VcsWizardStep,
      VcsButton,
      VcsSelect,
    },
    setup() {
      const step = ref(1);
      const selection = ref();
      const actions = {
        second: [{
          name: 'resetSecondStep',
          title: 'Reset step',
          icon: '$vcsReturn',
          callback() {
            selection.value = undefined;
          },
        }],
      };
      return {
        step,
        increaseStep() { step.value += 1; },
        decreaseStep() { step.value -= 1; },
        selection,
        actions,
      };
    },
  };
</script>

<style scoped>

</style>
