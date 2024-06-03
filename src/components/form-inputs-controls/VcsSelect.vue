<template>
  <div>
    <VcsTooltip
      :tooltip-position="tooltipPosition"
      :tooltip="errorMessage"
      color="error"
      :max-width="200"
    >
      <template #activator="{ props }">
        <span v-bind="props">
          <v-select
            ref="selectField"
            menu-icon="mdi-chevron-down"
            hide-details
            flat
            variant="outlined"
            :density="density"
            close-on-select
            :menu-props="{ origin: 'overlap' }"
            :item-title="(item) => $st(getTitle(item))"
            class="primary--placeholder CCCalign-center"
            :class="{
              'remove-outline': !isOutlined,
              'input--dense': isDense,
              'input--not-dense': !isDense,
              'outline--current': focus,
              'outline--error': !!errorMessage,
            }"
            v-bind="{ ...$attrs, ...props }"
            @focus="focus = true"
            @blur="focus = false"
            @mouseover="hover = true"
            @mouseleave="hover = false"
          >
            <template #selection="{ item, index }">
              <!-- XXX text-truncate seems not to be working: text is rendered on two lines when too long -->
              <span v-if="index === 0" class="text-truncate w-100">{{
                $st(getTitle(item.raw))
              }}</span>
              <span v-if="index === 1" class="text-no-wrap text-caption"
                >(+{{ $attrs['modelValue'].length - 1 }})</span
              >
            </template>
            <template v-for="slot of Object.keys($slots)" #[slot]="scope">
              <slot :name="slot" v-bind="scope" />
            </template>
          </v-select>
        </span>
      </template>
    </VcsTooltip>
  </div>
</template>
<style lang="scss" scoped>
  :deep(.v-field) {
    --v-field-padding-start: 8px;
    --v-field-padding-end: 8px;
  }
  .v-input--density-compact :deep(.v-field) {
    --v-input-control-height: 16px;
    --v-field-padding-bottom: 0px;
    --v-field-input-padding-top: 0px;
    --v-input-padding-top: 0px;
  }
  .v-input--density-comfortable :deep(.v-field) {
    --v-input-control-height: 24px;
    --v-field-padding-bottom: 4px; // default 8
    --v-field-input-padding-top: 4px; // default 8
    --v-input-padding-top: 4px;
  }
  :deep(.v-field--focused .v-field__outline *) {
    --v-field-border-width: 1px;
    border-color: rgb(var(--v-theme-primary));
  }
  // Not color, just used if label is given
  :deep(.v-field--focused .v-field__outline *::after) {
    border-color: rgb(var(--v-theme-primary));
  }
  .remove-outline :deep(.v-field .v-field__outline) {
    padding-left: 8px;
    padding-right: 8px;
  }
  .remove-outline :deep(.v-field .v-field__outline *) {
    border-width: 0 0 1px 0;
    border-radius: 0;
  }
  // used to remove border from label
  .remove-outline :deep(.v-field .v-field__outline *::before) {
    border-width: 0;
    border-radius: 0;
  }
  // used to remove border from notch
  .remove-outline :deep(.v-field .v-field__outline * label) {
    color: rgb(var(--v-theme-primary));
    margin-left: -4px;
  }
  .primary--placeholder {
    :deep(input::placeholder) {
      color: rgb(var(--v-theme-primary));
      font-style: italic;
      opacity: 1;
      padding: 0 3px 0 0;
    }
    :deep(input::-moz-placeholder) {
      font-style: italic;
      padding: -5px 3px 0 0;
    }
  }
  /*
  .primary--placeholder {
    :deep(input::placeholder) {
      color: var(--v-primary-base);
      font-style: italic;
      opacity: 1;
    }
  }
  .v-select {
    &.v-select--is-multi {
      :deep(.v-select__selections) {
        flex-wrap: nowrap;
      }
    }
  }
  .remove-outline {
    :deep(fieldset) {
      border-width: 0;
      border-radius: 0;
    }
  }
  .outline--current {
    :deep(.v-input__slot fieldset),
    :deep(.v-input__slot .v-select__slot) {
      border-color: currentColor;
      transition: border-color 0.5s ease;
    }
  }
  .outline--error {
    :deep(.v-input__slot fieldset),
    :deep(.v-input__slot .v-select__slot) {
      border-color: var(--v-error-base);
    }
  }
  .input--dense {
    :deep(.v-input__slot) {
      padding: 0 4px !important;
    }
    :deep(fieldset) {
      padding-left: 2px;
    }
  }

  .input--not-dense {
    :deep(.v-input__slot) {
      padding: 0 8px !important;
    }
    :deep(fieldset) {
      padding-left: 6px;
    }
  }
  .v-input {
    :deep(fieldset) {
      border-radius: 2px;
    }
    :deep(.v-select__slot) {
      border-bottom: 1px solid var(--v-base-base);
    }
    &.v-text-field--outlined:hover {
      :deep(fieldset) {
        border: 1px solid currentColor;
      }
    }
    &.v-input--is-focused:hover,
    &.v-input--is-focused {
      :deep(.v-select__slot) {
        border-bottom: 1px solid var(--v-primary-base);
      }
    }
  }
  */
</style>
<script>
  import { VSelect } from 'vuetify/components';
  import { computed, ref } from 'vue';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import { useErrorSync } from './composables.js';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-select/ |vuetify select}.
   * Translates the items text if it is an i18n string.
   * Provides two height options depending on "dense" property:
   * - if dense is set true (default), height is 24 px
   * - if dense is set false, height is 32 px
   * Provides VcsTooltip to show error messages
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {Function} itemText - A function that is applied to each item and should return the item's text value.
   * @vue-computed {boolean} isDense - Whether size of select is dense.
   * @vue-computed {boolean} isOutlined - Select is outlined on either hover, focus or error, if not disabled.
   */
  export default {
    name: 'VcsSelect',
    components: {
      VcsTooltip,
      VSelect,
    },
    props: {
      tooltipPosition: {
        type: String,
        default: 'right',
      },
      itemText: {
        type: Function,
        default: undefined,
      },
    },
    setup(props, { attrs }) {
      const hover = ref(false);
      const focus = ref(false);
      // $ref to v-select element
      const selectField = ref();

      const errorMessage = useErrorSync(selectField);

      const isDense = computed(() => attrs.dense !== false);
      const isOutlined = computed(() => {
        return (
          (hover.value || focus.value || !!errorMessage.value) &&
          !(attrs.disabled || attrs.disabled === '')
        );
      });

      // function getText(item) {
      //   if (props.itemText) {
      //     return props.itemText(item);
      //   } else {
      //     return item?.text ?? item;
      //   }
      // }
      function getTitle(item) {
        if (props.itemText) {
          return props.itemText(item);
        } else {
          return item?.title ?? item;
        }
      }

      const density = computed(() => {
        if (isDense.value) {
          return 'compact';
        }
        return 'comfortable';
      });

      return {
        hover,
        focus,
        errorMessage,
        isDense,
        density,
        isOutlined,
        // getText,
        getTitle,
        selectField,
      };
    },
  };
</script>
