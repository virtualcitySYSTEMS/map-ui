<template>
  <div class="vcs-button-wrap">
    <VcsTooltip
      :tooltip="tooltip"
      :tooltip-position="tooltipPosition"
      v-bind="{ ...tooltipProps }"
    >
      <template #activator="{ on, attrs }">
        <v-btn
          :color="backgroundColor"
          :text="isTextButton"
          :outlined="isOutlined"
          :class="classes"
          :ripple="!isSmall ? { class: 'primary--text text--darken-4' } : false"
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
    &--outlined {
      border: thin solid currentColor;
    }
    &.vcs-button {
      &--standard {
        min-width: 48px;
        height: 32px;
        font-size: 12px;
        border: 1px solid transparent;
        &:hover {
          color: var(--v-base-lighten5) !important;
          border-color: var(--v-primary-base);
          background-color: var(--v-primary-base);
        }
      }

      &--small {
        height: 16px;
        min-width: auto;
        &:hover {
          color: var(--v-primary-base);
        }
        &::before {
          display: none; /*prevents unwanted mouseover effect*/
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

      &--large {
        min-width: 42px;
        height: 34px;
        padding: 0;
        position: relative;

        &.vcs-button--active-background {
          border: 2px solid var(--v-primary-base);
          background-color: var(--v-base-lighten2) !important;
        }

        &.v-btn--disabled {
          background-color: transparent !important;
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
   * @vue-prop {boolean}                                active - Whether button has background color. Applies vuetify primary color if color property is not set.
   * @vue-prop {string}                                 color - Passes property to v-btn in case prop active is true.
   * @vue-prop {boolean}                                background - When applied with active the button shows an active-background state implying that a tool is active, but running in background, e.g. windowComponent closed.
   * @vue-prop {boolean}                                hasUpdate - Whether the button shows a badge in the top right.
   * @vue-prop {string}                                 icon - When given, will display an icon in the button. Replaces vuetify icon property.
   * @vue-prop {string}                                 tooltip - Text content of a tooltip which appears on hover with default delay.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  tooltipPosition - Position of the tooltip.
   * @vue-prop {Object<string, any>}                    tooltipProps - Properties to be passed to VcsTooltip {@link https://vuetifyjs.com/en/api/v-tooltip/#props|vuetify v-tooltip}
   * @vue-computed {string}                             backgroundColor - color applied to button, depending on size and state
   * @vue-computed {Object<string, string>}             classes - css classes applied to button, depending on size and state
   * @vue-computed {boolean}                            hasDefaultSlot
   * @vue-computed {boolean}                            isSmall - button size is small
   * @vue-computed {boolean}                            isStandard - button size standard
   * @vue-computed {boolean}                            isLarge - button size is large
   * @vue-computed {boolean}                            isOutlined - button is outlined
   * @vue-computed {boolean}                            isTextButton - button is text
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
      background: {
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
    },
    computed: {
      backgroundColor() {
        if (this.isStandard && !this.active) {
          return this.color;
        } else if (this.active) {
          return this.color ? this.color : 'primary';
        } else {
          return null;
        }
      },
      classes() {
        return {
          'vcs-button--small': this.isSmall,
          'pa-0': this.isSmall,
          'vcs-button--standard': this.isStandard,
          padding: this.isStandard,
          'font-weight-bold': this.isStandard,
          'text-capitalize': this.isStandard,
          'vcs-button--large': this.isLarge,
          'vcs-button--active-background':
            this.active && this.background && !this.$attrs.disabled,
        };
      },
      hasDefaultSlot() {
        return !!this.$slots?.default?.[0]?.text?.trim();
      },
      isSmall() {
        return this.$attrs.small != null;
      },
      isStandard() {
        return !(this.isSmall || this.isLarge);
      },
      isLarge() {
        return this.$attrs.large != null;
      },
      isOutlined() {
        if (this.isStandard) {
          return this.active || this.background;
        }
        return false;
      },
      isTextButton() {
        if (this.isSmall) {
          return true;
        }
        return !this.active ? true : null;
      },
    },
  };
</script>
