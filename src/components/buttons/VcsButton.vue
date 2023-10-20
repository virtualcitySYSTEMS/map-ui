<template>
  <div class="vcs-button-wrap">
    <v-btn
      v-if="!tooltip"
      text
      :color="appliedColor"
      :disabled="disabled"
      class="vcs-button pa-0"
      :class="customClasses.join(' ')"
      :ripple="false"
      elevation="0"
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
          text
          :color="appliedColor"
          :disabled="disabled"
          class="vcs-button pa-0"
          :class="customClasses.join(' ')"
          :ripple="false"
          elevation="0"
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
  .vcs-button-wrap {
    position: relative;
    display: inline-block;
  }
  .badge {
    top: -3px;
    right: -3px;
  }
  .v-btn {
    &.vcs-button {
      height: 16px;
      min-width: auto;
      &:hover {
        color: var(--v-primary-lighten1) !important;
      }
      ::v-deep {
        .v-icon {
          font-size: 16px;
        }
        .v-icon__component {
          height: 16px;
          width: 16px;
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
   * @description a button with tooltip extending {@link https://vuetifyjs.com/en/api/v-btn/|vuetify v-btn} using {@link VcsTooltip}.
   * @vue-prop {boolean}                                active - State of the button. Applies set color or vuetify primary color in active state.
   * @vue-prop {string}                                 color - Passes property to v-btn in case prop active is true.
   * @vue-prop {boolean}                                disabled
   * @vue-prop {boolean}                                hasUpdate - Whether the button shows a badge in the top right.
   * @vue-prop {string}                                 icon - When given, will display an icon in the button. Replaces vuetify icon property.
   * @vue-prop {string}                                 tooltip - Text content of a tooltip which appears on hover with default delay.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  tooltipPosition - Position of the tooltip.
   * @vue-prop {Object<string, any>}                    tooltipProps - Properties to be passed to VcsTooltip {@link https://vuetifyjs.com/en/api/v-tooltip/#props|vuetify v-tooltip}
   * @vue-prop {string[]}                               [customClasses] - CSS classes to customize style
   * @vue-computed {string}                             appliedColor - color applied to button, depending on active state
   * @vue-computed {boolean}                            hasDefaultSlot
   * @vue-event {MouseEvent}                            click - Emits click event when the button is clicked.
   */
  export default {
    name: 'VcsButton',
    components: {
      VcsTooltip,
      VcsBadge,
      VBtn,
      VIcon,
    },
    inheritAttrs: false,
    props: {
      active: {
        type: Boolean,
        default: false,
      },
      color: {
        type: String,
        default: undefined,
      },
      disabled: {
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
      appliedColor() {
        if (this.active) {
          return this.color ? this.color : 'primary';
        } else {
          return null;
        }
      },
      hasDefaultSlot() {
        return !!this.$slots?.default?.[0]?.text?.trim();
      },
    },
  };
</script>
