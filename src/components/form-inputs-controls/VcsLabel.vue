<template>
  <label
    :htmlFor="htmlFor"
    class="vcs-label"
    :class="{
      'vcs-label-required': required,
      'vcs-label-disabled': disabled,
      'pa-1': !paddingProvided,
    }"
  >
    <span class="ellipsis-text" ref="labelTextRef">
      <slot />
      <v-tooltip
        v-if="labelTooltip"
        activator="parent"
        :location="tooltipPosition"
        :text="$st(labelTooltip)"
      ></v-tooltip>
    </span>
  </label>
</template>

<style lang="scss" scoped>
  .ellipsis-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .vcs-label {
    box-sizing: content-box;
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    align-items: center;
    height: calc(var(--v-vcs-font-size) * 2 - 2px);
    font-size: var(--v-vcs-font-size);
  }
  .vcs-label-required .ellipsis-text:after {
    content: ' *';
    color: rgb(var(--v-theme-error));
  }
  .vcs-label-disabled {
    opacity: var(--v-disabled-opacity);
  }
</style>
<script>
  import { VTooltip } from 'vuetify/components';
  import { computed, ref } from 'vue';
  import { createEllipseTooltip, usePadding } from '../composables.js';

  /**
   * @description Stylized wrapper around {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label |label label}.
   * Pass the label text as innerHtml.
   * @vue-prop {string} htmlFor - an id reference the label is meant for.
   * @vue-prop {boolean} [required=false] - Marks an input field as required by adding an asterisk after the label.
   * @vue-prop {boolean} [disabled=false] - Marks an input field as disabled by adding transparency to the label.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the tooltip.
   * @vue-prop {string|undefined}                       tooltip - Optional tooltip which will be shown on hover when no error message is shown
   */
  export default {
    name: 'VcsLabel',
    components: {
      VTooltip,
    },
    props: {
      htmlFor: {
        type: String,
        default: undefined,
      },
      required: {
        type: Boolean,
        default: false,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      tooltip: {
        type: String,
        default: undefined,
      },
      tooltipPosition: {
        type: String,
        default: 'right',
      },
    },
    setup(props, { attrs }) {
      const paddingProvided = usePadding(attrs);
      const labelTextRef = ref();
      const labelTooltip = createEllipseTooltip(
        computed(() => {
          return labelTextRef.value;
        }),
        computed(() => props.tooltip),
        computed(() => labelTextRef.value?.textContent),
      );
      return {
        paddingProvided,
        labelTooltip,
        labelTextRef,
      };
    },
  };
</script>
