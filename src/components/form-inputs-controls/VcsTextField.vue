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
          :value="visibleValue"
          :type="type"
          outlined
          v-bind="{ ...$attrs, ...attrs }"
          v-on="{ ...$listeners, ...on }"
          :height="isDense ? 24 : 32"
          class="py-1 primary--placeholder align-center"
          :class="{
            'remove-outline': !isOutlined,
            'outline--current': focus,
            'outline--error': !!errorMessage,
            'input--dense': isDense,
            'input--not-dense': !isDense,
            'file-border-bottom':
              inputComponent === 'VFileInput' &&
              !focus &&
              !hover &&
              !errorMessage,
          }"
        />
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
      fieldset {
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
   * @vue-prop {boolean}                                showSpinButtons - If true, spin buttons are displayed in number input fields. Overrides Vuetify hide-spin-buttons.
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
      showSpinButtons: {
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
      const visibleValue = computed(() => {
        if (
          attrs.type === 'number' &&
          attrs.value &&
          props.unit &&
          !focus.value &&
          !hover.value
        ) {
          return `${attrs.value} ${props.unit}`;
        } else {
          return attrs.value || '';
        }
      });
      const type = computed(() => {
        if (attrs.type === 'number' && !focus.value) {
          return 'text';
        } else {
          return attrs.type || 'text';
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
        onEscape,
        textFieldRef,
        errorMessage,
        onBlur,
        onFocus,
      };
    },
  };
</script>
