<template>
  <v-card
    class="d-flex align-center justify-center text-center btn-orientation-tools orientation-tools-button"
    v-bind="{ ...$attrs }"
    :height="height"
    :width="width"
  >
    <v-icon :size="iconSize">{{ icon }}</v-icon>
    <v-tooltip
      v-if="tooltip"
      activator="parent"
      :location="tooltipPosition"
      :text="$st(tooltip)"
    ></v-tooltip>
  </v-card>
</template>
<script>
  import { VCard, VIcon, VTooltip } from 'vuetify/components';
  import { computed } from 'vue';
  import { useFontSize, useIconSize } from '../vuePlugins/vuetify.js';

  /**
   * @description v-card with h & w 8. Requires an icon and binds all attributes & listeners to the v-card
   * @vue-prop {string} icon
   * @vue-prop {string} tooltip
   * @vue-prop {string} [tooltip-position='left']
   */
  export default {
    name: 'OrientationToolsButton',
    components: {
      VCard,
      VIcon,
      VTooltip,
    },
    props: {
      icon: {
        type: String,
        required: true,
      },
      tooltip: {
        type: String,
        required: true,
      },
      tooltipPosition: {
        type: String,
        default: 'left',
      },
    },
    setup() {
      const fontSize = useFontSize();

      const iconSize = useIconSize();
      const height = computed(() => {
        return fontSize.value * 2.5;
      });
      // 32px
      const width = computed(() => {
        return fontSize.value * 2.5;
      });

      return {
        iconSize,
        height,
        width,
      };
    },
  };
</script>
<style lang="scss" scoped></style>
