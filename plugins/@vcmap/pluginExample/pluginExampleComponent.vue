<template>
  <v-form v-model="isValid">
    <!-- TODO add dumb component select with label like TextField.vue -->
    <v-row
      class="d-flex flex-row align-baseline justify-space-between"
    >
      <v-col cols="5">
        <label>Select</label>
      </v-col>
      <v-col cols="7" class="d-flex justify-center align-baseline w-full">
        <VcsSelect
          :items="selectOptions"
          v-model="state.selected"
        />
      </v-col>
    </v-row>
    <div
      class="d-flex flex-row align-baseline justify-space-between"
    >
      <VcsTextField
        label="ConditionalInput"
        hint="please provide a string"
        :rules="[conditionalTest(state.conditionalInput, state.selected)]"
        v-model="state.conditionalInput"
      />
    </div>
    <div
      class="d-flex flex-row align-baseline justify-space-between"
    >
      <VcsTextField
        label="InitialTextInputDisabled"
        :disabled="true"
        v-model="initialTextInput"
      />
    </div>
    <div
      class="d-flex flex-row align-end justify-space-between"
    >
      <VcsTextField
        label="InitialTextInput"
        hint="please provide a string"
        :rules="[isValidText]"
        v-model="state.initialTextInput"
      />
    </div>
    <div
      class="d-flex flex-row align-baseline justify-space-between"
    >
      <VcsTextField
        label="NumberInput"
        hint="please provide a number"
        type="number"
        step="10"
        v-model="state.numberInput"
      />
    </div>
    <div
      class="d-flex flex-row align-baseline justify-space-between"
    >
      <VcsTextField
        label="Email"
        hint="please provide your email"
        type="email"
        :rules="[isValidEmail]"
        v-model="state.email"
      />
    </div>
    <div
      class="d-flex flex-row align-baseline justify-space-between"
    >
      <VcsCheckbox
        label="CheckboxInput"
        hint="select or deselect"
        :rules="[() => state.checkboxInput || 'Please accept our terms of use']"
        v-model="state.checkboxInput"
      />
    </div>
    <VcsButton
      @input="logState(state)"
      :disabled="!isValid"
      :tooltip="'Log current state in console'"
    >
      Log State
    </VcsButton>
    <VcsButton
      type="reset"
    >
      Reset
    </VcsButton>
  </v-form>
</template>
<script>
  import { inject } from '@vue/composition-api';
  import { VcsSelect, VcsCheckbox } from '@vcsuite/ui-components';
  import { isValidText, conditionalTest, isValidEmail } from './validation.js';
  import VcsButton from '../../../components/Button.vue';
  import VcsTextField from '../../../components/TextField.vue';

  export default {
    name: 'PluginExampleComponent',
    components: { VcsButton, VcsSelect, VcsTextField, VcsCheckbox },
    props: {
      windowId: {
        type: String,
        default: '',
      },
    },
    setup() {
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('@vcmap/pluginExample');

      return {
        // no object-destruction of reactive objects! or use toRef()
        state: plugin.state,
        // do not put the whole config here, since it would become reactive
        selectOptions: plugin.config.selectOptions,
        initialTextInput: plugin.config.initialTextInput,
        isValid: false,
        isValidText,
        conditionalTest,
        isValidEmail,
        logState: () => console.log(plugin.getSerializedState()),
      };
    },
  };
</script>

<style lang="scss" scoped>
  .v-form{
    padding: 0 5px
  }
  .v-text-field.v-text-field--enclosed:not(.v-text-field--rounded) {
    ::v-deep{
      > .v-input__control > .v-input__slot{
        padding: 0;
      }
    }
  }
</style>
