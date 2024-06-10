<template>
  <v-select
    ref="selectField"
    menu-icon="mdi-chevron-down"
    variant="outlined"
    :menu-props="{ origin: 'overlap' }"
    :item-title="(item) => $st(getTitle(item))"
    color="primary"
    class="primary--placeholder"
    :class="{
      'remove-outline': !isOutlined,
      'outline--error': !!errorTooltip,
    }"
    :model-value="$attrs.value"
    v-bind="{ ...$attrs }"
    @focus="focus = true"
    @blur="focus = false"
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <template #selection="{ item, index }">
      <span v-if="index === 0" class="text-truncate w-100">
        {{ $st(getTitle(item.raw)) }}
      </span>
      <span v-if="index === 1" class="text-no-wrap text-caption">
        (+{{ $attrs['modelValue'].length - 1 }})
      </span>
    </template>
    <template v-for="slot of Object.keys($slots)" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
    <template #message="{ message }">
      <v-tooltip
        ref="errorTooltip"
        :activator="selectField"
        v-if="message"
        :text="message"
        content-class="bg-error"
        :location="tooltipPosition"
      />
    </template>
  </v-select>
</template>
<style lang="scss" scoped>
  :deep(.v-field) {
    --v-field-padding-start: 8px;
    --v-field-padding-end: 8px;
  }
  :deep(.v-field__input) {
    flex-wrap: unset;
    padding-right: 24px;
  }
  .v-input--density-compact :deep(.v-field) {
    --v-input-control-height: calc(var(--v-vcs-item-height) - 8px);
    --v-field-padding-bottom: 0px;
    --v-field-input-padding-top: 0px;
    --v-input-padding-top: 0px;
  }
  :deep(.v-field--focused .v-field__outline *) {
    --v-field-border-width: 1px;
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
  .primary--placeholder {
    :deep(input::placeholder) {
      color: rgb(var(--v-theme-primary));
      opacity: 1;
      padding: 0 3px 0 0;
    }
    :deep(input::-moz-placeholder) {
      font-style: italic;
    }
  }
  // remove details
  :deep(.v-input__details) {
    display: none;
  }
</style>
<script>
  import { VSelect, VTooltip } from 'vuetify/components';
  import { computed, ref } from 'vue';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-select/ |vuetify select}.
   * Translates the items text if it is an i18n string.
   * Provides VTooltip to show error messages
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {Function} itemText - A function that is applied to each item and should return the item's text value.
   * @vue-computed {boolean} isOutlined - Select is outlined on either hover, focus or error, if not disabled.
   */
  export default {
    name: 'VcsSelect',
    components: {
      VSelect,
      VTooltip,
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
      const errorTooltip = ref();

      const isOutlined = computed(() => {
        return (
          (hover.value || focus.value || !!errorTooltip.value) &&
          !(attrs.disabled || attrs.disabled === '')
        );
      });

      function getTitle(item) {
        if (props.itemText) {
          return props.itemText(item);
        } else {
          return item?.title ?? item;
        }
      }

      return {
        hover,
        focus,
        selectField,
        errorTooltip,
        isOutlined,
        getTitle,
      };
    },
  };
</script>
