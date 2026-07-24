<template>
  <v-radio-group
    ref="radioGroup"
    class="vcs-radio"
    :class="{
      'py-1': !paddingProvided,
    }"
    v-bind="$attrs"
  >
    <v-radio
      v-for="(item, idx) in items"
      :id="`${cid}-${idx}`"
      :key="`${cid}-${idx}`"
      :value="
        typeof item === 'object'
          ? ((item as Record<string, unknown>)[itemValue] ?? item)
          : item
      "
      :disabled="
        ($attrs.disabled as boolean | undefined) ??
        (typeof item === 'object'
          ? (((item as Record<string, unknown>).disabled as
              | boolean
              | undefined) ?? false)
          : false)
      "
      :color="
        typeof item === 'object'
          ? ((item?.color as string | undefined) ?? undefined)
          : undefined
      "
      :error="!!errorTooltip"
      class="pa-0"
      :class="{
        'flex-column': labelPosition !== 'right',
        'label-top': labelPosition === 'top',
      }"
    >
      <template #label>
        <slot name="label" :item="item" :error="!!errorTooltip">
          <span :html-for="`${cid}-${idx}`">
            {{ $st(getItemLabel(item)) }}
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

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent, ref } from 'vue';
  import { VRadio, VRadioGroup, VTooltip } from 'vuetify/components';
  import { useComponentId, usePadding } from '../composables.js';

  export type VcsRadioItem = {
    label: string;
    /** @default 'secondary' */
    color?: string;
    value: string | number | boolean;
    /** @default false */
    disabled?: boolean;
  };

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
  export default defineComponent({
    name: 'VcsRadio',
    components: {
      VTooltip,
      VRadioGroup,
      VRadio,
    },
    inheritAttrs: false,
    props: {
      items: {
        type: Array as PropType<
          Array<
            | string
            | VcsRadioItem
            | Record<string, string | number | boolean | undefined>
          >
        >,
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
        type: String as PropType<'bottom' | 'left' | 'top' | 'right'>,
        default: 'right',
      },
      labelPosition: {
        type: String,
        default: 'right',
      },
    },
    setup(props, { attrs }) {
      const radioGroup = ref();
      const errorTooltip = ref();
      const paddingProvided = usePadding(attrs);
      const cid = useComponentId();

      return {
        paddingProvided,
        radioGroup,
        errorTooltip,
        cid,
        getItemLabel(
          item: Record<string, unknown> | string | number | boolean,
        ): string {
          if (typeof item === 'object' && item !== null) {
            return (
              (item.label as string | undefined) ??
              String(item[props.itemValue])
            );
          }
          return String(item);
        },
      };
    },
  });
</script>

<style lang="scss" scoped>
  .v-input--density-compact :deep(.v-selection-control) {
    --v-selection-control-size: calc(var(--v-vcs-font-size) * 2 - 2px);
    --v-input-control-height: calc(var(--v-vcs-font-size) + 3px);
  }
  // remove ripple effect
  :deep(.v-selection-control__input::before) {
    background-color: transparent;
  }
  :deep(.v-icon--size-default) {
    font-size: calc(var(--v-vcs-font-size) + 3px);
    padding-right: 2px;
  }
  // remove details
  :deep(.v-input__details) {
    display: none;
  }
  // switch input and label order
  :deep(.label-top > .v-selection-control__wrapper) {
    order: 2;
  }
  :deep(.v-selection-control-group) {
    row-gap: 8px;
    column-gap: 8px;
  }
</style>
