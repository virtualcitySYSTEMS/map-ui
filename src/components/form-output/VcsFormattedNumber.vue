<template>
  <span class="vcs-formatted-number" :class="{ 'py-1': !paddingProvided }">
    <slot name="prepend">
      <span v-if="prefix" class="pr-1">{{ prefix }}</span>
    </slot>
    {{ formatted }}
    <slot name="append">
      <span v-if="unit === SpecialUnits.SQM"> m<sup>2</sup> </span>
      <span v-else-if="unit === SpecialUnits.CBM"> m<sup>3</sup> </span>
      <span v-else-if="unit === SpecialUnits.DEG"> ° </span>
      <span v-else>
        {{ unit }}
      </span>
    </slot>
  </span>
</template>
<style lang="scss" scoped>
  @import '../../styles/vcsGrid.scss';
  @import '../../styles/vcsFont';
  .vcs-formatted-number,
  .vcs-formatted-number span {
    font-size: var(--v-vcs-font-size);
    line-height: $line-height-dense;
  }
</style>
<script>
  import { computed } from 'vue';
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
   * @vue-prop {string|SpecialUnits} [unit=undefined]
   * @vue-prop {number} [fractionDigits=undefined]
   * @vue-prop {number} modelValue
   * @vue-prop {string|number} prefix
   * @vue-prop {boolean} [dense=true] - default line height is 32px (dense). If set false, height is 40px.
   * @vue-prop {boolean} noPadding    - Padding is required for usage within rows. For standalone usage this prop removes class.
   * @vue-computed {string} formatted - value formatted to locale string
   */
  export default {
    name: 'VcsFormattedNumber',
    props: {
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
