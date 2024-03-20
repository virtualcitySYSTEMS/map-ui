<template v-if="textPage.title">
  <VcsTooltip :tooltip="textPage.tooltip">
    <template #activator="{ on }">
      <span
        class="d-inline-block text-truncate mr-10 setmargin"
        v-on="{ ...$listeners, ...on }"
      >
        <span v-if="textPage.url" class="imprint-span imprint button">
          <a :href="textPage.url" class="link" target="_blank"
            >{{ $t(textPage.title) }} <span></span>
          </a>
        </span>

        <span
          v-else
          class="imprint-span imprint button link"
          @click="addTextPage()"
          >{{ $t(textPage.title) }}</span
        >
      </span>
    </template>
  </VcsTooltip>
</template>

<style lang="scss" scoped>
  .button {
    cursor: pointer !important;
  }
  .setmargin {
    margin-right: 2px !important;
  }
  .imprint {
    margin-left: 2px;
  }
  .link {
    text-decoration: underline;
  }
  .imprint-span {
    font-size: smaller;

    &:first-child::before {
      content: '';
    }
    span {
      font-size: inherit;
    }
  }
</style>

<script>
  import { inject } from 'vue';
  import VcsTooltip from '../components/notification/VcsTooltip.vue';
  import VcsTextPage from './VcsTextPage.vue';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import { WindowSlot } from '../manager/window/windowManager.js';

  /**
   * A Footer element opening either an URL in a new tab or a WindowComponent with provided content
   * @vue-prop {import("../uiConfig.js").TextPageType} [textPage]
   * @vue-prop {string} windowId
   */
  export default {
    name: 'VcsTextPageFooter',
    components: { VcsTooltip },
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
