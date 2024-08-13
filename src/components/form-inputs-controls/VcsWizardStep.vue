<template>
  <v-stepper-vertical-item
    :value="step"
    :editable="isActiveStep || editable"
    :complete="complete"
    :rules="rules"
    :multiple="multiple"
    :hide-actions="true"
    icon="mdi-circle"
    complete-icon="mdi-circle"
    edit-icon="mdi-circle"
    error-icon="mdi-circle"
    v-bind="$attrs"
  >
    <template #title>
      <slot name="title">
        <div class="d-flex align-center justify-space-between">
          <div v-if="!$slots.title">
            <span>{{ $st(heading) }}</span>
          </div>
          <v-spacer />
          <VcsActionButtonList
            v-if="isActiveStep"
            :actions="actions"
            :overflow-count="actionButtonListOverflowCount"
            class="justify-end"
          />
        </div>
      </slot>
    </template>
    <template #default>
      <div>
        <VcsHelp :text="helpText" :show="showHelp" class="mb-1">
          <slot name="help" />
        </VcsHelp>
        <slot />
      </div>
    </template>
    <template v-for="slot of forwardSlots" #[slot]="scope">
      <slot :name="slot" v-bind="scope ?? {}" />
    </template>
  </v-stepper-vertical-item>
</template>

<script>
  import { computed, reactive, watch } from 'vue';
  import { VStepperVerticalItem } from 'vuetify/labs/VStepperVertical';
  import { VSpacer } from 'vuetify/components';
  import { useProxiedComplexModel } from '../modelHelper.js';
  import { useForwardSlots } from '../composables.js';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import VcsHelp from '../notification/VcsHelp.vue';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-stepper-step/ |vuetify VStepperStep} and
   * {@link https://vuetifyjs.com/en/api/v-stepper-content/ |vuetify VStepperContent}.
   * @vue-prop {boolean} multiple - Whether multiple steps can be active at the same time.
   * @vue-prop {string | number} modelValue - The current step of the VcsWizard.
   * @vue-prop {number | string} step - Declares which step of the VcsWizard this VcsWizardStep is.
   * @vue-prop {boolean} [editable=false] - If this step is editable. If so, user can jump to that step by clicking on the v-stepper-step.
   * @vue-prop {boolean} [complete=false] - If this step is completed. Has effect on the look of the v-stepper-step.
   * @vue-prop {Array} [rules] - Vuetify rules.
   * @vue-prop {string} [heading] - The heading of this step. Is rendered in the v-stepper-step.
   * @vue-prop {Array<VcsAction>} [headerActions] - Action buttons to be displayed on the right side of the v-stepper-step.
   * @vue-prop {number} [actionButtonListOverflowCount] - Overflow count to use for the headerActions.
   * @vue-prop {string} [helpText] - Optional help text. Must be plain string. Use 'help' slot for html based help texts. Help slot has precedence over helpText prop.
   * @vue-data {slot} [#header] - Slot to override the heading prop. Allows to pass html as v-stepper-step content.
   * @vue-data {slot} [#content] - Slot to add content to the step. Is rendered in v-stepper-content.
   * @vue-data {slot} [#help] - Slot to add html to the help section. Overrides content of helpText prop.
   */
  export default {
    name: 'VcsWizardStep',
    components: {
      VSpacer,
      VStepperVerticalItem,
      VcsActionButtonList,
      VcsHelp,
    },
    props: {
      multiple: {
        type: Boolean,
        default: false,
      },
      modelValue: {
        type: [Array, String, Boolean, Number],
        default(rawProps) {
          if (rawProps.multiple) {
            return [];
          }
          return 0;
        },
      },
      step: {
        type: [String, Number],
        default: 0,
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
    },
    setup(props, { slots, emit }) {
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);
      const isActiveStep = computed(
        () => Number(props.step) === Number(localValue.value),
      );

      const helpAction = reactive({
        name: 'help',
        title: 'components.vcsFormSection.help',
        active: true,
        icon: 'mdi-help-circle',
        callback() {
          this.active = !this.active;
          if (!isActiveStep.value && props.editable) {
            localValue.value = props.step;
          }
        },
      });
      const showHelp = computed(() => helpAction.active);
      // deactivate help when leaving a step
      watch(
        () => localValue,
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

      const forwardSlots = useForwardSlots(slots, ['title', 'default']);

      return {
        showHelp,
        actions,
        isActiveStep,
        forwardSlots,
      };
    },
  };
</script>
<style scoped lang="scss"></style>
