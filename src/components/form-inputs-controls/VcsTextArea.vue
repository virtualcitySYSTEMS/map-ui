<template>
  <v-textarea
    ref="textAreaRef"
    variant="outlined"
    clear-icon="$close"
    :rows="$attrs.rows"
    color="primary"
    class="primary--placeholder vcs-text-area"
    :class="{
      'py-1': !paddingProvided,
    }"
    v-bind="$attrs"
  >
    <template v-for="slot of forwardSlots" #[slot]="scope">
      <slot :name="slot" v-bind="scope ?? {}" />
    </template>
    <template #message="scope">
      <v-tooltip
        ref="errorTooltipRef"
        :activator="textAreaRef"
        v-if="scope?.message"
        :text="$st(scope?.message)"
        content-class="bg-error"
        :location="tooltipPosition"
      />
      <slot name="message" v-bind="scope ?? {}"></slot>
    </template>
    <template #append-inner="scope">
      <slot name="append-inner" v-bind="scope ?? {}"></slot>
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
    --v-input-control-height: calc(var(--v-vcs-font-size) * 2 - 2px);
    --v-field-padding-bottom: 0px;
    --v-field-input-padding-top: 0px;
    --v-input-padding-top: 0px;
  }

  :deep(.v-field) {
    --v-field-padding-start: 4px;
    --v-field-padding-end: 4px;
    padding-left: 4px;
    padding-right: 4px;
    .v-field__clearable {
      margin: 2px -2px 0px 0px;
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
      margin-right: 4px;
      margin-left: -8px;
    }
    .v-field__loader {
      padding-left: 3px;
      padding-right: 3px;
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
    border-width: 0 0 1px !important;
  }

  // remove margin from prepended Icon
  .v-input--horizontal :deep(.v-input__prepend) {
    margin-inline-end: 4px;
  }

  .primary--placeholder {
    :deep(textarea::placeholder) {
      color: rgb(var(--v-theme-primary));
      font-style: italic !important;
      opacity: 1;
      padding: 0 3px 0 0;
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
  import { ref } from 'vue';
  import { VTextarea, VTooltip } from 'vuetify/components';
  import { getForwardSlots, usePadding } from '../composables.js';

  /**
   * @description extends API of {@link https://vuetifyjs.com/en/api/v-textarea/|vuetify v-textarea}.
   * Default for number of rows can be overwritten using the vuetify API.
   * Provides a tooltip to
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
    setup(_p, { attrs, slots }) {
      const textAreaRef = ref();
      const errorTooltipRef = ref();

      const paddingProvided = usePadding(attrs);
      const forwardSlots = getForwardSlots(slots, ['append-inner', 'message']);

      return {
        forwardSlots,
        textAreaRef,
        errorTooltipRef,
        paddingProvided,
      };
    },
  };
</script>
