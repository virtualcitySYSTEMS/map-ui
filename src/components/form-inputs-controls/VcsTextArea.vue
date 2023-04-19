<template>
  <div>
    <VcsTooltip
      :tooltip-position="tooltipPosition"
      :tooltip="errorMessage"
      color="error"
      :max-width="200"
    >
      <template #activator="{ on, attrs }">
        <v-textarea
          ref="textAreaRef"
          hide-details
          :dense="isDense"
          :clearable="isClearable"
          @focus="focus = true"
          @blur="focus = false"
          @mouseover="hover = true"
          @mouseleave="hover = false"
          outlined
          v-bind="{ ...$attrs, ...attrs }"
          v-on="{ ...$listeners, ...on }"
          :rows="$attrs.rows || (isDense ? 3 : 5)"
          class="ma-0 py-1 primary--placeholder"
          :class="{
            'remove-outline': !isOutlined,
            'outline--current': focus,
            'outline--error': errorMessage,
            'input--dense': isDense,
            'input--not-dense': !isDense,
          }"
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
  .remove-outline {
    ::v-deep {
      fieldset {
        border-width: 0;
        border-radius: 0;
      }
    }
  }
  .outline--current {
    ::v-deep {
      .v-input__slot fieldset {
        border-color: currentColor;
        transition: border-color 0.5s ease;
      }
      .v-text-field__slot textarea {
        border-color: transparent;
      }
    }
  }
  .outline--error {
    ::v-deep {
      .v-input__slot fieldset,
      .v-text-field__slot textarea {
        border-color: var(--v-error-base);
      }
    }
  }
  .input--dense {
    ::v-deep {
      .v-input__slot {
        padding: 0 4px !important;
      }
      fieldset {
        padding-left: 2px;
      }
    }
  }
  .input--not-dense {
    ::v-deep {
      .v-input__slot {
        padding: 0 8px !important;
      }
      fieldset {
        padding-left: 6px;
      }
    }
  }
  .v-input {
    ::v-deep {
      textarea {
        border-bottom: 1px solid var(--v-base-base);
        border-radius: 0;
      }
      textarea::selection {
        background-color: var(--v-primary-base);
      }
      fieldset {
        border-radius: 2px;
        border-color: var(--v-base-base);
      }
      .v-text-field__slot {
        margin-right: 0 !important;
      }
    }
  }
</style>

<script>
  import { computed, ref } from 'vue';
  import { VTextarea } from 'vuetify/lib';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import { useErrorSync } from './composables.js';

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
      VTextarea,
    },
    props: {
      tooltipPosition: {
        type: String,
        default: 'right',
      },
    },
    setup(props, { attrs }) {
      const hover = ref(false);
      const focus = ref(false);
      const textAreaRef = ref();

      const errorMessage = useErrorSync(textAreaRef);

      const isClearable = computed(() => {
        return (
          attrs.clearable !== undefined &&
          attrs.clearable !== false &&
          (hover.value || focus.value || errorMessage.value)
        );
      });
      const isDense = computed(() => attrs.dense !== false);
      const isOutlined = computed(() => {
        return (
          (hover.value || focus.value || errorMessage.value) &&
          !(attrs.disabled || attrs.disabled === '')
        );
      });
      return {
        hover,
        focus,
        textAreaRef,
        errorMessage,
        isClearable,
        isDense,
        isOutlined,
      };
    },
  };
</script>
