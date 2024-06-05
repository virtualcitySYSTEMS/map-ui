<template>
  <div @mouseover="hover = true" @mouseleave="hover = false">
    <VcsTooltip
      :tooltip-position="tooltipPosition"
      :tooltip="errorMessage"
      color="error"
      :max-width="200"
    >
      <template #activator="{ props }">
        <component
          :is="inputComponent"
          ref="textFieldRef"
          hide-details
          :hide-spin-buttons="!showSpinButtons"
          variant="outlined"
          :clearable="isClearable"
          clear-icon="$close"
          @focus="onFocus"
          @blur="onBlur"
          @keydown.esc="onEscape"
          :type="type"
          v-model="visibleValue"
          v-bind="{ ...$attrs, ...props }"
          :rules="rules"
          class="primary--placeholder"
          :class="{
            'py-1': !noPadding,
            'remove-outline': !isOutlined,
          }"
        >
          <template #append-inner v-if="unit">
            <slot name="append-inner">{{ unit }}</slot>
          </template>
        </component>
      </template>
    </VcsTooltip>
  </div>
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
    border-color: rgb(var(--v-theme-primary));
  }
  // Not color, just used if label is given
  :deep(.v-field--focused .v-field__outline *::after) {
    border-color: rgb(var(--v-theme-primary));
  }
  .remove-outline :deep(.v-field .v-field__outline) {
    padding-left: 8px;
    padding-right: 8px;
  }
  .remove-outline :deep(.v-field .v-field__outline *) {
    border-width: 0 0 1px 0;
    border-radius: 0;
  }
  // used to remove border from label
  .remove-outline :deep(.v-field .v-field__outline *::before) {
    border-width: 0;
    border-radius: 0;
  }
  // used to remove border from notch
  .remove-outline :deep(.v-field .v-field__outline * label) {
    color: rgb(var(--v-theme-primary));
    margin-left: -4px;
  }
  // remove margin from prepended Icon
  :deep(.v-input--horizontal .v-input__prepend) {
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
</style>

<script>
  import { computed, onMounted, ref } from 'vue';
  import { VTextField, VFileInput } from 'vuetify/components';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import { useErrorSync } from './composables.js';

  /**
   * @description extends API of {@link https://vuetifyjs.com/en/api/v-text-field v-text-field}.
   * Provides VcsTooltip to
   * - show error messages on focus
   * - show tooltips, if supplied, when hovered over append-icon
   * When clicking esc key, previous input is restored.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {string}                                 unit - Unit for number input fields. Is displayed behind the number.
   * @vue-prop {number|undefined}                       [decimals] - An optional number of decimal places the visible value will be rounded to. Does not affect the input value!
   * @vue-prop {boolean}                                showSpinButtons - If true, spin buttons are displayed in number input fields. Overrides Vuetify hide-spin-buttons.
   * @vue-prop {boolean}                                noPadding - Padding is required for usage within rows. For standalone usage this prop removes class py-1.
   * @vue-computed {boolean}                            isClearable - Whether textfield is isClearable. Makes sure icon is only shown on focus, hover or error.
   * @vue-computed {boolean}                            isOutlined - Textfield is outlined on either hover, focus or error, if not disabled.
   * @vue-computed {string | number}                    visibleValue - Returns the number input as string with unit, in case unit is provided.
   * @vue-computed {string}                             type - The input field type. If number input field is blurred and unit is provided, type changes to text field, so unit can be displayed in input field.
   */
  export default {
    name: 'VcsTextField',
    inheritAttrs: false,
    components: {
      VcsTooltip,
      VTextField,
      VFileInput,
    },
    props: {
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
      showSpinButtons: {
        type: Boolean,
        default: false,
      },
      noPadding: {
        type: Boolean,
        default: false,
      },
    },
    setup(props, { attrs, emit }) {
      const hover = ref(false);
      const focus = ref(false);
      const textFieldRef = ref();

      onMounted(() => {
        // fix for autofocus
        focus.value = attrs.autofocus != null;
      });

      const errorMessage = useErrorSync(textFieldRef);

      const inputComponent = computed(() => {
        if (attrs.type === 'file') {
          return 'VFileInput';
        }
        return 'VTextField';
      });
      const isClearable = computed(() => {
        return (
          attrs.clearable !== undefined &&
          attrs.clearable !== false &&
          (hover.value || focus.value || !!errorMessage.value)
        );
      });
      const isDense = computed(() => attrs.dense !== false);
      const isOutlined = computed(() => {
        return (
          (hover.value || focus.value || !!errorMessage.value) &&
          !(attrs.disabled || attrs.disabled === '')
        );
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
      const type = computed(() => {
        if (attrs.type === 'number' && !focus.value) {
          return 'text';
        } else {
          return attrs.type || 'text';
        }
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

      function onEscape() {
        textFieldRef.value.blur();
        emit('update:modelValue', textFieldRef.value.initialValue);
      }

      function onBlur() {
        focus.value = false;
      }
      function onFocus() {
        focus.value = true;
      }

      return {
        hover,
        focus,
        inputComponent,
        isClearable,
        isDense,
        isOutlined,
        visibleValue,
        type,
        rules,
        onEscape,
        textFieldRef,
        errorMessage,
        onBlur,
        onFocus,
      };
    },
  };
</script>
