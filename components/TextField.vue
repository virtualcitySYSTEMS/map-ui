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
          v-bind="{...$props, ...$attrs, label: useNativeLabel ? $props.label : undefined}"
        />
      </div>
    </slot>
  </div>
</template>

<style lang="scss" scoped>


  ::v-deep {
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
  }

  label {
    white-space: nowrap;
  }

  .input--seconds,
  .input--meters,
  .input--degrees {
    position: relative;

    &::after {
      position: absolute;
      right: 20px;
      bottom: 6px;
      color: black;
    }

    input.v-input {
      padding-right: 42px;
      text-align: right;
    }
  }

  .v-input--dense {
    &.input--meters,
    &.input--seconds,
    &.input--degrees {
      &::after {
        bottom: 2px;
      }
    }
  }

  .input--seconds {
    &::after {
      content: 'sec';
    }
  }

  .input--meters {
    &::after {
      content: 'm';
    }
  }

  .input--degrees {
    &::after {
      content: '°';
    }
  }

  // Firefox only
  @-moz-document url-prefix() {
    .v-input.input--seconds {
      &:after {
        right: 5px;
      }

      input {
        padding-right: 28px !important;
      }
    }
  }

  .v-text-field.v-text-field--solo:not(.v-text-field--solo-flat)
    > .v-input__control
    > .v-input__slot {
    box-shadow: none !important;
  }

  .v-input--checkbox {
    .v-icon.v-icon--dense {
      font-size: 16px;
    }
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
