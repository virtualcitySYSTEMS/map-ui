<template>
  <v-select
    class="vcs-select"
    :class="[...customClasses]"
    :items="items"
    label="Select"
    append-icon="mdi-chevron-down"
    hide-details
    dense
    solo
    flat
    @input="$emit('input', value)"
    :style="{ width: `${width}px`, maxWidth: `${width}px` }"
    :height="height"
    v-bind="{...$props, ...$attrs}"
  />
</template>
<style lang="scss" scoped>
  .vcs-select ::v-deep {
    .v-input__control {
      min-height: 32px !important;
    }
  }
</style>
<script>
  import Vue from 'vue';

  /**
   * @description Stylized wrapper around vuetify select
   * @vue-prop  {Array}  items         - Array of strings for selection
   * @vue-prop  {Array}  customClasses - Array of css classes being applied to select element
   * @vue-prop  {string} value         - Selected value
   * @vue-event {string} input         - Emit selected value
   */
  export default Vue.extend({
    name: 'VcsSelect',
    props: {
      items: {
        type: Array,
        default: () => ([]),
        required: true,
      },
      customClasses: {
        type: Array,
        default: () => ([]),
      },
      value: {
        type: String,
        default: undefined,
      },
      width: {
        type: Number,
        default: undefined,
      },
      height: {
        type: Number,
        default: 32,
      },
    },
  });
</script>

