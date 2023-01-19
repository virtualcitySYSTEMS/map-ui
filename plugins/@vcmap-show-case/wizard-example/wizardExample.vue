<template>
  <VcsWizard
    v-model="step"
  >
    <v-stepper-step
      step="1"
      editable
      :complete="step > 1"
    >
      This is the first step
    </v-stepper-step>
    <v-stepper-content
      step="1"
    >
      <v-sheet>
        This is the content of the first step.
      </v-sheet>
      <VcsButton
        @click="increaseStep()"
        class="my-2"
      >
        Next
      </VcsButton>
    </v-stepper-content>
    <v-stepper-step
      :rules="[() => false]"
      step="2"
      editable
    >
      This is the second step
    </v-stepper-step>
    <v-stepper-content
      step="2"
    >
      <VcsSelect
        :items="['this', 'is', 'a', 'test']"
        label="Select"
        class="my-2"
      />
      <VcsButton
        @click="decreaseStep()"
      >
        Back
      </VcsButton>
    </v-stepper-content>
  </VcsWizard>
</template>

<script>
  import { VcsWizard, VcsButton, VcsSelect } from '@vcmap/ui';
  import { VStepperStep, VStepperContent, VSheet } from 'vuetify/lib';
  import { ref } from 'vue';

  export default {
    name: 'WizardExample',
    components: {
      VcsWizard,
      VStepperStep,
      VStepperContent,
      VSheet,
      VcsButton,
      VcsSelect,
    },
    setup() {
      const step = ref(1);
      return {
        step,
        increaseStep() { step.value += 1; },
        decreaseStep() { step.value -= 1; },
      };
    },
  };
</script>

<style scoped>

</style>
