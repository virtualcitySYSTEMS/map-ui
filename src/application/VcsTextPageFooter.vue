<template v-if="textPage.title">
  <span
    class="d-inline-block text-truncate mr-1 flex-shrink-0 vcs-text-page-footer"
  >
    <span v-if="textPage.url" class="text-page-footer">
      <a :href="$st(textPage.url)" target="_blank"
        >{{ $st(textPage.title) }} <span></span>
      </a>
    </span>

    <span
      v-else
      class="text-page-footer cursor-pointer text-decoration-underline"
      @click="addTextPage()"
      >{{ $st(textPage.title) }}</span
    >
    <v-tooltip
      :text="$st(textPage.tooltip)"
      activator="parent"
      location="top"
    />
  </span>
</template>

<style lang="scss" scoped>
  .text-page-footer {
    font-size: smaller;
    a {
      color: var(--v-text-color);
    }
  }
</style>

<script>
  import { inject } from 'vue';
  import { VTooltip } from 'vuetify/components';
  import VcsTextPage from './VcsTextPage.vue';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import { WindowSlot } from '../manager/window/windowManager.js';

  /**
   * A Footer element opening either an URL in a new tab or a WindowComponent with provided content
   * textPage title, tooltip and the url can also be i18n keys, and will be translated.
   * @vue-prop {import("../uiConfig.js").TextPageType} [textPage]
   * @vue-prop {string} windowId
   */
  export default {
    name: 'VcsTextPageFooter',
    components: { VTooltip },
    props: {
      textPage: {
        type: Object,
        default: () => {},
      },
      windowId: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp');
      const { content } = props.textPage;

      function addTextPage() {
        if (!app.windowManager.has(props.windowId)) {
          app.windowManager.add(
            {
              id: props.windowId,
              component: VcsTextPage,
              state: {
                headerTitle: props.textPage.title,
              },
              slot: WindowSlot.DYNAMIC_RIGHT,
              position: {
                width: 600,
              },
              props: { content },
            },
            vcsAppSymbol,
          );
        } else {
          app.windowManager.remove(props.windowId);
        }
      }

      return {
        addTextPage,
      };
    },
  };
</script>
