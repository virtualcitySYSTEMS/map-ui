<template>
  <v-btn
    :color="appliedColor"
    :variant="buttonVariant"
    :height="itemHeight + 2"
    :min-width="itemHeight + itemHeight / 3"
    class="vcs-tool-button"
    :disabled="disabled"
    :class="{
      'vcs-background': background,
      'vcs-active': active,
    }"
    elevation="0"
    v-bind="{ ...$attrs }"
  >
    <template #default="scope">
      <v-tooltip
        activator="parent"
        v-if="tooltip"
        :text="$st(tooltip)"
        :location="tooltipPosition"
      />
      <v-icon :size="iconSize" v-if="icon" :class="{ 'mr-2': hasDefaultSlot }">
        {{ icon }}
      </v-icon>
      <VcsBadge
        v-if="hasUpdate"
        :color="'bg-warning'"
        class="position-absolute badge"
      />
      <slot name="default" v-bind="scope ?? {}" />
    </template>
    <template v-for="slot of forwardSlots" #[slot]="scope">
      <slot :name="slot" v-bind="scope ?? {}" />
    </template>
  </v-btn>
</template>

<style lang="scss" scoped>
  .badge {
    top: -3px;
    right: -3px;
  }
  .vcs-active.vcs-background:not(.v-btn--disabled) :deep(.badge) {
    top: -5px;
    right: -5px;
  }
  .v-btn {
    padding-left: 11px;
    padding-right: 11px;

    &.vcs-active.vcs-background:not(.v-btn--disabled) {
      padding-left: 9px;
      padding-right: 9px;
      border: 2px solid rgb(var(--v-theme-primary));
      background-color: rgb(var(--v-theme-base-lighten-2)) !important;
    }
    &.v-btn--disabled.v-btn--variant-text {
      opacity: var(--v-disabled-opacity);
    }
    :deep(.v-btn__loader > .v-progress-circular) {
      width: calc(var(--v-vcs-font-size) * (1.2 + 0.1 / 3)) !important;
      height: calc(var(--v-vcs-font-size) * (1.2 + 0.1 / 3)) !important;
    }
  }
</style>

<script>
  import { computed } from 'vue';
  import { VBtn, VIcon, VTooltip } from 'vuetify/components';
  import VcsBadge from '../notification/VcsBadge.vue';
  import { getForwardSlots } from '../composables.js';
  import { useFontSize } from '../../vuePlugins/vuetify.js';

  /**
   * @description a button with tooltip extending {@link https://vuetifyjs.com/en/api/v-btn/|vuetify v-btn} using {@link VcsTooltip}. Used for tool buttons in the Navbar.
   * @vue-prop {boolean}                                active - Whether button has background color. Applies vuetify primary color if color property is not set.
   * @vue-prop {boolean}                                disabled - Whether button is disabled.
   * @vue-prop {string}                                 color - Passes property to v-btn in case prop active is true.
   * @vue-prop {boolean}                                background - When applied with active the button shows an active-background state implying that a tool is active, but running in background, e.g. windowComponent closed.
   * @vue-prop {boolean}                                hasUpdate - Whether the button shows a badge in the top right.
   * @vue-prop {string}                                 icon - When given, will display an icon in the button. Replaces vuetify icon property.
   * @vue-prop {string}                                 tooltip - Text content of a tooltip which appears on hover with default delay.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  tooltipPosition - Position of the tooltip.
   * @vue-prop {Object<string, any>}                    tooltipProps - Properties to be passed to VcsTooltip {@link https://vuetifyjs.com/en/api/v-tooltip/#props|vuetify v-tooltip}
   * @vue-computed {string}                             appliedColor - color applied to button, depending on size and state
   * @vue-computed {boolean}                            hasDefaultSlot
   */
  export default {
    name: 'VcsToolButton',
    components: {
      VcsBadge,
      VBtn,
      VIcon,
      VTooltip,
    },
    inheritAttrs: false,
    props: {
      active: {
        type: Boolean,
        default: false,
      },
      disabled: {
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
    },
    setup(props, { slots }) {
      const appliedColor = computed(() => {
        if (props.active && !props.disabled) {
          return props.color ? props.color : 'primary';
        } else {
          return null;
        }
      });
      const hasDefaultSlot = computed(() => {
        return !!slots?.default;
      });
      const forwardSlots = getForwardSlots(slots, ['default']);
      const buttonVariant = computed(() => {
        if (props.active && !props.disabled) {
          return 'flat';
        }
        return 'text';
      });

      const fontSize = useFontSize();
      const itemHeight = computed(() => {
        return fontSize.value * 2 + 6;
      });
      const iconSize = computed(() => {
        return fontSize.value * 1.5;
      });

      return {
        itemHeight,
        iconSize,
        appliedColor,
        forwardSlots,
        buttonVariant,
        hasDefaultSlot,
      };
    },
  };
</script>
