<template>
  <section class="vcs-form-section">
    <slot name="header" :heading="heading" :actions="actions">
      <div
        class="vcs-form-section-header d-flex bg-base-lighten-3"
        :aria-expanded="open"
      >
        <div class="d-flex justify-space-between w-100">
          <div class="d-flex align-center" :class="{ 'px-2': !expandable }">
            <v-btn
              :ripple="false"
              variant="text"
              icon
              :size="fontSize * 2"
              :disabled="disabled"
              elevation="0"
              @click="open = !open"
              v-if="expandable"
              :aria-expanded="open"
            >
              <v-icon>{{
                open ? 'mdi-chevron-down' : 'mdi-chevron-right'
              }}</v-icon>
            </v-btn>
            <strong :class="{ 'text-disabled': disabled }">{{
              $st(heading)
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
    <VcsHelp :text="helpText" v-if="showHelp && ($slots.help || helpText)">
      <slot name="help" />
    </VcsHelp>
    <article class="section-content" v-if="showContent">
      <slot />
    </article>
  </section>
</template>

<script>
  import { computed, reactive, ref } from 'vue';
  import { VBtn, VIcon } from 'vuetify/components';
  import { useFontSize } from '../../vuePlugins/vuetify.js';
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
   * @vue-prop {boolean} [startHelpOpen=false] - If help text starts open.
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
      startHelpOpen: {
        type: Boolean,
        default: false,
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
        active: props.startHelpOpen,
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
          return [...props.headerActions, helpAction];
        }
        return props.headerActions;
      });

      const fontSize = useFontSize();

      return {
        open,
        showContent,
        showHelp,
        actions,
        fontSize,
      };
    },
  };
</script>

<style lang="scss" scoped>
  .vcs-form-section-header {
    height: calc(var(--v-vcs-font-size) * 2 + 14px);
  }
  .v-alert--text:before {
    background-color: transparent;
  }
  // remove hover shadow over button
  :deep(.v-btn__overlay) {
    --v-hover-opacity: 0;
  }
</style>
