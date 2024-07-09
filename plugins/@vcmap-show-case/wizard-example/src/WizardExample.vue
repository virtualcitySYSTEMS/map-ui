<template>
  <VcsWizard v-model.number="step">
    <VcsWizardStep
      step="0"
      :complete="step > 0"
      help-text="1. this is the help text"
      heading="This is the first step"
      v-model.number="step"
    >
      <!-- px-2 because does not contain input components -->
      <div>This is the content of the first step.</div>
      <template #actions="{ next }">
        <VcsFormButton @click="next">Next</VcsFormButton>
      </template>
    </VcsWizardStep>
    <VcsWizardStep
      step="1"
      editable
      :header-actions="actions.second"
      heading="This is the second step"
      v-model.number="step"
      :rules="[(v) => !!formValid]"
    >
      <template #help>
        Allowed options:
        <ol>
          <li>is</li>
          <li>a</li>
          <li>test</li>
        </ol>
      </template>
      <v-form ref="formRef" v-model="formValid" lazy-validation>
        <VcsSelect
          :items="['this', 'is', 'a', 'test']"
          v-model="selection"
          placeholder="Select"
          :rules="[
            (v) => (!!v && v !== 'this') || 'Please select a valid option.',
          ]"
        />
      </v-form>
      <template #actions="{ prev }">
        <VcsFormButton @click="prev">Back</VcsFormButton>
      </template>
    </VcsWizardStep>
    <div class="d-flex flex-grow-1 flex-row-reverse pa-2">
      <VcsFormButton
        :disabled="!selection || !formValid"
        @click="finish()"
        variant="filled"
      >
        Finish
      </VcsFormButton>
    </div>
  </VcsWizard>
</template>

<script>
  import {
    VcsWizard,
    VcsWizardStep,
    VcsFormButton,
    VcsSelect,
  } from '@vcmap/ui';
  import { VForm } from 'vuetify/components';
  import { ref } from 'vue';

  /** Component to showcase the VcsWizard and VcsWizardStep. */
  export default {
    name: 'WizardExample',
    components: {
      VcsWizard,
      VcsWizardStep,
      VcsFormButton,
      VcsSelect,
      VForm,
    },
    setup() {
      const step = ref(0);
      const selection = ref(undefined);
      const formRef = ref(null);
      const formValid = ref(false);
      const actions = {
        second: [
          {
            name: 'resetSecondStep',
            title: 'Reset step',
            icon: '$vcsReturn',
            callback() {
              selection.value = undefined;
            },
          },
        ],
      };

      function finish() {
        step.value = 0;
        formRef.value?.resetValidation();
      }

      return {
        step,
        selection,
        actions,
        formValid,
        formRef,
        finish,
      };
    },
  };
</script>

<style scoped></style>
