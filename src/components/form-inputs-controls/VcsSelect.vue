<template>
  <v-select
    menu-icon="mdi-chevron-down"
    :multiple="multiple"
    variant="outlined"
    ref="selectFieldRef"
    :menu-props="{ origin: 'overlap' }"
    :item-title="(item) => $st(getTitle(item))"
    color="primary"
    class="primary--placeholder vcs-select"
    :class="{
      'py-1': !paddingProvided,
    }"
    v-bind="$attrs"
    v-model="localModelValue"
  >
    <template #selection="{ item, index }">
      <span v-if="index === 0" class="text-truncate w-100">
        {{ $st(getTitle(item.raw)) }}
      </span>
      <span v-if="index === 1" class="text-no-wrap">
        (+{{ additionalItems }})
      </span>
    </template>

    <template #append-inner="scope">
      <slot name="append-inner" v-bind="scope ?? {}"></slot>
      <v-tooltip
        :activator="selectFieldRef"
        v-if="tooltip && !errorTooltipRef"
        :text="$st(tooltip)"
        :location="tooltipPosition"
      />
    </template>
    <template v-for="slot of forwardSlots" #[slot]="scope">
      <slot :name="slot" v-bind="scope ?? {}" />
    </template>
    <template #message="scope">
      <v-tooltip
        :activator="selectFieldRef"
        ref="errorTooltipRef"
        v-if="scope?.message"
        :text="$st(scope?.message)"
        content-class="bg-error"
        :location="tooltipPosition"
      />
      <slot name="message" v-bind="scope ?? {}"></slot>
    </template>
    <template #item="itemScope">
      <slot name="item" v-bind="itemScope ?? {}">
        <v-list-item density="compact" v-bind="itemScope.props" role="option">
          <template #prepend="prependScope" v-if="multiple">
            <VcsCheckbox
              v-model="prependScope.isSelected"
              class="py-0"
            ></VcsCheckbox>
          </template>
        </v-list-item>
      </slot>
    </template>
  </v-select>
</template>
<style lang="scss" scoped>
  :deep(.v-field) {
    --v-field-padding-start: 4px;
    --v-field-padding-end: 4px;
  }
  :deep(.v-field__input) {
    flex-wrap: unset;
    padding-right: calc(var(--v-vcs-font-size) * 2 + 2px);
    > input {
      align-self: auto !important;
    }
  }
  .v-input--density-compact :deep(.v-field) {
    --v-input-control-height: calc(var(--v-vcs-font-size) * 2 - 2px);
    --v-field-padding-bottom: 0px;
    --v-field-input-padding-top: 0px;
    --v-input-padding-top: 0px;
  }
  :deep(.v-field--focused .v-field__outline *) {
    --v-field-border-width: 1px;
  }
  // set the border color on focused to primary, but not on error
  :deep(.v-field--focused:not(.v-field--error) .v-field__outline *) {
    border-color: rgb(var(--v-theme-primary));
  }
  // Not color, just used if label is given
  :deep(.v-field--focused:not(.v-field--error) .v-field__outline *::after) {
    border-color: rgb(var(--v-theme-primary));
  }
  // remove outline, if not focused, hovered or an error
  :deep(.v-field:not(.v-field--focused):not(.v-field--error):not(:hover)) {
    .v-field__outline * {
      border-width: 0 0 1px 0;
      border-radius: 0;
    }
    .v-field__outline {
      padding-left: 4px;
      padding-right: 4px;
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
  :deep(.v-field--appended) {
    padding-inline-end: 4px;
    .v-field__append-inner {
      i {
        margin-left: 0;
      }
    }
  }
  .primary--placeholder {
    :deep(input::placeholder) {
      color: rgb(var(--v-theme-primary));
      opacity: 1;
      font-style: italic !important;
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
  import { VSelect, VTooltip, VListItem } from 'vuetify/components';
  import { computed, ref } from 'vue';
  import { useForwardSlots, usePadding } from '../composables.js';
  import VcsCheckbox from './VcsCheckbox.vue';
  import { useProxiedComplexModel } from '../modelHelper.js';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-select/ |vuetify select}.
   * Translates the items text if it is an i18n string.
   * Provides VTooltip to show error messages
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {string|undefined} tooltip - Optional tooltip which will be shown on hover when no error message is shown
   * @vue-prop {Function} itemText - A function that is applied to each item and should return the item's text value.
   * @vue-prop {boolean} multiple - allows selecting several values instead of just one
   */
  export default {
    name: 'VcsSelect',
    components: {
      VSelect,
      VTooltip,
      VListItem,
      VcsCheckbox,
    },
    props: {
      multiple: {
        type: Boolean,
        default: false,
      },
      modelValue: {
        type: [Array, String, Boolean, Number],
        default(rawProps) {
          if (rawProps.multiple) {
            return [];
          }
          return '';
        },
      },
      tooltip: {
        type: String,
        default: undefined,
      },
      tooltipPosition: {
        type: String,
        default: 'right',
      },
      itemText: {
        type: Function,
        default: undefined,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { attrs, slots, emit }) {
      const selectFieldRef = ref();
      const errorTooltipRef = ref();
      const localModelValue = useProxiedComplexModel(props, 'modelValue', emit);

      const additionalItems = computed(() => {
        if (Array.isArray(localModelValue.value)) {
          return localModelValue.value.length - 1;
        }
        return 0;
      });

      function getTitle(item) {
        if (props.itemText) {
          return props.itemText(item);
        } else {
          return item?.title ?? item;
        }
      }
      const isMultiple = computed(() => {
        return props.multiple;
      });
      const paddingProvided = usePadding(attrs);
      const forwardSlots = useForwardSlots(slots, ['append-inner', 'message']);

      return {
        forwardSlots,
        localModelValue,
        additionalItems,
        isMultiple,
        paddingProvided,
        selectFieldRef,
        errorTooltipRef,
        getTitle,
      };
    },
  };
</script>
