<template>
  <v-radio-group v-bind="{ ...$attrs }" ref="radioGroup">
    <v-radio
      v-for="(item, idx) in items"
      :id="`${$.uid}-${idx}`"
      :key="`${$.uid}-${idx}`"
      :value="item[itemValue] ?? item"
      :disabled="$attrs.disabled ?? item.disabled ?? false"
      :color="item?.color ?? undefined"
      :error="!!errorTooltip"
      :class="{
        'flex-column': labelPosition !== 'right',
        'label-top': labelPosition === 'top',
      }"
    >
      <template #label>
        <slot name="label" :item="item" :error="!!errorTooltip">
          <span :html-for="`${$.uid}-${idx}`">
            {{ $st(item.label ?? item) }}
          </span>
        </slot>
      </template>
    </v-radio>
    <template #message="{ message }">
      <v-tooltip
        ref="errorTooltip"
        :activator="radioGroup"
        :model-value="true"
        v-if="message"
        :text="$st(message)"
        content-class="bg-error"
        :location="tooltipPosition"
      />
    </template>
    <v-tooltip
      v-if="tooltip && !errorTooltip"
      :activator="radioGroup"
      :location="tooltipPosition"
      :text="$st(tooltip)"
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
  // switch input and label order
  :deep(.label-top > .v-selection-control__wrapper) {
    order: 2;
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
   * @vue-prop {string} [item-value='value'] - The value used when the component is selected in a group.
   * @vue-prop {string} [tooltip] - A message to be displayed when there is no error.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip, see {@link https://vuetifyjs.com/en/api/v-tooltip/#props-location | vuetify tooltip}.
   * @vue-data {slot} [#top-label] - A slot to render a label on top of the radio button, e.g. using <img> or <v-icon>. Passes item and error as props
   * @vue-data {slot} [#label] - A slot to render a label. Passes item and error as props.
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
      itemValue: {
        type: String,
        default: 'value',
      },
      tooltip: {
        type: String,
        default: undefined,
      },
      tooltipPosition: {
        type: String,
        default: 'right',
      },
      labelPosition: {
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
