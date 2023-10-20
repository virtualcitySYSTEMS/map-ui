<template>
  <div class="vcs-button-wrap">
    <v-btn
      v-if="!tooltip"
      :outlined="variant === 'outlined'"
      :disabled="disabled"
      :loading="loading"
      :ripple="false"
      elevation="0"
      color="primary"
      class="vcs-form-button"
      :class="classes"
      v-bind="{ ...$attrs }"
      v-on="{ ...$listeners }"
    >
      <v-icon v-if="icon" :class="{ 'mr-2': hasDefaultSlot }">
        {{ icon }}
      </v-icon>
      <slot />
    </v-btn>
    <VcsTooltip
      v-else
      :tooltip="tooltip"
      :tooltip-position="tooltipPosition"
      v-bind="{ ...tooltipProps }"
    >
      <template #activator="{ on, attrs }">
        <v-btn
          :outlined="variant === 'outlined'"
          :disabled="disabled"
          :loading="loading"
          :ripple="false"
          elevation="0"
          color="primary"
          class="vcs-form-button"
          :class="classes"
          v-bind="{ ...$attrs, ...attrs }"
          v-on="{ ...$listeners, ...on }"
        >
          <v-icon v-if="icon" :class="{ 'mr-2': hasDefaultSlot }">
            {{ icon }}
          </v-icon>
          <slot />
        </v-btn>
      </template>
    </VcsTooltip>
    <VcsBadge v-if="hasUpdate" :color="'warning'" class="position-absolute" />
  </div>
</template>

<style lang="scss" scoped>
  @import '../../styles/shades.scss';

  .vcs-button-wrap {
    position: relative;
    display: inline-block;
  }
  .badge {
    top: -3px;
    right: -3px;
  }
  .v-btn {
    &--outlined {
      border: thin solid currentColor;
    }
    &--disabled {
      // TODO text color primary
      border-color: var(--v-primary-lighten1);
      background-color: transparent !important;
    }
  }
  .vcs-button-wrap {
    .vcs-form-button {
      min-width: 48px;
      height: 32px;
      font-size: 12px;
      border: 1px solid transparent;

      &--outlined {
        border: thin solid currentColor;
        &:hover {
          border-color: var(--v-primary-lighten1) !important;
        }
        &.theme--light:hover::before {
          opacity: 0.16;
        }
        &.theme--dark:hover::before {
          opacity: 0.32;
        }
      }

      &--filled {
        &:hover {
          color: map-get($shades, 'white') !important;
          border-color: var(--v-primary-lighten1) !important;
          background-color: var(--v-primary-lighten1) !important;
        }
      }
    }
  }
</style>

<script>
  import { VBtn, VIcon } from 'vuetify/lib';
  import VcsBadge from '../notification/VcsBadge.vue';
  import VcsTooltip from '../notification/VcsTooltip.vue';

  /**
   * @description a button with tooltip extending {@link https://vuetifyjs.com/en/api/v-btn/|vuetify v-btn} using {@link VcsTooltip}. Meant to be used in forms or window contents.
   * @vue-prop {('filled' | 'outlined')}                [variant='outlined'] - Filled or outlined representation of the button.
   * @vue-prop {boolean}                                disabled
   * @vue-prop {boolean}                                loading
   * @vue-prop {boolean}                                hasUpdate - Whether the button shows a badge in the top right.
   * @vue-prop {string}                                 icon - When given, will display an icon in the button. Replaces vuetify icon property.
   * @vue-prop {string}                                 tooltip - Text content of a tooltip which appears on hover with default delay.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  tooltipPosition - Position of the tooltip.
   * @vue-prop {Object<string, any>}                    tooltipProps - Properties to be passed to VcsTooltip {@link https://vuetifyjs.com/en/api/v-tooltip/#props|vuetify v-tooltip}
   * @vue-prop {string[]}                               [customClasses] - CSS classes to customize style
   * @vue-computed {Object<string, string>}             classes - css classes applied to button, depending on variant
   * @vue-computed {boolean}                            hasDefaultSlot
   * @vue-event {MouseEvent}                            click - Emits click event when the button is clicked.
   */
  export default {
    name: 'VcsFormButton',
    components: {
      VcsTooltip,
      VcsBadge,
      VBtn,
      VIcon,
    },
    inheritAttrs: false,
    props: {
      variant: {
        type: String,
        default: 'outlined',
        validator: (value) => ['outlined', 'filled'].includes(value),
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      loading: {
        type: Boolean,
        default: false,
      },
      hasUpdate: {
        type: Boolean,
        default: false,
      },
      icon: {
        type: String,
        default: undefined,
      },
      tooltip: {
        type: String,
        default: undefined,
      },
      tooltipPosition: {
        type: String,
        default: 'bottom',
      },
      tooltipProps: {
        type: Object,
        default: () => ({}),
      },
      customClasses: {
        type: Array,
        default: () => [],
      },
    },
    computed: {
      classes() {
        return {
          ...this.customClasses.reduce(
            (acc, cur) => ({ ...acc, [cur]: true }),
            {},
          ),
          'vcs-form-button--outlined': this.variant === 'outlined',
          'vcs-form-button--filled': this.variant === 'filled',
        };
      },
      hasDefaultSlot() {
        return !!this.$slots?.default?.[0]?.text?.trim();
      },
    },
  };
</script>
