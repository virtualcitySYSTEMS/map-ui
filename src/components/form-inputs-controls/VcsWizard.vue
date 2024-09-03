<template>
  <v-stepper-vertical v-bind="$attrs">
    <template #icon>
      <slot name="icon"><v-icon>mdi-circle</v-icon></slot>
    </template>
    <template v-for="slot of forwardSlots" #[slot]="scope">
      <slot :name="slot" v-bind="scope ?? {}" />
    </template>
  </v-stepper-vertical>
</template>

<script>
  import { VStepperVertical } from 'vuetify/labs/VStepperVertical';
  import { VIcon } from 'vuetify/components';
  import { useForwardSlots } from '../composables.js';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-stepper-vertical/ |vuetify stepper vertical}per.
   * @vue-data {slot} [#default] - Slot to add VcsWizardSteps.
   */
  export default {
    name: 'VcsWizard',
    components: {
      VStepperVertical,
      VIcon,
    },
    setup(_p, { slots }) {
      const forwardSlots = useForwardSlots(slots, ['icon']);

      return {
        forwardSlots,
      };
    },
  };
</script>
<style scoped lang="scss">
  :deep(.v-expansion-panel-title) {
    height: calc(var(--v-vcs-font-size) * 2 + 6px);
    min-height: calc(var(--v-vcs-font-size) * 2 + 6px);
    padding: 0 8px;
  }
  :deep(.v-expansion-panel-title.v-expansion-panel-title--active) {
    background-color: rgba(
      var(--v-theme-base-darken-4),
      var(--v-selected-opacity)
    );

    color: rgb(var(--v-theme-primary));

    .action-btn-wrap {
      color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
    }

    .v-expansion-panel-title__overlay:hover,
    .v-expansion-panel-title__overlay {
      background-color: rgb(var(--v-theme-base));
    }
  }
  :deep(.v-stepper-vertical-item:not(:last-child):before) {
    height: 100%;
    top: calc(var(--v-vcs-font-size) * 2 - 16px);
    left: calc(14px + var(--v-vcs-font-size) * 0.42);
    width: calc(var(--v-vcs-font-size) * 0.1);
  }
  :deep(.v-stepper-vertical-item__avatar.v-avatar) {
    background: rgb(var(--v-theme-base-darken-2));
    color: rgb(var(--v-theme-background)) !important;
    width: calc(var(--v-vcs-font-size) - 1px) !important;
    height: calc(var(--v-vcs-font-size) - 1px) !important;
    z-index: 2;
  }
  :deep(
      .v-expansion-panel-title--active .v-stepper-vertical-item__avatar.v-avatar
    ) {
    background: rgb(var(--v-theme-primary));
  }
  :deep(
      .v-stepper-vertical-item--error .v-stepper-vertical-item__avatar.v-avatar
    ) {
    background: rgb(var(--v-theme-error));
  }
  /* alignment of heading */
  :deep(.v-stepper-vertical-item__avatar.v-avatar) + div {
    width: 100%;
  }
  /* Removes padding right at header actions */
  :deep(.v-expansion-panel-title__icon) {
    display: none;
  }
  :deep(.v-stepper-vertical-item__avatar.v-avatar .v-icon) {
    font-size: calc(var(--v-vcs-font-size) - 3px) !important;
    height: calc(var(--v-vcs-font-size) - 3px) !important;
    width: calc(var(--v-vcs-font-size) - 3px) !important;
  }
  :deep(.v-avatar--start) {
    margin-inline-start: 6px;
  }
  /* button on disabled shouldn't still contain the .bg-primary class! */
  :deep(.v-btn--disabled.v-btn--variant-flat.bg-primary) {
    color: rgba(var(--v-theme-on-surface), 0.26) !important;
  }
  :deep(.v-expansion-panel__shadow) {
    box-shadow: unset;
  }
  :deep(.v-expansion-panel-text) {
    padding-left: 12px;
  }
</style>
