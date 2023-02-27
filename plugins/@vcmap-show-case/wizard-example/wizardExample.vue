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
        <!-- px-2 because does not contain input components -->
        <v-container class="px-2 py-0">
          <div>
            This is the content of the first step.
          </div>
          <VcsButton
            @click="increaseStep()"
            class="my-2"
          >
            Next
          </VcsButton>
        </v-container>
      </template>
    </VcsWizardStep>
    <VcsWizardStep
      step="2"
      editable
      :header-actions="actions.second"
      heading="This is the second step"
      v-model.number="step"
      :rules="[v => !!formValid]"
    >
      <template #help>
        Allowed options:
        <ol>
          <li>is</li>
          <li>a</li>
          <li>test</li>
        </ol>
      </template>
      <template #content>
        <v-container class="px-1 py-0">
          <v-form ref="form" v-model="formValid" lazy-validation>
            <VcsSelect
              :items="['this', 'is', 'a', 'test']"
              v-model="selection"
              placeholder="Select"
              :rules="[v => (!!v && v !== 'this') || 'Please select a valid option.']"
            />
            <VcsButton
              @click="decreaseStep()"
            >
              Back
            </VcsButton>
          </v-form>
        </v-container>
      </template>
    </VcsWizardStep>
    <VcsWizardStep
      step="3"
      v-model.number="step"
    >
      <template #header>
        <div class="d-flex flex-grow-1 flex-row-reverse">
          <VcsButton
            :disabled="!selection || !formValid"
            @click="finish()"
          >
            Finish
          </VcsButton>
        </div>
      </template>
    </VcsWizardStep>
  </VcsWizard>
</template>

<script>
  import { VcsWizard, VcsWizardStep, VcsButton, VcsSelect } from '@vcmap/ui';
  import { VForm, VContainer } from 'vuetify/lib';
  import { ref } from 'vue';

  /** Component to showcase the VcsWizard and VcsWizardStep. */
  export default {
    name: 'WizardExample',
    components: {
      VcsWizard,
      VcsWizardStep,
      VcsButton,
      VcsSelect,
      VForm,
      VContainer,
    },
    setup() {
      const step = ref(1);
      const selection = ref();
      const form = ref();
      const formValid = ref(false);
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
        formValid,
        form,
        finish() {
          step.value = 1;
          form.value.reset();
        },
      };
    },
  };
</script>

<style scoped>

</style>
