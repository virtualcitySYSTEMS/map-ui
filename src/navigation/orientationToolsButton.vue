<template>
  <VcsTooltip
    :tooltip-position="tooltipPosition"
    :tooltip="tooltip"
  >
    <template #activator="{ on, attrs }">
      <v-card
        elevation="2"
        class="h-8 w-8 d-flex align-center justify-center text-center btn-orientation-tools"
        v-bind="{ ...$attrs, ...attrs }"
        v-on="{ ...$listeners, ...on }"
      >
        <v-icon v-text="icon" size="16" />
      </v-card>
    </template>
  </VcsTooltip>
</template>
<style lang="scss" scoped>
.btn-orientation-tools{
  &:before{
    background-color: transparent !important;
  }
}
</style>
<script>
  import VcsTooltip from '../components/notification/VcsTooltip.vue';

  /**
   * A v-card with h & w 8. Requires an icon and binds all attributes & listeners to the v-card
   * @vue-prop {string} icon
   * @vue-prop {string} tooltip
   * @vue-prop {string} [tooltip-position='left']
   */
  export default {
    name: 'OrientationToolsButton',
    components: { VcsTooltip },
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
