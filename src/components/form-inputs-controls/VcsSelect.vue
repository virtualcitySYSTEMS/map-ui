<template>
  <div>
    <VcsTooltip
      :tooltip-position="tooltipPosition"
      :tooltip="errorMessage"
      color="error"
      :max-width="200"
    >
      <template #activator="{ on, attrs }">
        <span v-on="on">
          <v-select
            ref="selectField"
            append-icon="mdi-chevron-down"
            hide-details
            flat
            outlined
            :dense="isDense"
            :height="isDense ? 24 : 32"
            :item-text="item => $t(getText(item))"
            class="py-1 primary--placeholder"
            :class="{
              'remove-outline': !isOutlined,
              'input--dense': isDense,
              'input--not-dense': !isDense,
              'outline--current': focus,
              'outline--error': !!errorMessage,
            }"
            v-bind="{...$attrs, ...attrs}"
            v-on="{...$listeners, ...on}"
            @focus="focus = true;"
            @blur="focus = false;"
            @mouseover="hover = true"
            @mouseleave="hover = false"
          >
            <template #selection="{ item, index }">
              <span v-if="index === 0" class="text-truncate">
                {{ $t(getText(item)) }}
              </span>
              <span v-if="index === 1" class="text-no-wrap text-caption">
                (+{{ $attrs.value.length - 1 }})
              </span>
            </template>
          </v-select>
        </span>
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
  .v-select{
    &.v-select--is-multi{
      ::v-deep {
        .v-select__selections{
          flex-wrap: nowrap;
        }
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
      .v-input__slot fieldset, .v-input__slot .v-select__slot {
        border-color: currentColor;
        transition: border-color 0.5s ease;
      }
    }
  }
  .outline--error {
    ::v-deep {
      .v-input__slot fieldset, .v-input__slot .v-select__slot {
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
      fieldset {
        border-radius: 2px;
        border-color: var(--v-base-base);
      }
      .v-select__slot {
        border-bottom: 1px solid var(--v-base-base);
      }
    }
  }
</style>
<script>

  import { VSelect } from 'vuetify/lib';
  import { computed, ref } from 'vue';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import { useErrorSync } from './composables.js';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-select/ |vuetify select}.
   * Translates the items text if it is an i18n string.
   * Provides two height options depending on "dense" property:
   * - if dense is set true (default), height is 24 px
   * - if dense is set false, height is 32 px
   * Provides VcsTooltip to show error messages
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {Function} itemText - A function that is applied to each item and should return the item's text value.
   * @vue-computed {boolean} isDense - Whether size of select is dense.
   * @vue-computed {boolean} isOutlined - Select is outlined on either hover, focus or error, if not disabled.
   */
  export default {
    name: 'VcsSelect',
    components: {
      VcsTooltip,
      VSelect,
    },
    props: {
      tooltipPosition: {
        type: String,
        default: 'right',
      },
      itemText: {
        type: Function,
        default: undefined,
      },
    },
    setup(props, { attrs }) {
      const hover = ref(false);
      const focus = ref(false);
      // $ref to v-select element
      const selectField = ref();

      const errorMessage = useErrorSync(selectField);

      const isDense = computed(() => attrs.dense !== false);
      const isOutlined = computed(() => {
        return (hover.value || focus.value || !!errorMessage.value) && !(attrs.disabled || attrs.disabled === '');
      });

      function getText(item) {
        if (props.itemText) {
          return props.itemText(item);
        } else {
          return item?.text ?? item;
        }
      }

      return {
        hover,
        focus,
        errorMessage,
        isDense,
        isOutlined,
        getText,
        selectField,
      };
    },
  };
</script>

