<template>
  <section class="vcs-form-section">
    <slot name="header" :heading="heading" :actions="actions">
      <div class="vcs-form-section-header d-flex base lighten-3">
        <div class="d-flex justify-space-between w-full">
          <div class="d-flex align-center" :class="{ 'px-2': !expandable }">
            <v-btn
              :ripple="false"
              dense
              plain
              icon
              small
              text
              :disabled="disabled"
              elevation="0"
              @click="open = !open"
              v-if="expandable"
            >
              <v-icon>{{
                open ? 'mdi-chevron-down' : 'mdi-chevron-right'
              }}</v-icon>
            </v-btn>
            <strong :class="{ 'text--disabled': disabled }">{{
              $t(heading)
            }}</strong>
          </div>
          <VcsActionButtonList
            :actions="actions"
            :overflow-count="actionButtonListOverflowCount"
            class="pa-2"
            :disabled="disabled"
          />
        </div>
      </div>
    </slot>
    <VcsHelp :text="helpText" :show="showHelp" class="base lighten-4">
      <slot name="help" />
    </VcsHelp>
    <article class="section-content" v-if="showContent">
      <slot />
    </article>
  </section>
</template>

<script>
  import { computed, reactive, ref } from 'vue';
  import { VBtn, VIcon } from 'vuetify/lib';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import VcsHelp from '../notification/VcsHelp.vue';

  /**
   * @description
   * Stylized form section with action buttons
   * @vue-data {slot} [#header] - slot to override form section header
   * @vue-data {slot} [#default] - slot with the section content
   * @vue-data {slot} [#help] - Slot to specify html based help. Gets precedence over helpText prop.
   * @vue-prop {string} heading - Title of the section to be displayed, will be translated.
   * @vue-prop {boolean} [expandable=false] - If true, section can be toggled.
   * @vue-prop {boolean} [startOpen=false] - If section starts open.
   * @vue-prop {boolean} [disabled=false] - If expansion is disabled. Title is rendered in disabled style.
   * @vue-prop {Array<VcsAction>}    headerActions - Icons to be displayed on the right side
   * @vue-prop {number} [actionButtonListOverflowCount] - overflow count to use for action lists in the title and items
   * @vue-prop {string} [helpText] - Optional help text. Must be plain string. Use 'help' slot for html based help texts. Help slot has precedence over helpText prop.
   * @vue-computed {Array<VcsAction>} actions - Returns header actions extended by a help action, if help prop is passed or help slot is used.
   */
  export default {
    name: 'VcsFormSection',
    components: {
      VBtn,
      VIcon,
      VcsActionButtonList,
      VcsHelp,
    },
    props: {
      heading: {
        type: String,
        default: undefined,
      },
      expandable: {
        type: Boolean,
        default: false,
      },
      startOpen: {
        type: Boolean,
        default: false,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      headerActions: {
        type: Array,
        default: () => [],
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
      const open = ref(props.startOpen);
      const showContent = computed(() => {
        if (props.expandable) {
          return open.value;
        }
        return true;
      });
      const helpAction = reactive({
        name: 'help',
        title: 'components.vcsFormSection.help',
        active: false,
        icon: 'mdi-help-circle',
        callback() {
          this.active = !this.active;
        },
      });
      const showHelp = computed(() => helpAction.active);
      /**
       * @type {import("vue").ComputedRef<VcsAction>}
       */
      const actions = computed(() => {
        if (props.helpText || (slots.help && slots.help().length > 0)) {
          return [helpAction, ...props.headerActions];
        }
        return props.headerActions;
      });

      return {
        open,
        showContent,
        showHelp,
        actions,
      };
    },
  };
</script>

<style lang="scss" scoped>
  @import '../../styles/shades.scss';
  .vcs-form-section-header {
    height: 40px;
  }
  .v-alert--text:before {
    background-color: transparent;
  }
</style>
