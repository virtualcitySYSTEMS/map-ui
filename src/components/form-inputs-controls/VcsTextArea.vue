<template>
  <v-textarea
    ref="textAreaRef"
    variant="outlined"
    clear-icon="$close"
    :rows="$attrs.rows"
    class="primary--placeholder"
    :class="{
      'py-1': !paddingProvided,
    }"
    v-bind="{ ...$attrs }"
  >
    <template v-for="slot of Object.keys($slots)" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
    <template #message="{ message }">
      <v-tooltip
        ref="errorTooltipRef"
        :activator="textAreaRef"
        v-if="message"
        :text="$st(message)"
        content-class="bg-error"
        :location="tooltipPosition"
      />
    </template>
    <template #append-inner>
      <slot name="append-inner"></slot>
      <v-tooltip
        v-if="tooltip && !errorTooltipRef"
        :activator="textAreaRef"
        :location="tooltipPosition"
        :text="$st(tooltip)"
      ></v-tooltip>
    </template>
  </v-textarea>
</template>

<style lang="scss" scoped>
  .v-input--density-compact :deep(.v-field) {
    --v-input-control-height: calc(var(--v-vcs-item-height) - 8px);
    --v-field-padding-bottom: 0px;
    --v-field-input-padding-top: 0px;
    --v-input-padding-top: 0px;
  }

  :deep(.v-field) {
    --v-field-padding-start: 8px;
    --v-field-padding-end: 8px;
    padding-left: 8px;
    padding-right: 8px;
    .v-field__clearable {
      margin: 4px -4px 0px 0px;
    }
  }

  :deep(.v-field__field) {
    padding-bottom: 2px;
    padding-top: 2px;
  }

  :deep(.v-field__input) {
    padding: 0;
    // remove white fade out on top
    mask-image: none !important;
    -webkit-mask-image: none !important;
  }

  // set the border color on focused to primary, but not on error
  :deep(.v-field--focused:not(.v-field--error) .v-field__outline *) {
    border-color: rgb(var(--v-theme-primary));
  }

  :deep(.v-field--focused .v-field__outline__end) {
    border-width: 1px 1px 1px 0 !important;
  }
  :deep(.v-field--focused .v-field__outline__start) {
    border-width: 1px 0 1px 1px !important;
  }

  // remove outline, if not focused, hovered or an error
  :deep(.v-field:not(.v-field--focused):not(.v-field--error):not(:hover)) {
    .v-field__outline * {
      border-width: 0 0 0 0;
      border-radius: 0;
    }
    .v-field__outline__end {
      border-width: 0 0 1px 0 !important;
      border-radius: 0;
      margin-right: 8px;
      margin-left: -4px;
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
  :deep(.v-field .v-field--focused .v-field--error):hover {
    border-width: 1px !important;
  }
  // Not color, just used if label is given
  :deep(.v-field--focused:not(.v-field--error) .v-field__outline *::after) {
    border-color: rgb(var(--v-theme-primary));
    border-width: 1px !important;
  }

  // remove margin from prepended Icon
  .v-input--horizontal :deep(.v-input__prepend) {
    margin-inline-end: 4px;
  }

  .primary--placeholder {
    :deep(textarea::placeholder) {
      color: rgb(var(--v-theme-primary));
      font-style: italic;
      opacity: 1;
      padding: 0 3px 0 0;
    }
    :deep(textarea::-moz-placeholder) {
      font-style: initial;
    }
  }

  // remove details
  :deep(.v-input__details) {
    display: none;
  }

  // Progress Bar
  :deep(.v-progress-linear) {
    color: rgb(var(--v-theme-primary));
  }
  :deep(.v-field__loader) {
    top: calc(100% - 2px);
  }
</style>

<script>
  import { ref } from 'vue';
  import { VTextarea, VTooltip } from 'vuetify/components';
  import { usePadding } from '../composables.js';

  /**
   * @description extends API of {@link https://vuetifyjs.com/en/api/v-textarea/|vuetify v-textarea}.
   * Default for number of rows can be overwritten using the vuetify API.
   * Provides VcsTooltip to
   * - show error messages on focus
   * - show tooltips, if no error messages are available
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {string|undefined}                       tooltip - Optional tooltip which will be shown on hover when no error message is shown
   */
  export default {
    name: 'VcsTextArea',
    components: {
      VTooltip,
      VTextarea,
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
    },
    setup(_p, { attrs }) {
      const textAreaRef = ref();
      const errorTooltipRef = ref();

      const paddingProvided = usePadding(attrs);

      return {
        textAreaRef,
        errorTooltipRef,
        paddingProvided,
      };
    },
  };
</script>
