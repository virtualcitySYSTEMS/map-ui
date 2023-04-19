<template>
  <v-form v-model="isValid" ref="form">
    <VcsFormSection
      heading="VcsFormSection Select & Text Inputs"
      :header-actions="actions"
      :action-button-list-overflow-count="4"
    >
      <template #help>
        <ol>
          <li>{{ $t('form-inputs-example.help1') }}:</li>
          <span>{{ $t('form-inputs-example.help1desc') }}</span>
          <li>{{ $t('form-inputs-example.help2') }}:</li>
          <span>{{ $t('form-inputs-example.help2desc') }}</span>
          <li>{{ $t('form-inputs-example.help3') }}:</li>
          <span>{{ $t('form-inputs-example.help3desc') }}</span>
        </ol>
      </template>
      <template #default v-if="showSection">
        <v-container class="py-0 px-1">
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="selectInput" :dense="dense">
                {{ $t('form-inputs-example.select') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSelect
                id="selectInput"
                :items="selectOptions"
                :dense="dense"
                :rules="[(v) => v !== 'D' || 'D is not allowed']"
                v-model="state.selected"
                color="purple"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
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
                :rules="[
                  conditionalTest(state.conditionalInput, state.selected),
                ]"
                v-model="state.conditionalInput"
                placeholder="conditional"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsTextField
                :dense="dense"
                v-model="state.initialTextInput"
                :rules="[isValidText]"
                :loading="state.initialTextInput === 'myInitialText'"
                :error-messages="
                  !state.checkboxInput
                    ? ['manual error message depending on checkbox']
                    : undefined
                "
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsTextArea
                :dense="dense"
                :rules="[(v) => !!v || 'text area must not be empty']"
                placeholder="This is a text area"
                rows="2"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="emailInput" :dense="dense"> Email </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="emailInput"
                :dense="dense"
                type="email"
                :rules="[isValidEmail]"
                v-model="state.email"
                color="blue"
                placeholder="Email address"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="prependedInput" :dense="dense">
                String With Icon
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="prependedInput"
                :dense="dense"
                prepend-icon="mdi-map-marker"
                v-model="state.prependedInput"
                label="text"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="fileInput" :dense="dense">
                File input
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="fileInput"
                :dense="dense"
                type="file"
                multiple
                v-model="state.files"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="dateInput" :dense="dense"> Date </VcsLabel>
            </v-col>
            <v-col>
              <VcsDatePicker id="dateInput" v-model="state.dateInput" />
            </v-col>
          </v-row>
        </v-container>
      </template>
    </VcsFormSection>
    <VcsFormSection
      heading="VcsFormSection Number Inputs"
      help-text="form-inputs-example.help"
    >
      <template #default>
        <v-container class="py-0 px-1">
          <v-row no-gutters>
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
                step="1"
                unit="cm"
                v-model.number="state.numberInput"
                show-spin-buttons
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
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
          <v-row no-gutters>
            <v-col>
              <VcsTextField
                id="coordinateX"
                :dense="dense"
                type="number"
                step="10"
                prefix="X"
                unit="m"
                v-model.number="state.numberInput"
              />
            </v-col>
            <v-col class="px-2">
              <VcsTextField
                id="coordinateY"
                :dense="dense"
                type="number"
                step="10"
                prefix="Y"
                unit="m"
                v-model.number="state.numberInput"
              />
            </v-col>
            <v-col>
              <VcsTextField
                id="coordinateZ"
                :dense="dense"
                type="number"
                step="10"
                unit="m"
                prefix="Z"
                v-model.number="state.numberInput"
              />
            </v-col>
          </v-row>
        </v-container>
      </template>
    </VcsFormSection>
    <VcsFormSection heading="VcsFormSection Radio & Checkbox">
      <template #default>
        <v-container class="py-0 px-1">
          <v-row no-gutters>
            <v-col>
              <VcsRadio
                :dense="dense"
                :items="[
                  ...selectOptions,
                  {
                    label: 'Radio Option E colored',
                    color: 'primary',
                    value: 'E',
                  },
                ]"
                v-model="state.selected"
                :rules="[(v) => v !== 'D' || 'D is not allowed']"
                row
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsLabel :dense="dense"> Text </VcsLabel>
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsCheckbox
                id="checkboxInput"
                label="CheckboxInput"
                :dense="dense"
                :rules="[
                  () => state.checkboxInput || 'Please accept our terms of use',
                ]"
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
    </VcsFormSection>
    <VcsFormSection heading="VcsFormSection Mixed Inputs">
      <template #header="{ heading }">
        <article class="pa-2 text--primary">
          {{ heading }}
          <h3>This is a custom header using header slot</h3>
        </article>
      </template>
      <template #default>
        <v-container class="py-0 px-1">
          <v-row>
            <v-col cols="1">
              <VcsLabel
                html-for="textInput"
                :dense="dense"
                class="text-caption"
              >
                1
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSelect
                :items="[
                  { value: 'one', i18n: 'form-inputs-example.numbers.one' },
                  { value: 'two', i18n: 'form-inputs-example.numbers.two' },
                  { value: 'three', i18n: 'form-inputs-example.numbers.three' },
                ]"
                :item-text="(item) => item.i18n"
                :dense="dense"
                placeholder="Numbers"
              />
            </v-col>
            <v-col>
              <VcsSelect
                :items="[
                  { value: 'Anna', fullName: 'Annabella' },
                  { value: 'Bella', fullName: 'Belladonna' },
                  { value: 'Claudi', fullName: 'Claudine' },
                ]"
                :item-text="(item) => item.fullName"
                :dense="dense"
                multiple
                v-model="state.selectedMultiple"
                :rules="[
                  (v) => !!v.length || 'Please select at least one option.',
                ]"
              />
            </v-col>
          </v-row>
        </v-container>
      </template>
    </VcsFormSection>
    <div class="d-flex justify-space-between px-2">
      <VcsButton
        @click="logState(state)"
        :disabled="!isValid"
        :tooltip="'Log current state in console'"
        :has-update="isValid && newUpdate"
        class="mx-2 mb-2"
      >
        Log State
      </VcsButton>
      <VcsButton @click="validate()"> Val </VcsButton>
      <VcsButton @click="resetState()" icon="$vcsReturn"> Reset </VcsButton>
    </div>
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
    VcsTextArea,
    VcsDatePicker,
  } from '@vcmap/ui';
  import { VCol, VContainer, VForm, VRow } from 'vuetify/lib';
  import packageJSON from './package.json';
  import { isValidText, conditionalTest, isValidEmail } from './validation.js';

  export default {
    name: 'FormInputsExample',
    components: {
      VcsButton,
      VcsSelect,
      VcsTextField,
      VcsCheckbox,
      VcsRadio,
      VcsFormattedNumber,
      VcsFormSection,
      VcsLabel,
      VcsTextArea,
      VForm,
      VRow,
      VCol,
      VContainer,
      VcsDatePicker,
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
      const plugin = app.plugins.getByKey(packageJSON.name);
      const newUpdate = ref(true);
      watch(plugin.state, () => {
        newUpdate.value = true;
      });
      const form = ref();

      return {
        // no object-destruction of reactive objects! or use toRef()
        state: plugin.state,
        // do not put the whole config here, since it would become reactive
        selectOptions: plugin.config.selectOptions,
        form,
        isValid: ref(true),
        isValidText,
        conditionalTest,
        isValidEmail,
        newUpdate,
        resetState() {
          plugin.resetState();
          form.value.resetValidation();
        },
        validate() {
          form.value.validate();
        },
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
  label {
    font-size: 12px;
  }
</style>
