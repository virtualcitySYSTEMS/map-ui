<template>
  <v-btn
    :min-height="minHeight"
    min-width="auto"
    variant="text"
    :color="appliedColor"
    :disabled="disabled"
    class="vcs-button"
    elevation="0"
    density="compact"
    size="small"
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
  .v-btn {
    padding: 0px;
    &.vcs-button {
      &:hover {
        color: rgb(var(--v-theme-primary-lighten-1)) !important;
      }
    }
    &.v-btn--disabled {
      opacity: var(--v-disabled-opacity);
    }
    :deep(.v-btn__loader > .v-progress-circular) {
      width: calc(var(--v-vcs-font-size) * (1.2 + 0.1 / 3)) !important;
      height: calc(var(--v-vcs-font-size) * (1.2 + 0.1 / 3)) !important;
    }
  }
  // remove hover shadow over button
  :deep(.v-btn__overlay) {
    --v-hover-opacity: 0;
  }
</style>

<script>
  import { computed } from 'vue';
  import { VBtn, VIcon, VTooltip } from 'vuetify/components';
  import VcsBadge from '../notification/VcsBadge.vue';
  import { useFontSize, useIconSize } from '../../vuePlugins/vuetify.js';
  import { useForwardSlots } from '../composables.js';

  /**
   * @description a button with tooltip extending {@link https://vuetifyjs.com/en/api/v-btn/|vuetify v-btn}.
   * @vue-prop {boolean}                                active - State of the button. Applies set color or vuetify primary color in active state.
   * @vue-prop {boolean}                                disabled - Whether button is disabled.
   * @vue-prop {string}                                 color - Passes property to v-btn in case prop active is true.
   * @vue-prop {boolean}                                hasUpdate - Whether the button shows a badge in the top right.
   * @vue-prop {string}                                 icon - When given, will display an icon in the button. Replaces vuetify icon property.
   * @vue-prop {string}                                 tooltip - Text content of a tooltip which appears on hover with default delay.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  tooltipPosition - Position of the tooltip.
   */
  export default {
    name: 'VcsButton',
    components: {
      VTooltip,
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
      disabled: {
        type: Boolean,
        default: false,
      },
      color: {
        type: String,
        default: undefined,
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
      const forwardSlots = useForwardSlots(slots, ['default']);
      const hasDefaultSlot = computed(() => {
        return !!slots?.default;
      });
      const fontSize = useFontSize();
      const minHeight = computed(() => {
        return fontSize.value * 1.5;
      });
      const iconSize = useIconSize();
      return {
        forwardSlots,
        hasDefaultSlot,
        appliedColor,
        iconSize,
        minHeight,
      };
    },
  };
</script>
