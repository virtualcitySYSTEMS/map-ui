<template>
  <span
    class="vcs-formatted-number"
    :class="{
      'vcs-disabled': disabled,
      'pa-1': !paddingProvided,
    }"
  >
    <slot name="prepend">
      <span v-if="prefix" class="pr-1">{{ prefix }}</span>
    </slot>
    {{ formatted }}
    <slot name="append">
      <span class="pl-1" v-if="unit === SpecialUnits.SQM"> m<sup>2</sup> </span>
      <span class="pl-1" v-else-if="unit === SpecialUnits.CBM">
        m<sup>3</sup>
      </span>
      <span class="pl-1" v-else-if="unit === SpecialUnits.DEG"> ° </span>
      <span class="pl-1" v-else>
        {{ unit }}
      </span>
    </slot>
    <v-tooltip
      v-if="tooltip"
      activator="parent"
      :location="tooltipPosition"
      :text="$st(tooltip)"
    ></v-tooltip>
  </span>
</template>
<style lang="scss" scoped>
  .vcs-formatted-number {
    box-sizing: content-box;
    display: flex;
    align-items: center;
    height: calc(var(--v-vcs-font-size) * 2 - 2px);
  }
  .vcs-disabled {
    opacity: var(--v-disabled-opacity);
  }
</style>
<script>
  import { computed } from 'vue';
  import { VTooltip } from 'vuetify/components';
  import { usePadding } from '../composables.js';

  /**
   * @description Converts a number (e.g. 12345678,9) to a locale-aware and
   * dot-seperated string with given amount of fractional digits (e.g. 12.345.678,90)
   * @param {string|number} value
   * @param {number} fractionDigits
   * @returns {string|number}
   */
  export function numberToLocaleString(value, fractionDigits) {
    // XXX todo maybe merge with dateTime helpers in core?
    const number = parseInt(value, 10);
    if (Number.isNaN(number)) {
      return number;
    }

    return /** @type {number} */ value.toLocaleString(navigator.language, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  /**
   * Enumeration of units displayed with special symbol
   * @typedef {Object} VcsFormattedNumber.SpecialUnits
   * @enum {string}
   * @property {string} SQM square meters
   * @property {string} CBM cubic meters
   * @property {string} DEG degrees
   * @module VcsFormattedNumber
   */
  export const SpecialUnits = {
    SQM: 'sqm',
    CBM: 'cbm',
    DEG: 'deg',
  };

  /**
   * @description Formatted number display, optionally with unit
   * @vue-prop {boolean} [disabled=false] - disabled by adding transparency to the label.
   * @vue-prop {string|SpecialUnits} [unit=undefined]
   * @vue-prop {number} [fractionDigits=undefined]
   * @vue-prop {number} modelValue
   * @vue-prop {string|number} prefix
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the tooltip.
   * @vue-prop {string|undefined}                       tooltip - Optional tooltip which will be shown on hover when no error message is shown
   */
  export default {
    name: 'VcsFormattedNumber',
    components: {
      VTooltip,
    },
    props: {
      disabled: {
        type: Boolean,
        default: false,
      },
      unit: {
        type: [String || SpecialUnits],
        default: undefined,
      },
      fractionDigits: {
        type: Number,
        default: 2,
      },
      modelValue: {
        type: Number,
        default: 0,
      },
      prefix: {
        type: [String, Number],
        default: undefined,
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
    setup(props, { attrs }) {
      const formatted = computed(() =>
        numberToLocaleString(props.modelValue, props.fractionDigits),
      );
      const paddingProvided = usePadding(attrs);
      return {
        SpecialUnits,
        formatted,
        paddingProvided,
      };
    },
  };
</script>
