<template>
  <v-file-input
    ref="fileInputRef"
    variant="outlined"
    clear-icon="$close"
    :hide-details="false"
    class="primary--placeholder"
    :class="{
      'py-1': !paddingProvided,
    }"
    v-bind="$attrs"
  >
    <template #message="{ message }">
      <v-tooltip
        ref="errorTooltipRef"
        :activator="fileInputRef"
        v-if="message"
        :text="$st(message)"
        content-class="bg-error"
        :location="tooltipPosition"
      />
    </template>
    <template #append-inner>
      <slot name="append-inner"></slot>
      <v-tooltip
        :activator="fileInputRef"
        v-if="tooltip && !errorTooltipRef"
        :text="$st(tooltip)"
        :location="tooltipPosition"
      />
    </template>
    <template
      v-for="slot of Object.keys($slots).filter(
        (name) => name !== 'append-inner',
      )"
      #[slot]="scope"
    >
      <slot :name="slot" v-bind="scope" />
    </template>
  </v-file-input>
</template>

<style lang="scss" scoped>
  @import './vcsTextField.scss';

  // set text overflow for file input
  :deep(.v-field__field) {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>

<script>
  import { ref } from 'vue';
  import { VFileInput, VTooltip } from 'vuetify/components';
  import { usePadding } from '../composables.js';

  /**
   * @description extends API of {@link https://vuetifyjs.com/en/api/v-file-input v-text-field}.
   * Provides VcsTooltip to
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
    setup(props, { attrs }) {
      const fileInputRef = ref();
      const errorTooltipRef = ref();

      const paddingProvided = usePadding(attrs);

      return {
        paddingProvided,
        fileInputRef,
        errorTooltipRef,
      };
    },
  };
</script>
