<template>
  <div
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <VcsTooltip
      :tooltip-position="tooltipPosition"
      :tooltip="errorMessage"
      :value="(hover || focus) && isError"
      color="error"
      :max-width="200"
    >
      <template #activator="{ attrs }">
        <component
          :is="inputComponent"
          ref="textFieldRef"
          hide-details
          :dense="isDense"
          :clearable="isClearable"
          @focus="focus = true"
          @blur="focus = neverBlurred = false"
          @input="firstInput = true"
          :outlined="isOutlined"
          v-bind="{...$attrs, ...attrs}"
          v-on="{...$listeners}"
          :height="isDense ? 24 : 32"
          class="ma-0 pb-1 pt-1 primary--placeholder align-center"
          :class="$attrs.color === 'primary' ? 'primary--textfield' : ''"
        />
      </template>
    </VcsTooltip>
  </div>
</template>

<style lang="scss" scoped>
.primary--placeholder {
  ::v-deep {
    input::placeholder {
      color: var(--v-primary-base);
      font-style: italic;
      opacity: 1;
    }
  }
}
.primary--textfield {
  ::v-deep {
    input {
      color: var(--v-primary-base);
    }
  }
}
</style>

<script>
  import { VTextField, VFileInput } from 'vuetify/lib';
  import VcsTooltip from '../notification/VcsTooltip.vue';

  /**
   * @description extends API of {@link https://vuetifyjs.com/en/api/v-text-field v-text-field}.
   * Provides two height options depending on "dense" property:
   * - if dense is set true (default), height is 24 px
   * - if dense is set false, height is 32 px
   * Provides VcsTooltip to
   * - show error messages on focus
   * - show tooltips, if supplied, when hovered over append-icon
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-computed {boolean}                            isClearable - Whether textfield is isClearable. Makes sure icon is only shown on focus, hover or error.
   * @vue-computed {boolean}                            isDense - Whether size of textfield is dense.
   * @vue-computed {boolean}                            isError - Whether errorBucket is not empty and textfield was focused at least once.
   * @vue-computed {boolean}                            isOutlined - Textfield is outlined on either hover, focus or error, if not disabled.
   * @vue-computed {Array<string>}                      joinedErrorBucket - errorBucket + errorMessages of child v-text-field.
   */
  export default {
    name: 'VcsTextField',
    components: {
      VcsTooltip,
      VTextField,
      VFileInput,
    },
    props: {
      tooltipPosition: {
        type: String,
        default: 'right',
      },
    },
    data() {
      return {
        hover: false,
        focus: false,
        firstInput: false,
        neverBlurred: true,
        isMounted: false,
        errorMessage: '',
      };
    },
    computed: {
      inputComponent() {
        if (this.$attrs.type === 'file') {
          return 'VFileInput';
        }
        return 'VTextField';
      },
      isClearable() {
        return (this.$attrs.clearable !== undefined && this.$attrs.clearable !== false) &&
          (this.hover || this.focus || this.isError);
      },
      isDense() {
        return this.$attrs.dense !== undefined && this.$attrs.dense !== false;
      },
      isError() {
        return this.joinedErrorBucket.length > 0 && (this.firstInput || !this.neverBlurred);
      },
      isOutlined() {
        return (this.$attrs.outlined || this.hover || this.focus || this.isError) && !(this.$attrs.disabled || this.$attrs.disabled === '');
      },
      joinedErrorBucket() {
        if (!this.isMounted) {
          return false;
        } else {
          return this.$refs.textFieldRef.errorBucket.concat(this.$refs.textFieldRef.errorMessages).join('\n');
        }
      },
    },
    watch: {
      joinedErrorBucket(newValue, oldValue) {
        if (oldValue && !newValue) {
          setTimeout(() => {
            this.errorMessage = newValue;
          }, 200);
        } else {
          this.errorMessage = newValue;
        }
      },
    },
    mounted() {
      this.isMounted = true;
      // fix for autofocus
      this.focus = this.$attrs.autofocus != null;
    },
  };
</script>
