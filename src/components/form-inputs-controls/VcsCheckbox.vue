<template>
  <v-checkbox
    ref="checkbox"
    :model-value="$attrs.value"
    true-icon="$vcsCheckboxChecked"
    false-icon="$vcsCheckbox"
    indeterminate-icon="$vcsCheckboxIndeterminate"
    :hide-details="false"
    v-bind="{ ...$attrs }"
  >
    <template #label>
      <slot name="label" />
      <template v-if="!$slots.label">{{ $st($attrs.label) }}</template>
    </template>
    <template #message="{ message }">
      <v-tooltip
        ref="errorTooltip"
        :activator="checkbox"
        v-if="message"
        :text="message"
        content-class="bg-error"
        :location="tooltipPosition"
      />
    </template>
    <v-tooltip
      v-if="tooltip && !errorTooltip"
      :activator="checkbox"
      :location="tooltipPosition"
      :text="tooltip"
    ></v-tooltip>
  </v-checkbox>
</template>
<style lang="scss" scoped>
  .v-input--density-compact :deep(.v-selection-control) {
    --v-selection-control-size: calc(var(--v-vcs-item-height) - 8px);
    --v-input-control-height: calc(var(--v-vcs-item-height) - 16px);
    padding: 4px 0;
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

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-checkbox/ |vuetify checkbox}.
   * Provides VTooltip to show error messages
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
    setup() {
      const checkbox = ref();
      const errorTooltip = ref();

      return {
        checkbox,
        errorTooltip,
      };
    },
  };
</script>
