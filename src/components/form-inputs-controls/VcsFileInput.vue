<template>
  <v-file-input
    ref="fileInputRef"
    variant="outlined"
    clear-icon="$close"
    :hide-details="false"
    color="primary vcs-file-input"
    class="primary--placeholder"
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
        :activator="fileInputRef"
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
        :activator="fileInputRef"
        v-if="tooltip && !errorTooltipRef"
        :text="$st(tooltip)"
        :location="tooltipPosition"
      />
    </template>
  </v-file-input>
</template>

<style lang="scss" scoped>
  @use './vcsTextField.scss';

  // set text overflow for file input
  :deep(.v-field__input) {
    display: unset;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: calc(var(--v-vcs-font-size) * 2 - 3px);
  }
</style>

<script>
  import { ref } from 'vue';
  import { VFileInput, VTooltip } from 'vuetify/components';
  import { getForwardSlots, usePadding } from '../composables.js';

  /**
   * @description extends API of {@link https://vuetifyjs.com/en/api/v-file-input v-text-field}.
   * Provides a tooltip to
   * - show error messages on focus
   * - show tooltips, if supplied, when hovered over append-icon
   * When clicking esc key, previous input is restored.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the tooltip.
   * @vue-prop {string|undefined}                       tooltip - Optional tooltip which will be shown on hover when no error message is shown
   */
  export default {
    name: 'VcsTextField',
    inheritAttrs: false,
    components: {
      VTooltip,
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
    },
    setup(props, { attrs, slots }) {
      const fileInputRef = ref();
      const errorTooltipRef = ref();

      const paddingProvided = usePadding(attrs);
      const forwardSlots = getForwardSlots(slots, ['append-inner', 'message']);

      return {
        forwardSlots,
        paddingProvided,
        fileInputRef,
        errorTooltipRef,
      };
    },
  };
</script>
