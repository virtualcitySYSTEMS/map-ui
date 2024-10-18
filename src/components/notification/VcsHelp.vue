<template>
  <div
    v-if="$slots.default || text"
    class="ma-0 font-weight-regular rounded-0 bg-base-lighten-4 vcs-help"
  >
    <v-container class="py-1 px-2 vcs-help">
      <slot>
        <span>{{ $st(text) }}</span>
      </slot>
    </v-container>
  </div>
</template>
<style lang="scss">
  .vcs-help {
    box-sizing: border-box;
    ol,
    ul {
      padding-left: 16px; /* Indentation for list items */
    }
  }
</style>
<script>
  import { VContainer } from 'vuetify/components';

  /**
   * @description A component for displaying help.
   * @vue-data {slot} [#default] - Slot to specify html based help. Gets precedence over text prop.
   * @vue-prop {string} [text] - Optional help text. Must be plain string. Use 'help' slot for html based help texts. Help slot has precedence over text prop.
   */
  export default {
    name: 'VcsHelp',
    components: {
      VContainer,
    },
    props: {
      text: {
        type: String,
        default: undefined,
      },
    },
  };
</script>
