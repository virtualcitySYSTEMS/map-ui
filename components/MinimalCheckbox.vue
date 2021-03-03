<template>
  <v-checkbox
    :on-icon="'$vcsSimpleCircleFilled'"
    :off-icon="'$vcsSimpleCircleOutlined'"
    v-bind="{...$props, ...$attrs}"
    :value="value"
    @change="emit"
    :ripple="false"
    dense
    hide-details
  />
</template>


<style lang="scss" scoped>
  ::v-deep {
    .v-icon__component {
      width: 8px;
      height: 8px;
    }
  }
</style>


<script>
  import Vue from 'vue';

  /**
   * @description Stylized wrapper around vuetify checkbox
   * @vue-prop {boolean}   value - Value of the checkbox.
   * @vue-event {boolean}  input - Emits when the value of the checkbox changes.
   */
  export default Vue.extend({
    name: 'VcsMinimalCheckbox',
    props: {
      value: {
        type: Boolean,
        default: false,
      },
    },
    methods: {
      emit(val) {
        this.$emit('input', val);
      },
    },
  });
</script>
