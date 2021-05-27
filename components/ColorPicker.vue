<template>
  <v-color-picker
    ref="picker"
    @input="e => sub.next(e)"
    :value="value"
    class="caption"
    v-bind="$props"
  />
</template>

<style lang="scss" scoped>
::v-deep {
  .v-color-picker__controls {
    padding: 8px;
  }

  .v-color-picker__input input {
    margin: 0;
  }

  .v-color-picker__edit {
    margin-top: 12px;
  }
}
</style>

<script>
  import { Subject } from 'rxjs';
  import { debounceTime, takeUntil } from 'rxjs/operators';
  import Vue from 'vue';

  /**
   * @description
   * Stylized wrapper around vuetify Color Picker
   */
  export default Vue.extend({
    name: 'VcsColorPicker',
    props: {
      width: {
        type: Number,
        default: 200,
      },
      mode: {
        type: String,
        default: 'hexa',
      },
      dotSize: {
        type: Number,
        default: 12,
      },
      value: {
        type: String,
        default: '#000000',
      },
    },
    setup() {
      return {
        sub: new Subject(),
        destroy$: new Subject(),
      };
    },
    mounted() {
      this.sub.pipe(
        debounceTime(330),
        takeUntil(this.destroy$),
      ).subscribe(
        (color) => {
          // this.$vuetify.theme.themes.light.primary = color;
          this.$emit('input', color);
        },
      );
    },
    destroyed() {
      this.destroy$.next();
      this.destroy$.unsubscribe();
    },
  });
</script>
