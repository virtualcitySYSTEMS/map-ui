<template>
  <v-checkbox
    ref="checkbox"
    true-icon="$vcsCheckboxChecked"
    false-icon="$vcsCheckbox"
    indeterminate-icon="$vcsCheckboxIndeterminate"
    :hide-details="false"
    class="vcs-checkbox"
    :class="{
      'py-1': !paddingProvided,
    }"
    v-bind="$attrs"
  >
    <template #label="scope">
      <slot name="label" v-bind="scope ?? {}">{{ $st($attrs.label) }}</slot>
    </template>
    <template v-for="slot of forwardSlots" #[slot]="scope">
      <slot :name="slot" v-bind="scope ?? {}" />
    </template>
    <template #message="scope">
      <v-tooltip
        ref="errorTooltip"
        :activator="checkbox"
        v-if="scope?.message"
        :text="$st(scope?.message)"
        content-class="bg-error"
        :location="tooltipPosition"
      />
      <slot name="message" v-bind="scope ?? {}"></slot>
    </template>
    <v-tooltip
      v-if="tooltip && !errorTooltip"
      :activator="checkbox"
      :location="tooltipPosition"
      :text="$st(tooltip)"
    ></v-tooltip>
  </v-checkbox>
</template>
<style lang="scss" scoped>
  :deep(.v-icon--size-default) {
    font-size: calc(var(--v-vcs-font-size) * (1.2 + 0.1 / 3));
  }
  .v-input--density-compact :deep(.v-selection-control) {
    --v-selection-control-size: calc(
      var(--v-vcs-font-size) * (1.2 + 0.1 / 3) + 4
    );
    --v-input-control-height: calc(var(--v-vcs-font-size) + 3px);
  }
  :deep(.v-input__control) {
    height: calc(var(--v-vcs-font-size) * 2 - 2px);
  }
  // remove ripple effect
  :deep(.v-selection-control__input::before) {
    background-color: transparent;
  }
  // remove details
  :deep(.v-input__details) {
    display: none;
  }
</style>
<script>
  import { ref } from 'vue';
  import { VCheckbox, VTooltip } from 'vuetify/components';
  import { useForwardSlots, usePadding } from '../composables.js';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-checkbox/ |vuetify checkbox}.
   * Provides VTooltip to show error messages
   * @vue-prop {string} [tooltip] - A message to be displayed when there is no error.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip, see {@link https://vuetifyjs.com/en/api/v-tooltip/#props-location | vuetify tooltip}.
   * @vue-prop {string} label - Label to be displayed, will be translated.
   * @vue-data {slot} [#label] - slot to pass html for Checkbox label. Overrides label passed as prop.
   */
  export default {
    name: 'VcsCheckbox',
    inheritAttrs: true,
    components: {
      VTooltip,
      VCheckbox,
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
      const checkbox = ref();
      const errorTooltip = ref();
      const paddingProvided = usePadding(attrs);
      const forwardSlots = useForwardSlots(slots, ['label', 'message']);
      return {
        forwardSlots,
        paddingProvided,
        checkbox,
        errorTooltip,
      };
    },
  };
</script>
