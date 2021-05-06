<template>
  <span>
    {{ value | localeString({ fractionDigits }) }}

    <span v-if="unit === 'm'">
      m
    </span>
    <span v-if="unit === 'sqm'">
      m<sup>2</sup>
    </span>
    <span v-if="unit === 'cm'">
      m<sup>3</sup>
    </span>
    <span v-if="unit === 'deg'">
      °
    </span>
  </span>
</template>

<script>
  import Vue from 'vue';

  export const units = [
    'number',
    'm',
    'sqm',
    'cm',
    'deg',
  ];

  export default Vue.extend({
    name: 'VcsFormattedNumber',
    props: {
      unit: {
        type: String,
        default: 'number', // 'm', 'sqm', 'cm', 'deg' ...
      },
      fractionDigits: {
        type: Number,
        default: 2,
      },
      value: {
        type: Number,
        default: 0,
      },
    },
  });
</script>
