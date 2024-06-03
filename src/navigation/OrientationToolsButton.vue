<template>
  <VcsTooltip :tooltip-position="tooltipPosition" :tooltip="tooltip">
    <template #activator="{ props }">
      <v-card
        class="h-8 w-8 d-flex align-center justify-center text-center btn-orientation-tools"
        v-bind="{ ...$attrs, ...props }"
      >
        <v-icon size="16">{{ icon }}</v-icon>
      </v-card>
    </template>
  </VcsTooltip>
</template>
<style lang="scss" scoped>
  .btn-orientation-tools {
    &:before {
      background-color: transparent !important;
    }
  }
</style>
<script>
  import { VCard, VIcon } from 'vuetify/components';
  import VcsTooltip from '../components/notification/VcsTooltip.vue';

  /**
   * @description v-card with h & w 8. Requires an icon and binds all attributes & listeners to the v-card
   * @vue-prop {string} icon
   * @vue-prop {string} tooltip
   * @vue-prop {string} [tooltip-position='left']
   */
  export default {
    name: 'OrientationToolsButton',
    components: {
      VcsTooltip,
      VCard,
      VIcon,
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
  };
</script>
