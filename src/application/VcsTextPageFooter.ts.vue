<template v-if="textPage.title">
  <span
    class="d-inline-block text-truncate mr-1 flex-shrink-0 vcs-text-page-footer"
  >
    <span v-if="textPage.url" class="text-page-footer">
      <a :href="$st(String(textPage.url))" target="_blank"
        >{{ $st(textPage.title) }} <span></span>
      </a>
    </span>

    <span
      v-else
      class="text-page-footer cursor-pointer text-decoration-underline"
      @click="addTextPage()"
    >
      {{ $st(textPage.title) }}
    </span>
    <v-tooltip
      v-if="$st(textPage.tooltip)"
      :text="$st(textPage.tooltip)"
      activator="parent"
      location="top"
    />
  </span>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent, inject } from 'vue';
  import { VTooltip } from 'vuetify/components';
  import type VcsUiApp from '../vcsUiApp.js';
  import VcsTextPage from './VcsTextPage.ts.vue';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import type { TextPageType } from '../uiConfig.js';

  /**
   * A Footer element opening either an URL in a new tab or a WindowComponent with provided content
   * textPage title, tooltip and the url can also be i18n keys, and will be translated.
   * @vue-prop {import("../uiConfig.js").TextPageType} [textPage]
   * @vue-prop {string} windowId
   */
  export default defineComponent({
    name: 'VcsTextPageFooter',
    components: { VTooltip },
    props: {
      textPage: {
        type: Object as PropType<TextPageType>,
        default: () => {},
      },
      windowId: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp') as VcsUiApp;
      const { content } = props.textPage;

      function addTextPage(): void {
        if (!app.windowManager.has(props.windowId)) {
          app.windowManager.add(
            {
              id: props.windowId,
              component: VcsTextPage,
              state: { headerTitle: props.textPage.title },
              slot: 'dynamicRight',
              position: { width: 600 },
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
  });
</script>

<style lang="scss" scoped>
  .text-page-footer {
    font-size: smaller !important;
    display: flex;
    align-items: center;
    a {
      color: var(--v-text-color);
      display: flex;
      align-items: center;
    }
  }
</style>
