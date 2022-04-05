<template>
  <v-form v-model="isValid">
    <VcsFormSection
      title="VcsFormSection"
      :title-actions="[
        {
          name: 'denseSelection',
          title: 'change row height',
          icon: dense ? 'mdi-arrow-split-horizontal' : 'mdi-arrow-collapse-vertical',
          callback: () => this.dense = !this.dense
        },
        { name: 'noIcon', title: 'another action without icon', callback: () => {} },
        {
          name: 'help',
          title: helpExample,
          icon: 'mdi-help-circle',
          callback: () => {},
        },
        {
          name: 'toggleSection',
          title: 'toggle section',
          icon: showSection ? '$vcsMinus' : '$vcsPlus',
          callback: () => this.showSection = !this.showSection
        },
        {
          name: 'toggleIcon',
          title: 'toggle switch example',
          icon: showSection ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off',
          active: showSection,
          callback: () => this.showSection = !this.showSection
        },
        { name: 'alert', icon: 'mdi-message-text', callback: alertAction },
      ]"
    >
      <template #default v-if="showSection">
        <v-container class="pa-2">
          <v-row
            :dense="dense"
            no-gutters
            align="center"
          >
            <v-col>
              <label>Select</label>
            </v-col>
            <v-col>
              <VcsSelect
                :items="selectOptions"
                v-model="state.selected"
              />
            </v-col>
          </v-row>
          <v-row
            :dense="dense"
            no-gutters
            align="center"
          >
            <v-col>
              <label>ConditionalInput</label>
            </v-col>
            <v-col>
              <VcsTextField
                clearable
                :dense="dense"
                :rules="[conditionalTest(state.conditionalInput, state.selected)]"
                v-model="state.conditionalInput"
              />
            </v-col>
          </v-row>
          <v-row
            :dense="dense"
            no-gutters
            align="center"
          >
            <v-col>
              <VcsTextField
                :dense="dense"
                v-model="initialTextInput"
                tooltip="Input has impact on »InitialTextInput« field"
              />
            </v-col>
          </v-row>
          <v-row
            :dense="dense"
            no-gutters
            align="center"
          >
            <v-col>
              <label>InitialTextInput</label>
            </v-col>
            <v-col>
              <VcsTextField
                :dense="dense"
                tooltip="Input stays in state loading as long as default input is not changed!"
                :rules="[isValidText]"
                :loading="state.initialTextInput === 'myInitialText'"
                v-model="state.initialTextInput"
                :error-messages="!state.checkboxInput ? ['manual error message depending on checkbox'] : undefined"
              />
            </v-col>
          </v-row>
          <v-row
            :dense="dense"
            no-gutters
            align="center"
          >
            <v-col>
              <label>NumberInput</label>
            </v-col>
            <v-col>
              <VcsTextField
                :dense="dense"
                tooltip="please provide a number"
                type="number"
                step="10"
                suffix="cm"
                v-model.number="state.numberInput"
              />
            </v-col>
          </v-row>
          <v-row
            :dense="dense"
            no-gutters
            align="center"
          >
            <v-col>
              <label>VcsFormattedNumber</label>
            </v-col>
            <v-col class="d-flex justify-end">
              <VcsFormattedNumber
                label="FormattedNumber"
                :value="state.numberInput"
                unit="cm"
                :fraction-digits="1"
                class="pr-2 font-size-12"
              />
            </v-col>
          </v-row>
          <v-row
            :dense="dense"
            no-gutters
            align="center"
          >
            <v-col>
              <label>Email</label>
            </v-col>
            <v-col>
              <VcsTextField
                :dense="dense"
                tooltip="please provide your email"
                type="email"
                :rules="[isValidEmail]"
                v-model="state.email"
              />
            </v-col>
          </v-row>
          <v-row
            :dense="dense"
            no-gutters
            align="center"
          >
            <v-col>
              <VcsCheckbox
                label="CheckboxInput"
                hint="select or deselect"
                :rules="[() => state.checkboxInput || 'Please accept our terms of use']"
                v-model="state.checkboxInput"
              />
            </v-col>
            <v-col>
              <VcsButton
                :is-active="state.checkboxInput"
                @click="state.checkboxInput = !state.checkboxInput"
                tooltip="toggle button"
                color="warning"
                tooltip-position="right"
              >
                <span v-if="state.checkboxInput">Active-true</span>
                <span v-else>Active-false</span>
              </VcsButton>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </vcsformsection>
    <VcsButton
      @click="logState(state)"
      :disabled="!isValid"
      :tooltip="'Log current state in console'"
      :has-update="isValid && newUpdate"
    >
      Log State
    </VcsButton>
    <VcsButton
      type="reset"
      icon="$vcsReturn"
    >
      Reset
    </VcsButton>
  </v-form>
</template>
<script>
  import { inject, ref, watch } from '@vue/composition-api';
  import {
    VcsSelect, VcsCheckbox, VcsButton, VcsTextField, VcsFormattedNumber, VcsFormSection,
  } from '@vcsuite/ui-components';
  import { isValidText, conditionalTest, isValidEmail } from './validation.js';

  export default {
    name: 'PluginExampleComponent',
    components: {
      VcsButton, VcsSelect, VcsTextField, VcsCheckbox, VcsFormattedNumber, VcsFormSection,
    },
    props: {
      windowId: {
        type: String,
        default: '',
      },
    },
    setup() {
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('@vcmap/plugin-example');
      const newUpdate = ref(true);
      watch(plugin.state, () => { newUpdate.value = true; });

      const helpExample = [
        'Please select an option.',
        'If Option A is chosen, input of ConditionalInput must be \'test\'.',
        'InitialTextInput stays in loading state as long as the initial text is not changed.',
        'VcsFormattedNumber rounds the NumberInput to one decimal digit.',
      ].join('\n');

      return {
        showSection: true,
        dense: true,
        helpExample,
        // no object-destruction of reactive objects! or use toRef()
        state: plugin.state,
        // do not put the whole config here, since it would become reactive
        selectOptions: plugin.config.selectOptions,
        initialTextInput: plugin.config.initialTextInput,
        isValid: false,
        isValidText,
        conditionalTest,
        isValidEmail,
        newUpdate,
        logState() {
          // eslint-disable-next-line no-console
          console.log(plugin.getSerializedState());
          newUpdate.value = false;
        },
        alertAction() {
          alert('alert');
        },
      };
    },
  };
</script>
<style lang="scss" scoped>
label{
  font-size: 12px;
}
</style>
