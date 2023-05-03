<template>
  <div class="step-border">
    <v-stepper-step
      :step="step"
      :editable="editable"
      :complete="complete"
      :rules="rules"
      class="pr-2"
    >
      <div class="d-flex justify-space-between align-center">
        <slot name="header" />
        <div v-if="!$slots.header" class="step-label-wrap">
          <span>{{ $t(heading) }}</span>
        </div>
        <VcsActionButtonList
          v-if="Number(step) === Number(value)"
          :actions="actions"
          :overflow-count="actionButtonListOverflowCount"
          small
          @mousedown.stop
          @touchstart.stop
          @keydown.stop
        />
      </div>
    </v-stepper-step>
    <v-stepper-content v-if="$slots.content" class="pr-4" :step="step">
      <VcsHelp :text="helpText" :show="showHelp">
        <slot name="help" />
      </VcsHelp>
      <slot name="content" />
    </v-stepper-content>
  </div>
</template>

<script>
  import { computed, reactive, watch } from 'vue';
  import { VStepperStep, VStepperContent } from 'vuetify/lib';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import VcsHelp from '../notification/VcsHelp.vue';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-stepper-step/ |vuetify VStepperStep} and
   * {@link https://vuetifyjs.com/en/api/v-stepper-content/ |vuetify VStepperContent}.
   * @vue-prop {number | string} step - Declares which step of the VcsWizard this VcsWizardStep is.
   * @vue-prop {boolean} [editable=false] - If this step is editable. If so, user can jump to that step by clicking on the v-stepper-step.
   * @vue-prop {boolean} [complete=false] - If this step is completed. Has effect on the look of the v-stepper-step.
   * @vue-prop {Array} [rules] - Vuetify rules.
   * @vue-prop {string} [heading] - The heading of this step. Is rendered in the v-stepper-step.
   * @vue-prop {Array<VcsAction>} [headerActions] - Action buttons to be displayed on the right side of the v-stepper-step.
   * @vue-prop {number} [actionButtonListOverflowCount] - Overflow count to use for the headerActions.
   * @vue-prop {string} [helpText] - Optional help text. Must be plain string. Use 'help' slot for html based help texts. Help slot has precedence over helpText prop.
   * @vue-prop {string | number} value - The current step of the VcsWizard.
   * @vue-data {slot} [#header] - Slot to override the heading prop. Allows to pass html as v-stepper-step content.
   * @vue-data {slot} [#content] - Slot to add content to the step. Is rendered in v-stepper-content.
   * @vue-data {slot} [#help] - Slot to add html to the help section. Overrides content of helpText prop.
   */
  export default {
    name: 'VcsWizardStep',
    components: {
      VStepperStep,
      VStepperContent,
      VcsActionButtonList,
      VcsHelp,
    },
    props: {
      step: {
        type: [String, Number],
        required: true,
      },
      editable: {
        type: Boolean,
        default: false,
      },
      complete: {
        type: Boolean,
        default: false,
      },
      rules: {
        type: Array,
        default: () => [],
      },
      heading: {
        type: String,
        default: undefined,
      },
      headerActions: {
        type: Array,
        default: () => [],
      },
      actionButtonListOverflowCount: {
        type: Number,
        required: false,
        default: undefined,
      },
      helpText: {
        type: String,
        default: undefined,
      },
      value: {
        type: [String, Number],
        required: true,
      },
    },
    setup(props, { slots, emit }) {
      const helpAction = reactive({
        name: 'help',
        title: 'components.vcsFormSection.help',
        active: false,
        icon: 'mdi-help-circle',
        callback() {
          this.active = !this.active;
          if (Number(props.value) !== Number(props.step) && props.editable) {
            emit('input', props.step);
          }
        },
      });
      const showHelp = computed(() => helpAction.active);
      // deactivate help when leaving a step
      watch(
        () => props.value,
        (currentStep, previousStep) => {
          if (Number(previousStep) === Number(props.step)) {
            helpAction.active = false;
          }
        },
      );
      /**
       * @type {import("vue").ComputedRef<VcsAction>}
       */
      const actions = computed(() => {
        if (props.helpText || (slots.help && slots.help().length > 0)) {
          return [...props.headerActions, helpAction];
        }
        return props.headerActions;
      });

      return {
        showHelp,
        actions,
      };
    },
  };
</script>
<style scoped lang="scss">
  .v-alert--text:before {
    background-color: transparent;
  }
  .v-stepper__step {
    ::v-deep {
      .v-ripple__container {
        display: none !important;
      }
    }
  }
  .v-stepper__content {
    padding-left: 2px !important;
  }
  .step-label-wrap {
    padding-top: 13px !important;
    padding-bottom: 13px !important;
  }
</style>
