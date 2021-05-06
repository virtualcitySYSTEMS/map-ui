<template>
  <div
    class="d-flex flex-row align-end justify-space-between"
    :class="[...customClasses]"
  >
    <slot name="label">
      <label
        v-if="!useNativeLabel"
        class="mr-3"
        :class="{ caption: $attrs.dense !== undefined }"
      >
        {{ label }}
      </label>
    </slot>


    <slot name="input">
      <div class="d-flex justify-center align-center w-full">
        <v-text-field
          :class="{
            caption: $attrs.dense !== undefined,
            'text-right': alignInputContent === 'right',
            'text-left': alignInputContent === 'left',
            'text-center': alignInputContent === 'center',
            'input--seconds': unit === 'sec',
            'input--meters': unit === 'm',
            'input--degrees': unit === 'deg',
          }"
          v-bind="{...$props, ...$attrs, label: useNativeLabel ? $attrs.label : undefined}"
        />
      </div>
    </slot>
  </div>
</template>

<style lang="scss">
  label {
    white-space: nowrap;
  }

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button {
    opacity: 1;
  }

  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button {
    -webkit-appearance: inner-spin-button !important;
    width: 25px;
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
  }

</style>


<script>
  import Vue from 'vue';

  /**
   * @description extends API of https://vuetifyjs.com/en/api/v-text-field/
   * @vue-prop {string}   label                                       - Label to be shown before the input
   * @vue-prop {('left' | 'center' | 'right')}   alignInputContent    - Direction to which the content of the input field should be oriented
   * @vue-prop {boolean}   useNativeLabel                             - When this is set to true the component will use vuetify floating labels
   * @vue-prop {string[]}   customClasses                             - Array of string CSS classes which will be applied to the container
   */
  export default Vue.extend({
    name: 'VcsTextField',
    props: {
      label: {
        type: String,
        default: undefined,
      },
      alignInputContent: {
        type: String,
        default: 'left',
      },
      useNativeLabel: {
        type: Boolean,
        default: false,
      },
      customClasses: {
        type: Array,
        default: () => ([]),
      },
      unit: {
        type: String,
        default: undefined, // 'sec' | 'm' | 'deg'
      },
    },
  });
</script>
