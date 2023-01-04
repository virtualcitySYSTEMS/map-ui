<template>
  <section class="vcs-form-section">
    <slot name="header" :heading="heading" :actions="actions">
      <article class="pa-2 accent">
        <div class="form-section-header d-flex justify-space-between align-center">
          <strong class="caption">{{ $t(heading) }}</strong>
          <VcsActionButtonList
            :actions="actions"
            :overflow-count="actionButtonListOverflowCount"
            small
          />
        </div>
      </article>
    </slot>
    <v-alert
      :value="showHelp"
      dense
      text
      color="secondary"
      class="ma-0"
    >
      <slot name="help">
        <span>{{ $t(helpText) }}</span>
      </slot>
    </v-alert>
    <article class="section-content">
      <slot />
    </article>
  </section>
</template>


<script>
  import { computed, reactive } from 'vue';
  import { VAlert } from 'vuetify/lib';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';

  /**
   * @description
   * Stylized form section with action buttons
   * @vue-data {slot} [#header] - slot to override form section header
   * @vue-data {slot} [#default] - slot with the section content
   * @vue-data {slot} [#help] - Slot to specify html based help. Gets precedence over helpText prop.
   * @vue-prop {string} heading - Title of the section to be displayed, will be translated.
   * @vue-prop {Array<VcsAction>}    headerActions - Icons to be displayed on the right side
   * @vue-prop {number} [actionButtonListOverflowCount] - overflow count to use for action lists in the title and items
   * @vue-prop {string} [helpText] - Optional help text. Must be plain string. Use 'help' slot for html based help texts. Help slot has precedence over helpText prop.
   * @vue-computed {Array<VcsAction>} actions - Returns header actions extended by a help action, if help prop is passed or help slot is used.
   */
  export default {
    name: 'VcsFormSection',
    components: {
      VcsActionButtonList,
      VAlert,
    },
    props: {
      heading: {
        type: String,
        default: undefined,
      },
      headerActions: {
        type: Array,
        default: () => ([]),
      },
      actionButtonListOverflowCount: {
        type: Number,
        required: false,
        default: undefined,
      },
      helpText: {
        type: String,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      const helpAction = reactive({
        name: 'help',
        title: 'components.vcsFormSection.help',
        active: false,
        icon: 'mdi-help-circle',
        callback() { this.active = !this.active; },
      });
      const showHelp = computed(() => helpAction.active);
      /**
       * @type {ComputedRef<VcsAction>}
       */
      const actions = computed(() => {
        if (props.helpText || (slots.help && slots.help().length > 0)) {
          return [helpAction, ...props.headerActions];
        }
        return props.headerActions;
      });

      return {
        showHelp,
        actions,
      };
    },
  };
</script>
