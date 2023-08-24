<template>
  <div @mouseover="hover = true" @mouseleave="hover = false">
    <VcsTooltip
      :tooltip-position="tooltipPosition"
      :tooltip="errorMessage"
      color="error"
      :max-width="200"
    >
      <template #activator="{ attrs, on }">
        <v-combobox
          ref="comboBoxRef"
          :items="items"
          v-model="localValue"
          multiple
          outlined
          hide-details
          single-line
          :dense="isDense"
          :clearable="isClearable"
          @focus="onFocus"
          @blur="onBlur"
          @keydown.esc="onEscape"
          @keydown="$emit('keydown', $event)"
          v-bind="{ ...$attrs, ...attrs }"
          v-on="{ ...on }"
          append-icon="mdi-chevron-down"
          class="py-1 primary--placeholder align-center"
          :class="{
            'remove-outline': !isOutlined,
            'outline--current': focus,
            'outline--error': !!errorMessage,
            'input--dense': isDense,
            'input--not-dense': !isDense,
          }"
        >
          <template #append v-if="items.length === 0"><p /></template>
          <template #selection="{ item, index, parent }" v-if="!noChips">
            <v-chip
              v-bind="{ ...$attrs, ...attrs }"
              :small="smallChips !== false"
              :close="deletableChips !== false"
              @click="select(item, index, parent)"
              @click:close="remove(index)"
              class="pa-2"
            >
              <span class="text-truncate d-inline-block">{{ item }}</span>
            </v-chip>
          </template>
        </v-combobox>
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
      .v-select__selections {
        row-gap: 4px;
        padding-top: 4px;
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
  ::v-deep {
    .v-autocomplete:not(.v-input--is-focused).v-select--chips input {
      max-height: unset;
    }
  }
</style>

<script>
  import { computed, onMounted, ref } from 'vue';
  import { VCombobox, VChip } from 'vuetify/lib';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import { useErrorSync } from './composables.js';

  /**
   * @description extends API of {@link https://vuetifyjs.com/en/api/v-combobox v-combobox}.
   * Renders elements of an array as chips with an input field to edit or add new elements.
   * Provides VcsTooltip to
   * - show error messages on focus
   * - show tooltips, if supplied, when hovered over append-icon
   * When clicking esc key, previous input is restored.
   *
   * Limitation: Only supports unique values.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {Array<*>}                               [items] - Optional input options for dropdown
   * @vue-prop {string}                                 [type] - The input type (string or number)
   * @vue-prop {boolean}                                [smallChips=true]
   * @vue-prop {boolean}                                [deletableChips=true] - Adds a delete button to elements to remove them from array
   * @vue-prop {boolean}                                [noChips=false] - Removes chips for a more compact variant
   * @vue-computed {boolean}                            isClearable - Whether input field is isClearable. Makes sure icon is only shown on focus, hover or error.
   * @vue-computed {boolean}                            isDense - Whether size of input field is dense.
   * @vue-computed {boolean}                            isOutlined - Input field is outlined on either hover, focus or error, if not disabled.
   * @vue-computed {Array<string|number>}               localValue - Returns the number input as string with unit, in case unit is provided.
   */
  export default {
    name: 'VcsChipArrayInput',
    components: {
      VcsTooltip,
      VCombobox,
      VChip,
    },
    props: {
      tooltipPosition: {
        type: String,
        default: 'right',
      },
      items: {
        type: Array,
        default: () => [],
      },
      smallChips: {
        type: Boolean,
        default: true,
      },
      deletableChips: {
        type: Boolean,
        default: true,
      },
      noChips: {
        type: Boolean,
        default: false,
      },
    },
    setup(props, { attrs, emit }) {
      const hover = ref(false);
      const focus = ref(false);
      const comboBoxRef = ref();

      onMounted(() => {
        // fix for autofocus
        focus.value = attrs.autofocus != null;
      });

      const errorMessage = useErrorSync(comboBoxRef);
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
      const localValue = computed({
        get() {
          return attrs.value;
        },
        set(value) {
          if (attrs.type === 'number') {
            emit(
              'input',
              value.map((v) => parseFloat(v)),
            );
          } else {
            emit('input', value);
          }
          // emit is not needed, the vuetify component already emits an @input event. (forwarded listeners)
          // emit('input', event);
        },
      });

      function onEscape(event) {
        comboBoxRef.value.blur();
        emit('input', comboBoxRef.value.initialValue);
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

      function select(item, index, parent) {
        parent.editingIndex = index;
        parent.internalSearch = parent.getText(item);
        parent.selectedIndex = -1;
      }

      function remove(index) {
        localValue.value.splice(index, 1);
      }

      return {
        hover,
        focus,
        isClearable,
        isDense,
        isOutlined,
        localValue,
        onEscape,
        comboBoxRef,
        errorMessage,
        onBlur,
        onFocus,
        select,
        remove,
      };
    },
  };
</script>
