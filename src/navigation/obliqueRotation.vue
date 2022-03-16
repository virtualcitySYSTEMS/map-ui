<template>
  <div class="d-inline-flex">
    <OrientationToolsButton
      @click="input(-90)"
      icon="mdi-undo"
      tooltip="Rotate view left"
    />
    <OrientationToolsButton
      @click="input(90)"
      icon="mdi-redo"
      tooltip="Rotate view right"
    />
  </div>
</template>

<script>
  import OrientationToolsButton from './orientationToolsButton.vue';

  /**
   * @vue-prop {number} value - the current heading
   * @vue-event {number} input
   */
  export default {
    name: 'ObliqueRotation',
    components: { OrientationToolsButton },
    props: {
      value: {
        type: Number,
        required: true,
      },
    },
    methods: {
      input(rotation) {
        let currentValue = this.value + rotation;
        if (currentValue > 360) {
          currentValue -= 360;
        } else if (currentValue < 0) {
          currentValue += 360;
        }
        this.$emit('input', currentValue);
      },
    },
  };
</script>

<style scoped>

</style>
