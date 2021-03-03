<template>
  <v-checkbox
    on-icon="$vcsCheckboxChecked"
    off-icon="$vcsCheckbox"
    indeterminate-icon="$vcsCheckboxIndeterminate"
    v-bind="{...$props, ...$attrs}"
    :value="value"
    @change="emit"
  />
</template>

<style lang="scss" scoped>
  ::v-deep {
    .v-icon--dense.v-icon {
      width: 16px;
      height: 16px;
    }

    .v-input--selection-controls__input {
      align-items: center;
      justify-content: center;
    }
  }
</style>

<script>
  import Vue from 'vue';

  /**
   * @description Stylized wrapper around vuetify checkbox. extends API of https://vuetifyjs.com/en/api/v-checkbox/
   * @vue-prop {boolean}   value - Value of the checkbox.
   * @vue-event {boolean}  input - Emits when the value of the checkbox changes.
   */
  export default Vue.extend({
    name: 'VcsCheckbox',
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
