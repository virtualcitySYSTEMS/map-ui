<template>
  <v-form v-model="isValid">
    <VcsFormSection
      title="VcsFormSection"
      :title-actions="[
        { name: 'alert', icon: 'mdi-message-text' },
        { name: 'toggleSection', icon: showSection ? '$vcsMinus' : '$vcsPlus', size: 32 },
      ]"
      @click="action"
    >
      <template #default v-if="showSection">
        <v-container class="pa-2">
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
          <v-row
            class="d-flex flex-row align-baseline justify-space-between"
          >
            <v-col cols="5">
              <label>ConditionalInput</label>
            </v-col>
            <v-col cols="7" class="d-flex justify-center align-baseline w-full">
              <VcsTextField
                hint="please provide a string"
                dense
                clearable
                clear-icon="$vcsTrashCan"
                :rules="[conditionalTest(state.conditionalInput, state.selected)]"
                v-model="state.conditionalInput"
              />
            </v-col>
          </v-row>
          <v-row
            class="d-flex flex-row align-baseline justify-space-between"
          >
            <v-col cols="12">
              <VcsTextField
                label="InitialTextInputDisabled"
                disabled
                outlined
                hide-details
                v-model="initialTextInput"
              />
            </v-col>
          </v-row>
          <v-row
            class="d-flex flex-row align-baseline justify-space-between"
          >
            <v-col cols="5">
              <label>InitialTextInput</label>
            </v-col>
            <v-col cols="7" class="d-flex justify-center align-baseline w-full">
              <VcsTextField
                dense
                persistent-hint
                hint="Input stays in state loading as long as default input is not changed!"
                :rules="[isValidText]"
                :loading="state.initialTextInput === 'myInitialText'"
                v-model="state.initialTextInput"
              />
            </v-col>
          </v-row>
          <v-row
            class="d-flex flex-row align-baseline justify-space-between"
          >
            <v-col cols="5">
              <label>NumberInput</label>
            </v-col>
            <v-col cols="7" class="d-flex justify-center align-baseline w-full">
              <VcsTextField
                dense
                hint="please provide a number"
                :solo-inverted="true"
                type="number"
                step="10"
                prefix="a ="
                suffix="cm"
                v-model.number="state.numberInput"
              />
            </v-col>
          </v-row>
          <v-row
            class="d-flex flex-row align-baseline justify-space-between"
          >
            <v-col cols="5">
              <label>VcsFormattedNumber</label>
            </v-col>
            <v-col cols="7" class="d-flex justify-center align-baseline w-full">
              <VcsFormattedNumber
                label="FormattedNumber"
                :value="state.numberInput"
                unit="cm"
                :fraction-digits="1"
              />
            </v-col>
          </v-row>
          <v-row
            class="d-flex flex-row align-baseline justify-space-between"
          >
            <v-col cols="5">
              <label>Email</label>
            </v-col>
            <v-col cols="7" class="d-flex justify-center align-baseline w-full">
              <VcsTextField
                dense
                hint="please provide your email"
                type="email"
                :rules="[isValidEmail]"
                v-model="state.email"
              />
            </v-col>
          </v-row>
          <v-row
            class="d-flex flex-row align-baseline justify-space-between"
          >
            <v-col cols="6">
              <VcsCheckbox
                label="CheckboxInput"
                hint="select or deselect"
                :rules="[() => state.checkboxInput || 'Please accept our terms of use']"
                v-model="state.checkboxInput"
              />
            </v-col>
            <v-col cols="6">
              <VcsButton
                :is-active="state.checkboxInput"
                @click="state.checkboxInput = !state.checkboxInput"
                elevation="2"
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

      return {
        showSection: false,
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
        action(type) {
          // TODO standardize Action Items https://gitlab.virtualcitysystems.de/vcsuite/virtualcitymap_ui/-/issues/64
          if (type.name === 'toggleSection') {
            this.showSection = !this.showSection;
          } else {
            alert(type.name);
          }
        },
        logState: () => {
          // eslint-disable-next-line no-console
          console.log(plugin.getSerializedState());
          newUpdate.value = false;
        },
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
