<template>
  <v-color-picker
    ref="picker"
    @input="(e) => sub$.next(e)"
    :value="value"
    class="caption"
    v-bind="props"
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
  import {
    defineComponent,
    onMounted,
    onUnmounted,
  } from '@vue/composition-api';
  import { Subject } from 'rxjs';
  import { debounceTime, takeUntil } from 'rxjs/operators';

  /**
   * @description
   * Stylized wrapper around vuetify Color Picker
   */
  export default defineComponent({
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
    setup(props, context) {
      const destroy$ = new Subject();
      const sub$ = new Subject();

      onMounted(() => {
        sub$.pipe(debounceTime(330), takeUntil(destroy$)).subscribe((color) => {
          // this.$vuetify.theme.themes.light.primary = color;
          context.emit('input', color);
        });
      });

      onUnmounted(() => {
        destroy$.next();
        destroy$.unsubscribe();
      });

      return {
        props,
        sub$,
      };
    },
  });
</script>
