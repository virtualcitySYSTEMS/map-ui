<template>
  <v-btn
    :variant="buttonVariant"
    elevation="0"
    color="primary"
    :min-width="itemHeight * 1.5"
    :height="itemHeight"
    class="vcsFormButton"
    :slim="false"
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
        class="position-absolute"
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
    &.v-btn--variant-outlined:hover {
      border-color: rgb(var(--v-theme-primary-lighten-1));
    }
    &.v-btn--variant-flat:hover {
      background-color: rgb(var(--v-theme-primary-lighten-1)) !important;
      --v-hover-opacity: 0;
    }
    &.v-btn--disabled.v-btn--variant-outlined {
      opacity: var(--v-disabled-opacity);
      color: rgb(var(--v-theme-on-surface)) !important;
    }
    &.v-btn--disabled.v-btn--variant-flat {
      opacity: var(--v-disabled-opacity);
      background-color: rgb(var(--v-theme-base-lighten-1)) !important;
      :deep(.v-btn__overlay) {
        opacity: 0;
      }
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
  import { useFontSize, useItemHeight } from '../../vuePlugins/vuetify.js';
  import { useForwardSlots } from '../composables.js';

  /**
   * @description a button with tooltip extending {@link https://vuetifyjs.com/en/api/v-btn/|vuetify v-btn}.
   * Meant to be used in forms or window contents.
   * @vue-prop {('filled' | 'outlined')}                [variant='outlined'] - Filled or outlined representation of the button.
   * @vue-prop {boolean}                                hasUpdate - Whether the button shows a badge in the top right.
   * @vue-prop {string}                                 icon - When given, will display an icon in the button. Replaces vuetify icon property.
   * @vue-prop {string}                                 tooltip - Text content of a tooltip which appears on hover with default delay.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  tooltipPosition - Position of the tooltip.
   */
  export default {
    name: 'VcsFormButton',
    components: {
      VcsBadge,
      VBtn,
      VIcon,
      VTooltip,
    },
    inheritAttrs: false,
    props: {
      variant: {
        type: String,
        default: 'outlined',
        validator: (value) => ['outlined', 'filled'].includes(value),
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
      const itemHeight = useItemHeight();
      const buttonVariant = computed(() => {
        if (props.variant === 'filled') {
          return 'flat';
        }
        return props.variant;
      });
      const hasDefaultSlot = computed(() => {
        return !!slots?.default;
      });
      const forwardSlots = useForwardSlots(slots, ['default']);
      const fontSize = useFontSize();
      const iconSize = computed(() => {
        return fontSize.value * (1.2 + 0.1 / 3);
      });
      return {
        forwardSlots,
        buttonVariant,
        hasDefaultSlot,
        itemHeight,
        iconSize,
      };
    },
  };
</script>
