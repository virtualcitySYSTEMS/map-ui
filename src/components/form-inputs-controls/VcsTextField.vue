<template>
  <div @mouseover="hover = true" @mouseleave="hover = false">
    <VcsTooltip
      :tooltip-position="tooltipPosition"
      :tooltip="errorMessage"
      color="error"
      :max-width="200"
    >
      <template #activator="{ attrs, on }">
        <component
          :is="inputComponent"
          ref="textFieldRef"
          hide-details
          :hide-spin-buttons="!showSpinButtons"
          :dense="isDense"
          :clearable="isClearable"
          @focus="onFocus"
          @blur="onBlur"
          @keydown.esc="onEscape"
          @keydown="$emit('keydown', $event)"
          :type="type"
          outlined
          v-model="visibleValue"
          v-bind="{ ...$attrs, ...attrs }"
          v-on="{ ...$listeners, ...on }"
          :height="isDense ? 24 : 32"
          :rules="rules"
          class="primary--placeholder align-center"
          :class="{
            'py-1': !noPadding,
            'remove-outline': !isOutlined,
            'outline--current': focus,
            'outline--error': !!errorMessage,
            'input--unit': !!unit,
            'input--dense': isDense,
            'input--not-dense': !isDense,
            'file-border-bottom':
              inputComponent === 'VFileInput' &&
              !focus &&
              !hover &&
              !errorMessage,
          }"
        >
          <template #append>
            <slot name="append">{{ unit }}</slot>
          </template>
        </component>
      </template>
    </VcsTooltip>
  </div>
</template>

<style lang="scss" scoped>
  .primary--placeholder {
    ::v-deep {
      input::placeholder {
        color: var(--v-primary-base);
        font-style: italic;
        opacity: 1;
      }
    }
  }
  .remove-outline {
    ::v-deep {
      fieldset {
        border-width: 0;
        border-radius: 0;
      }
    }
  }
  .outline--current {
    ::v-deep {
      .v-input__slot fieldset {
        border-color: currentColor;
        transition: border-color 0.5s ease;
      }
      .v-text-field__slot input {
        border-color: transparent;
      }
    }
  }
  .outline--error {
    ::v-deep {
      .v-input__slot fieldset,
      .v-text-field__slot input {
        border-color: var(--v-error-base);
      }
    }
  }
  .input--unit {
    ::v-deep {
      .v-text-field__slot input {
        text-align: right;
        padding-right: 3px;
      }
      .v-input__append-inner {
        margin-top: 6px !important;
      }
    }
  }
  .input--dense {
    ::v-deep {
      .v-text-field__slot input {
        height: 24px;
      }
      .v-input__slot {
        padding: 0 4px !important;
      }
      fieldset {
        padding-left: 2px;
      }
    }
  }
  .input--not-dense {
    ::v-deep {
      .v-input__slot {
        padding: 0 8px !important;
      }
      fieldset {
        padding-left: 6px;
      }
    }
  }
  .file-border-bottom {
    ::v-deep {
      .v-file-input__text {
        border-bottom: 1px solid var(--v-base-base);
        border-radius: 0;
      }
    }
  }
  .v-input {
    ::v-deep {
      input {
        height: 32px;
        border-bottom: 1px solid var(--v-base-base);
        border-radius: 0;
      }
      input::selection {
        background-color: var(--v-primary-base);
      }
      .v-text-field__prefix {
        padding-right: 8px;
      }
      .v-text-field__suffix {
        padding-left: 4px;
      }
      .v-input__prepend-outer {
        margin-right: 4px;
      }
      .v-icon {
        font-size: 16px;
      }
      .v-text-field--rounded fieldset {
        border-radius: 2px;
        border-color: var(--v-base-base);
      }
    }
  }
</style>

<script>
  import { computed, onMounted, ref } from 'vue';
  import { VTextField, VFileInput } from 'vuetify/lib';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import { useErrorSync } from './composables.js';

  /**
   * @description extends API of {@link https://vuetifyjs.com/en/api/v-text-field v-text-field}.
   * Provides two height options depending on "dense" property:
   * - if dense is set true (default), height is 24 px
   * - if dense is set false, height is 32 px
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
   * @vue-computed {boolean}                            isDense - Whether size of textfield is dense.
   * @vue-computed {boolean}                            isOutlined - Textfield is outlined on either hover, focus or error, if not disabled.
   * @vue-computed {string | number}                    visibleValue - Returns the number input as string with unit, in case unit is provided.
   * @vue-computed {string}                             type - The input field type. If number input field is blurred and unit is provided, type changes to text field, so unit can be displayed in input field.
   */
  export default {
    name: 'VcsTextField',
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
            Number.isFinite(attrs.value) &&
            props.decimals >= 0
          ) {
            return parseFloat(attrs.value.toFixed(props.decimals));
          }
          return attrs.value ?? '';
        },
        set(value) {
          if (attrs.type === 'file') {
            emit('input', value);
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

      function onEscape(event) {
        textFieldRef.value.blur();
        emit('input', textFieldRef.value.initialValue);
        emit('keydown', event);
      }

      function onBlur(event) {
        focus.value = false;
        emit('blur', event);
      }
      function onFocus(event) {
        focus.value = true;
        emit('focus', event);
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
