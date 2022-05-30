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
        <v-textarea
          ref="textAreaRef"
          hide-details
          :dense="isDense"
          :clearable="isClearable"
          @focus="focus = true"
          @blur="focus = neverBlurred = false"
          @input="firstInput = true"
          :outlined="isOutlined"
          v-bind="{...$attrs, ...attrs}"
          v-on="{...$listeners}"
          :rows="$attrs.rows || (isDense ? 3 : 5)"
          class="ma-0 pb-1 pt-1 primary--placeholder"
          :class="$attrs.color === 'primary' ? 'primary--textarea' : ''"
        />
      </template>
    </VcsTooltip>
  </div>
</template>

<style lang="scss" scoped>
.primary--placeholder {
  ::v-deep {
    textarea::placeholder {
      color: var(--v-primary-base);
      font-style: italic;
      opacity: 1;
    }
  }
}
.primary--textarea {
  ::v-deep {
    textarea {
      color: var(--v-primary-base);
    }
  }
}
</style>

<script>
  import VcsTooltip from '../notification/VcsTooltip.vue';

  /**
   * @description extends API of {@link https://vuetifyjs.com/en/api/v-textarea/|vuetify v-textarea}.
   * Provides two default height options depending on "dense" property:
   * - if dense is set true (default), height is 72 px (3 rows each 24 px)
   * - if dense is set false, height is 120 px (5 rows each 24 px)
   * Default for number of rows can be overwritten using the vuetify API.
   * Provides VcsTooltip to
   * - show error messages on focus
   * - show tooltips, if supplied, when hovered over append-icon
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-computed {boolean}                            isClearable - Whether textarea is isClearable. Makes sure icon is only shown on focus, hover or error.
   * @vue-computed {boolean}                            isDense - Whether size of textarea is dense.
   * @vue-computed {boolean}                            isError - Whether errorBucket is not empty and textarea was focused at least once.
   * @vue-computed {boolean}                            isOutlined - Textarea is outlined on either hover, focus or error, if not disabled.
   * @vue-computed {Array<string>}                      joinedErrorBucket - errorBucket + errorMessages of child v-text-field.
   */
  export default {
    name: 'VcsTextArea',
    components: {
      VcsTooltip,
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
        return (this.hover || this.focus || this.isError) && !(this.$attrs.disabled || this.$attrs.disabled === '');
      },
      joinedErrorBucket() {
        if (!this.isMounted) {
          return false;
        } else {
          return this.$refs.textAreaRef.errorBucket.concat(this.$refs.textAreaRef.errorMessages).join('\n');
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
    },
  };
</script>
