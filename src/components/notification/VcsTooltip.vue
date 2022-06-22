<template>
  <v-tooltip
    :disabled="!tooltip"
    :content-class="`tooltip ${arrowClass}`"
    :bottom="tooltipPosition === 'bottom'"
    :top="tooltipPosition === 'top'"
    :left="tooltipPosition === 'left'"
    :right="tooltipPosition === 'right'"
    :open-delay="$attrs.openDelay || 200"
    v-bind="{...$props, ...$attrs}"
  >
    <template #activator="{ on, attrs }">
      <slot name="activator" :on="on" :attrs="attrs" />
    </template>
    <span>{{ $t(tooltip) }}</span>
  </v-tooltip>
</template>
<style lang="scss" scoped>
//.v-tooltip__content.tooltip {
//  border: 1px solid black;
//  border-radius: 0;
//  background-color: #222222;
//
//&.arrow-top {
//   transform: translateY(-6px);
//
//&::after, &::before {
//             bottom: 100%;
//             left: 50%;
//             border: solid transparent;
//             content: "";
//             height: 0;
//             width: 0;
//             position: absolute;
//             pointer-events: none;
//           }
//
//&::before {
//   border-color: rgba(194, 225, 245, 0);
//   border-bottom-color: black;
//   border-width: 5px;
//   margin-left: -5px;
// }
//}
//
//&.arrow-bottom {
//   transform: translateY(6px);
//
//&::after, &::before {
//             top: 100%;
//             left: 50%;
//             border: solid transparent;
//             content: "";
//             height: 0;
//             width: 0;
//             position: absolute;
//             pointer-events: none;
//           }
//
//&::before {
//   border-color: rgba(194, 225, 245, 0);
//   border-top-color: black;
//   border-width: 5px;
//   margin-left: -5px;
// }
//}
//
//&.arrow-right {
//&::after, &::before {
//             top: 50%;
//             right: -11px;
//             transform: translateY(-50%);
//             border: solid transparent;
//             content: "";
//             height: 0;
//             width: 0;
//             position: absolute;
//             pointer-events: none;
//           }
//
//&::before {
//   border-color: rgba(255, 0, 0, 0);
//   border-left-color: black;
//   border-width: 5px;
//   margin-left: -5px;
// }
//}
//
//&.arrow-left {
//
//&::after, &::before {
//             top: 50%;
//             left: -11px;
//             transform: translateY(-50%);
//             border: solid transparent;
//             content: "";
//             height: 0;
//             width: 0;
//             position: absolute;
//             pointer-events: none;
//           }
//
//&::before {
//   border-color: rgba(194, 225, 245, 0);
//   border-right-color: black;
//   border-width: 5px;
// }
//}
//}
</style>
<script>

/**
 * @enum {string} TooltipPositions
 * @property {string} bottom
 * @property {string} left
 * @property {string} top
 * @property {string} right
 * @readonly
 * @module VcsTooltip
 */
  const TooltipPositions = {
    bottom: 'arrow-top',
    top: 'arrow-bottom',
    left: 'arrow-right',
    right: 'arrow-left',
  };

  /**
   * @description tooltip extending {@link https://vuetifyjs.com/en/api/v-tooltip/|vuetify v-tooltip}.
   * @vue-prop {string}                                 tooltip - Text content of a tooltip which appears on hover with default delay. This should be an i18n key.
   * @vue-prop {string}                                 [tooltipPosition='bottom'] - Position of the tooltip (allowed values: 'bottom'|'left'|'top'|'right').
   * @vue-computed {string}                             arrowClass - direction of tooltip arrow
   */
  export default {
    name: 'VcsTooltip',
    props: {
      tooltip: {
        type: String,
        default: undefined,
      },
      tooltipPosition: {
        type: String,
        default: 'bottom',
        validator(value) { return Object.keys(TooltipPositions).includes(value); },
      },
    },
    computed: {
      arrowClass() {
        return TooltipPositions[this.tooltipPosition];
      },
    },
  };
</script>
