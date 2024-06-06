<template>
  <v-form v-model="isValid" ref="form">
    <VcsFormSection
      heading="VcsFormSection Select & Text Inputs"
      expandable
      start-open
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
      <template #default>
        <v-container class="py-0 px-1">
          <v-row no-gutters>
            <v-col class="w-max-half">
              <VcsLabel html-for="selectInput" :dense="dense">
                {{ $t('form-inputs-example.select') }}
              </VcsLabel>
            </v-col>
            <v-col class="w-max-half">
              <VcsSelect
                id="selectInput"
                :items="selectOptions"
                :dense="dense"
                :rules="[(v) => v !== 'D' || 'D is not allowed']"
                v-model="state.selected"
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
                :rules="[
                  conditionalTest(state.conditionalInput, state.selected),
                ]"
                v-model="state.conditionalInput"
                placeholder="conditional"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col class="w-max-half">
              <VcsLabel html-for="arrayInput" :dense="dense">
                Array Input
              </VcsLabel>
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsChipArrayInput
                id="arrayInput"
                type="number"
                :dense="dense"
                v-model="state.arrayInput"
                :rules="[arrayTest]"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsChipArrayInput
                id="arrayInput"
                :dense="dense"
                v-model="state.arrayInputString"
                column
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsTextField
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
              <VcsLabel html-for="emailInput" :dense="dense" required>
                Email
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="emailInput"
                type="email"
                :rules="[isValidEmail]"
                v-model="state.email"
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
                type="number"
                step="1"
                unit="cm"
                v-model.number="state.numberInput"
                show-spin-buttons
              />
            </v-col>
          </v-row>
          <v-row no-gutters class="align-center">
            <v-col>
              <VcsLabel html-for="sliderInput" :dense="dense">
                Slider
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSlider
                id="sliderInput"
                :dense="dense"
                type="number"
                step="1"
                v-model.number="state.numberInput"
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
          <v-row no-gutters class="gc-2">
            <v-col>
              <VcsFormattedNumber
                id="formattedNumber"
                :value="state.numberInput"
                prefix="X"
                unit="cm"
                :fraction-digits="1"
                :dense="dense"
              />
            </v-col>
            <v-col>
              <VcsFormattedNumber
                id="formattedNumber"
                :value="state.numberInput"
                prefix="Y"
                unit="cm"
                :fraction-digits="1"
                :dense="dense"
              />
            </v-col>
            <v-col>
              <VcsFormattedNumber
                id="formattedNumber"
                :value="state.numberInput"
                prefix="Z"
                unit="cm"
                :fraction-digits="1"
                :dense="dense"
              />
            </v-col>
          </v-row>
          <!--          TODO prefix fails-->
          <v-row no-gutters class="gc-2">
            <v-col>
              <VcsTextField
                id="coordinateX"
                type="number"
                step="10"
                prefix="X"
                unit="cm"
                v-model.number="state.numberInput"
              />
            </v-col>
            <v-col>
              <VcsTextField
                id="coordinateY"
                type="number"
                step="10"
                prefix="Y"
                unit="cm"
                v-model.number="state.numberInput"
              />
            </v-col>
            <v-col>
              <VcsTextField
                id="coordinateZ"
                type="number"
                step="10"
                unit="cm"
                prefix="Z"
                v-model.number="state.numberInput"
              />
            </v-col>
          </v-row>
        </v-container>
      </template>
    </VcsFormSection>
    <VcsFormSection
      heading="VcsFormSection Radio & Checkbox"
      expandable
      start-open
      :disabled="!state.checkboxInput"
    >
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
              tooltip="This is a checkbox for terms of usage"
              :rules="[
                () => state.checkboxInput || 'Please accept our terms of use',
              ]"
              v-model="state.checkboxInput"
            />
          </v-col>
          <v-col>
            <VcsFormButton
              :is-active="state.checkboxInput"
              @click="state.checkboxInput = !state.checkboxInput"
              tooltip="toggle button"
              color="warning"
              tooltip-position="right"
              class="pt-1"
            >
              <span v-if="state.checkboxInput">Active-true</span>
              <span v-else>Active-false</span>
            </VcsFormButton>
          </v-col>
        </v-row>
      </v-container>
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
          <v-row no-gutters>
            <v-col>
              <VcsRadioGrid
                v-model="state.selected"
                :items="[
                  { value: 'AAAAAAAA', src: 'mdi-circle-outline' },
                  { value: 'B', src: 'mdi-close' },
                  { value: 'C', src: 'mdi-triangle-outline' },
                  { value: 'D', src: 'mdi-square-outline' },
                ]"
                :dense="dense"
                :rules="[(v) => v !== 'D' || 'Square is not allowed']"
              >
                <!-- if label slot is not used, src is forwarded to img src -->
                <template #label="{ src, value }">
                  <figure>
                    <v-icon size="24" class="d-flex justify-center">{{
                      src
                    }}</v-icon>
                    <figcaption class="d-flex justify-center">
                      {{ value }}
                    </figcaption>
                  </figure>
                </template>
              </VcsRadioGrid>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </VcsFormSection>
    <VcsFormSection
      heading="Disabled form section"
      expandable
      start-open
      :disabled="true"
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
      <template #default>
        <v-container class="py-0 px-1">
          <v-row no-gutters>
            <v-col class="w-max-half">
              <VcsLabel html-for="selectInput2" :dense="dense" :disabled="true">
                {{ $t('form-inputs-example.select') }}
              </VcsLabel>
            </v-col>
            <v-col class="w-max-half">
              <VcsSelect
                id="selectInput2"
                :items="selectOptions"
                :dense="dense"
                :rules="[(v) => v !== 'D' || 'D is not allowed']"
                v-model="state.selected"
                :disabled="true"
              />
            </v-col>
          </v-row>
        </v-container>
      </template>
    </VcsFormSection>
    <div class="d-flex gc-2 px-2 pt-2 pb-1">
      <div class="d-flex gc-2">
        <VcsFormButton @click="validate()"> Val </VcsFormButton>
        <VcsFormButton @click="resetState()" icon="$vcsReturn">
          Reset
        </VcsFormButton>
      </div>
      <div class="d-flex gc-2 w-full justify-end">
        <VcsFormButton
          variant="filled"
          @click="logState(state)"
          :disabled="!isValid"
          :tooltip="'Log current state in console'"
          :has-update="isValid && newUpdate"
        >
          Log State
        </VcsFormButton>
      </div>
    </div>
  </v-form>
</template>
<script>
  import { inject, ref, watch } from 'vue';
  import {
    VcsSelect,
    VcsCheckbox,
    VcsRadio,
    VcsFormButton,
    VcsTextField,
    VcsChipArrayInput,
    VcsFormattedNumber,
    VcsFormSection,
    VcsLabel,
    VcsTextArea,
    VcsDatePicker,
    VcsSlider,
    VcsRadioGrid,
  } from '@vcmap/ui';
  import { VCol, VContainer, VForm, VRow, VIcon } from 'vuetify/components';
  import packageJSON from '../package.json';
  import {
    isValidText,
    conditionalTest,
    arrayTest,
    isValidEmail,
  } from './validation.js';

  export default {
    name: 'FormInputsExample',
    components: {
      VcsFormButton,
      VcsSelect,
      VcsTextField,
      VcsCheckbox,
      VcsRadio,
      VcsFormattedNumber,
      VcsFormSection,
      VcsLabel,
      VcsTextArea,
      VcsChipArrayInput,
      VForm,
      VRow,
      VCol,
      VContainer,
      VcsDatePicker,
      VcsSlider,
      VcsRadioGrid,
      VIcon,
    },
    props: {
      actions: {
        type: Array,
        required: true,
      },
      dense: {
        type: Boolean,
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
        arrayTest,
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
