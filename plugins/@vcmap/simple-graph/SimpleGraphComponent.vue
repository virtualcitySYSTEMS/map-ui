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

  import { VSparkline } from 'vuetify/lib';

  export default {
    name: 'SimpleGraphComponent',
    components: [
      VSparkline,
    ],
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
