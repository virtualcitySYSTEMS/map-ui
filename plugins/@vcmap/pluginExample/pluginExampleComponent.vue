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
              <VcsLabel html-for="selectInput" :dense="dense">
                {{ $t('pluginExample.select') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSelect
                id="selectInput"
                :items="selectOptions"
                :dense="dense"
                :rules="[conditionalTest(state.conditionalInput, state.selected)]"
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
              <VcsLabel html-for="conditionalInput" :dense="dense">
                ConditionalInput
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="conditionalInput"
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
              />
            </v-col>
          </v-row>
          <v-row
            :dense="dense"
            no-gutters
            align="center"
          >
            <v-col>
              <VcsLabel html-for="initialTextInput" :dense="dense">
                InitialTextInput
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="initialTextInput"
                :dense="dense"
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
              <VcsLabel html-for="numberInput" :dense="dense">
                NumberInput
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="numberInput"
                :dense="dense"
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
              <VcsLabel html-for="formattedNumber" :dense="dense">
                VcsFormattedNumber
              </VcsLabel>
            </v-col>
            <v-col class="d-flex justify-end">
              <VcsFormattedNumber
                id="formattedNumber"
                :value="state.numberInput"
                unit="cm"
                :fraction-digits="1"
                :dense="dense"
              />
            </v-col>
          </v-row>
          <v-row
            :dense="dense"
            no-gutters
            align="center"
          >
            <v-col cols="1" class="px-1">
              <VcsLabel html-for="coordinateX" :dense="dense">
                X
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="coordinateX"
                :dense="dense"
                type="number"
                step="10"
                suffix="m"
                v-model.number="state.numberInput"
              />
            </v-col>
            <v-col cols="1" class="px-1">
              <VcsLabel html-for="coordinateY" :dense="dense">
                Y
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="coordinateY"
                :dense="dense"
                type="number"
                step="10"
                suffix="m"
                v-model.number="state.numberInput"
              />
            </v-col>
            <v-col cols="1" class="px-1">
              <VcsLabel html-for="coordinateZ" :dense="dense">
                Z
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="coordinateZ"
                :dense="dense"
                type="number"
                step="10"
                suffix="m"
                v-model.number="state.numberInput"
              />
            </v-col>
          </v-row>
          <v-row
            :dense="dense"
            no-gutters
            align="center"
          >
            <v-col cols="1" class="px-1">
              <VcsLabel html-for="textInput" :dense="dense" class="text-caption">
                1
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSelect
                :items="['A', 'B', 'C']"
                :dense="dense"
              />
            </v-col>
            <v-col>
              <VcsSelect
                :items="['A', 'B', 'C']"
                :dense="dense"
                multiple
              />
            </v-col>
            <v-col>
              <VcsTextField
                id="textInput"
                clearable
                :dense="dense"
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
              <VcsLabel html-for="emailInput" :dense="dense">
                Email
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="emailInput"
                :dense="dense"
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
              <VcsRadio
                :dense="dense"
                :items="[...selectOptions, { label: 'Radio Option E colored', color: 'primary', value: 'E' }]"
                v-model="state.selected"
                row
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
                id="checkboxInput"
                label="CheckboxInput"
                :dense="dense"
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
                small
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
      class="mx-2 mb-2"
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
  import { inject, ref, watch } from 'vue';
  import {
    VcsSelect,
    VcsCheckbox,
    VcsRadio,
    VcsButton,
    VcsTextField,
    VcsFormattedNumber,
    VcsFormSection,
    VcsLabel,
  } from '@vcmap/ui';
  import { isValidText, conditionalTest, isValidEmail } from './validation.js';

  export default {
    name: 'PluginExampleComponent',
    components: {
      VcsButton,
      VcsSelect,
      VcsTextField,
      VcsCheckbox,
      VcsRadio,
      VcsFormattedNumber,
      VcsFormSection,
      VcsLabel,
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
        showSection: ref(true),
        dense: ref(true),
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
