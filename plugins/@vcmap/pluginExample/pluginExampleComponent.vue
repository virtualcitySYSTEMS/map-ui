<template>
  <v-form v-model="isValid">
    <VcsFormSection
      heading="VcsFormSection Select & Text Inputs"
      :header-actions="actions"
    >
      <template #help>
        <ol>
          <li>{{ $t('pluginExample.help1') }}:</li>
          <span>{{ $t('pluginExample.help1desc') }}</span>
          <li>{{ $t('pluginExample.help2') }}:</li>
          <span>{{ $t('pluginExample.help2desc') }}</span>
          <li>{{ $t('pluginExample.help3') }}:</li>
          <span>{{ $t('pluginExample.help3desc') }}</span>
        </ol>
      </template>
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
        </v-container>
      </template>
    </VcsFormSection>
    <VcsFormSection
      heading="VcsFormSection Number Inputs"
      help-text="pluginExample.help"
    >
      <template #default>
        <v-container>
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
        </v-container>
      </template>
    </VcsFormSection>
    <VcsFormSection
      heading="VcsFormSection Radio & Checkbox"
    >
      <template #default>
        <v-container>
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
    <VcsFormSection
      heading="VcsFormSection Mixed Inputs"
    >
      <template #default>
        <v-container>
          <v-row
            :dense="dense"
            align="center"
          >
            <v-col cols="1">
              <VcsLabel html-for="textInput" :dense="dense" class="text-caption">
                1
              </VcsLabel>
            </v-col>
            <v-col cols="3">
              <VcsSelect
                :items="[
                  {value: 'one', i18n: 'pluginExample.numbers.one'},
                  {value: 'two', i18n: 'pluginExample.numbers.two'},
                  {value: 'three', i18n: 'pluginExample.numbers.three'}]"
                :item-text="item => item.i18n"
                :dense="dense"
              />
            </v-col>
            <v-col cols="3">
              <VcsSelect
                :items="[
                  {value: 'Anna', fullName: 'Annabella'},
                  {value: 'Bella', fullName: 'Belladonna'},
                  {value: 'Claudi', fullName: 'Claudine'}]"
                :item-text="item => item.fullName"
                :dense="dense"
                multiple
                v-model="state.selectedMultiple"
              />
            </v-col>
            <v-col cols="5">
              <VcsTextField
                id="textInput"
                clearable
                :dense="dense"
                v-model="state.conditionalInput"
              />
            </v-col>
          </v-row>
        </v-container>
      </template>
    </VcsFormSection>
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
  import { VCol, VContainer, VForm, VRow } from 'vuetify/lib';
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
      VForm,
      VRow,
      VCol,
      VContainer,
    },
    props: {
      actions: {
        type: Array,
        required: true,
      },
      dense: {
        type: Object,
        required: true,
      },
      showSection: {
        type: Object,
        required: true,
      },
    },
    setup() {
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('@vcmap/plugin-example');
      const newUpdate = ref(true);
      watch(plugin.state, () => { newUpdate.value = true; });

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
        newUpdate,
        logState() {
          // eslint-disable-next-line no-console
          console.log(plugin.getSerializedState());
          newUpdate.value = false;
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
