<template>
  <component
    ref="textFieldRef"
    variant="outlined"
    clear-icon="$close"
    :hide-details="false"
    :rules="rules"
    class="primary--placeholder"
    :class="{
      'py-1': !paddingProvided,
    }"
    v-bind="$attrs"
    :is="inputComponent"
    v-model="visibleValue"
  >
    <template #append-inner v-if="unit">
      <slot name="append-inner">{{ unit }}</slot>
    </template>
    <template v-for="slot of Object.keys($slots)" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
    <template #message="{ message }">
      <v-tooltip
        ref="errorTooltipRef"
        :activator="textFieldRef"
        v-if="message"
        :text="message"
        content-class="bg-error"
        :location="tooltipPosition"
      />
    </template>
    <v-tooltip
      v-if="tooltip && !errorTooltipRef"
      :activator="textFieldRef"
      :location="tooltipPosition"
      :text="tooltip"
    ></v-tooltip>
  </component>
</template>

<style lang="scss" scoped>
  :deep(.v-field) {
    --v-field-padding-start: 8px;
    --v-field-padding-end: 8px;
  }
  .v-input--density-compact :deep(.v-field) {
    --v-input-control-height: calc(var(--v-vcs-item-height) - 8px);
    --v-field-padding-bottom: 0px;
    --v-field-input-padding-top: 0px;
    --v-input-padding-top: 0px;
  }

  :deep(.v-field--focused .v-field__outline *) {
    --v-field-border-width: 1px;
  }
  // set the border color on focused to primary, but not on error
  :deep(.v-field--focused:not(.v-field--error) .v-field__outline *) {
    border-color: rgb(var(--v-theme-primary));
  }
  // Not color, just used if label is given
  :deep(.v-field--focused:not(.v-field--error) .v-field__outline *::after) {
    border-color: rgb(var(--v-theme-primary));
  }

  // remove outline, if not focused, hovered or an error
  :deep(.v-field:not(.v-field--focused):not(.v-field--error):not(:hover)) {
    .v-field__outline * {
      border-width: 0 0 1px 0;
      border-radius: 0;
    }
    .v-field__outline {
      padding-left: 8px;
      padding-right: 8px;
    }
    .v-field__loader {
      padding-left: 8px;
      padding-right: 8px;
    }
    .v-field__outline *::before {
      border-width: 0;
      border-radius: 0;
    }
    .v-field__outline * label {
      color: rgb(var(--v-theme-primary));
      margin-left: -4px;
    }
  }

  // remove margin from prepended Icon
  .v-input--horizontal :deep(.v-input__prepend) {
    margin-inline-end: 4px;
  }
  .primary--placeholder {
    :deep(input::placeholder) {
      color: rgb(var(--v-theme-primary));
      font-style: italic;
      opacity: 1;
      padding: 0 3px 0 0;
    }
    :deep(input::-moz-placeholder) {
      font-style: initial;
    }
  }
  // remove details
  :deep(.v-input__details) {
    display: none;
  }

  // Progress Bar
  :deep(.v-field__loader) {
    top: calc(100% - 2px);
  }
</style>

<script>
  import { computed, ref } from 'vue';
  import { VTextField, VFileInput, VTooltip } from 'vuetify/components';
  import { usePadding } from './composables.js';

  /**
   * @description extends API of {@link https://vuetifyjs.com/en/api/v-text-field v-text-field}.
   * Provides VcsTooltip to
   * - show error messages on focus
   * - show tooltips, if supplied, when hovered over append-icon
   * When clicking esc key, previous input is restored.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the tooltip.
   * @vue-prop {string|undefined}                       tooltip - Optional tooltip which will be shown on hover when no error message is shown
   * @vue-prop {string}                                 unit - Unit for number input fields. Is displayed behind the number.
   * @vue-prop {number|undefined}                       [decimals] - An optional number of decimal places the visible value will be rounded to. Does not affect the input value!
   */
  export default {
    name: 'VcsTextField',
    inheritAttrs: false,
    components: {
      VTooltip,
      VTextField,
      VFileInput,
    },
    props: {
      tooltip: {
        type: String,
        default: undefined,
      },
      tooltipPosition: {
        type: String,
        default: 'right',
      },
      unit: {
        type: String,
        default: '',
      },
      decimals: {
        type: Number,
        default: undefined,
      },
    },
    setup(props, { attrs, emit }) {
      const textFieldRef = ref();
      const errorTooltipRef = ref();

      const inputComponent = computed(() => {
        if (attrs.type === 'file') {
          return 'VFileInput';
        }
        return 'VTextField';
      });
      const visibleValue = computed({
        get() {
          if (
            attrs.type === 'number' &&
            Number.isFinite(attrs.modelValue) &&
            props.decimals >= 0
          ) {
            return parseFloat(attrs.modelValue.toFixed(props.decimals));
          }
          return attrs.modelValue ?? '';
        },
        set(value) {
          if (attrs.type === 'file') {
            emit('update:modelValue', value);
          }
          // emit is not needed for other types, the vuetify component already emits an @input event. (forwarded listeners)
        },
      });

      const rules = computed(() => {
        if (attrs.type === 'number' && Array.isArray(attrs.rules)) {
          return attrs.rules.map((rule) => {
            return (value) => rule(parseFloat(value));
          });
        } else {
          return attrs.rules;
        }
      });

      const paddingProvided = usePadding(attrs);

      return {
        paddingProvided,
        inputComponent,
        visibleValue,
        rules,
        textFieldRef,
        errorTooltipRef,
      };
    },
  };
</script>
