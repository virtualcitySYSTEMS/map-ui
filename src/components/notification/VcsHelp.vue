<template>
  <v-alert
    :value="show"
    dense
    text
    class="mb-0 font-weight-regular rounded-0 px-2 pt-2"
  >
    <slot>
      <span>{{ $t(text) }}</span>
    </slot>
  </v-alert>
</template>

<script>
  import { VAlert } from 'vuetify/lib';

  /**
   * @description Wraps Vuetify VAlert for displaying help.
   * @vue-data {slot} [#default] - Slot to specify html based help. Gets precedence over text prop.
   * @vue-prop {boolean} show - If help should be displayed. If false, component is completely hidden.
   * @vue-prop {string} [text] - Optional help text. Must be plain string. Use 'help' slot for html based help texts. Help slot has precedence over text prop.
   */
  export default {
    name: 'VcsHelp',
    components: {
      VAlert,
    },
    props: {
      text: {
        type: String,
        default: undefined,
      },
      show: {
        type: Boolean,
        required: true,
      },
    },
  };
</script>
