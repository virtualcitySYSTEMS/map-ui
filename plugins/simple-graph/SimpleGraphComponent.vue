<template>
  <v-sparkline
    padding="24"
    stroke-linecap="round"
    :show-labels="labels.length > 0"
    :labels="labels"
    :type="graph"
    :color="color"
    :gradient="gradient"
    :fill="fill"
    :smooth="smooth"
    :value="values"
  />
</template>
<script>

/**
 * @description A simple table view for feature attributes using {@link https://vuetifyjs.com/en/api/v-sparkline/#props|vuetify v-sparkline }
 * @vue-prop {Object} attributes - the feature's attributes
 * @vue-prop {string[]} [labels] - optional array of strings labeling all data points
 * @vue-prop {string} [graph='trend'] - Choose between a trendline or bars
 * @vue-prop {string} [color='primary'] - optional color of the sparkline of the graph
 * @vue-prop {string[]} [gradient] - optional array of colors to use as a linear-gradient
 * @vue-prop {boolean} [fill=false] - if true, filled area below sparkline
 * @vue-prop {boolean|number|string} [smooth=true] - optional number of px to use as a corner radius. true defaults to 8, false is 0
 * @vue-computed {number[]} values - numeric values for the graph derived from the attributeKeys
 */
  export default {
    name: 'SimpleGraphComponent',
    props: {
      attributes: {
        type: Object,
        required: true,
      },
      labels: {
        type: Array,
        default: () => [],
      },
      graph: {
        type: String,
        default: 'trend',
      },
      color: {
        type: String,
        default: 'primary',
      },
      gradient: {
        type: Array,
        default: () => [],
      },
      fill: {
        type: Boolean,
        default: false,
      },
      smooth: {
        type: Number,
        default: 8,
      },
    },
    computed: {
      values() {
        return Object.values(this.attributes);
      },
    },
  };
</script>

<style scoped>

</style>
