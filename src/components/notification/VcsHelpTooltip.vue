<template>
  <v-tooltip class="vcs-help-tooltip">
    <template #activator="{ props }">
      <v-icon :size="fontSize" v-bind="props" :icon="icon" />
    </template>
    <v-container class="py-1 px-2 vcs-help-tooltip-container">
      <slot>
        <span class="vcs-help-tooltip-text">{{ $st(text) }}</span>
      </slot>
    </v-container>
  </v-tooltip>
</template>
<script>
  import { VTooltip, VIcon, VContainer } from 'vuetify/components';
  import { useFontSize } from '../../vuePlugins/vuetify.js';

  /**
   * @description A component for displaying help as tooltip via an icon.
   * @vue-data {slot} [#default] - Slot to specify html based help. Gets precedence over text prop.
   * @vue-prop {string} [text] - Optional help text. Must be plain string. Use 'help' slot for html based help texts. Help slot has precedence over text prop.
   */
  export default {
    name: 'VcsHelpTooltip',
    components: {
      VTooltip,
      VIcon,
      VContainer,
    },
    props: {
      icon: {
        type: String,
        default: '$vcsHelp',
      },
      text: {
        type: String,
        default: undefined,
      },
    },
    setup() {
      const fontSize = useFontSize();

      return {
        fontSize,
      };
    },
  };
</script>
<style lang="scss" scoped></style>
