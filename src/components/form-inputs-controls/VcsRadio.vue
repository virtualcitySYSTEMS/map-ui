<template>
  <v-radio-group
    ref="radioGroup"
    :model-value="$attrs.value"
    v-bind="{ ...$attrs }"
  >
    <v-radio
      v-for="(item, idx) in items"
      :id="`radio-${idx}`"
      :key="`radio-${idx}`"
      :value="item.value ?? item"
      :disabled="item.disabled ?? false"
      :color="item?.color ?? undefined"
      :error="!!errorTooltip"
    >
      <template #label>{{ $st(item.label ?? item) }}</template>
    </v-radio>
    <template #message="{ message }">
      <v-tooltip
        ref="errorTooltip"
        :activator="radioGroup"
        :model-value="true"
        v-if="message"
        :text="message"
        content-class="bg-error"
        :location="tooltipPosition"
      />
    </template>
    <v-tooltip
      v-if="tooltip && !errorTooltip"
      :activator="radioGroup"
      :location="tooltipPosition"
      :text="tooltip"
    ></v-tooltip>
  </v-radio-group>
</template>
<style lang="scss" scoped>
  .v-input--density-compact :deep(.v-selection-control) {
    --v-selection-control-size: calc(var(--v-vcs-item-height) - 8px);
    --v-input-control-height: calc(var(--v-vcs-item-height) - 16px);
    padding: 4px;
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
  import { VRadio, VRadioGroup, VTooltip } from 'vuetify/components';

  /**
   * @typedef {Object} VcsRadioItem
   * @property {string} label
   * @property {string} [color='secondary']
   * @property {any} value
   * @property {boolean} [disabled=false]
   */

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-radio-group/ |vuetify v-radio-group} using
   * {@link https://vuetifyjs.com/en/api/v-radio/ |vuetify v-radio}.
   * Provides VTooltip to show passed messages and error messages.
   * @vue-prop {Array<string|VcsRadioItem>} items - A list of options. If strings are provided, the string is used as label and value.
   * @vue-prop {string} tooltip - A message to be displayed when there is no error.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip, see {@link https://vuetifyjs.com/en/api/v-tooltip/#props-location | vuetify tooltip}.
   */
  export default {
    name: 'VcsRadio',
    inheritAttrs: false,
    components: {
      VTooltip,
      VRadioGroup,
      VRadio,
    },
    props: {
      items: {
        type: Array,
        required: true,
      },
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
      const radioGroup = ref();
      const errorTooltip = ref();

      return {
        radioGroup,
        errorTooltip,
      };
    },
  };
</script>
