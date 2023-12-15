<template>
  <span class="d-inline-block text-truncate mr-10 setmargin">
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
  import VcsTextPage from './VcsTextPage.vue';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import { WindowSlot } from '../manager/window/windowManager.js';

  export default {
    name: 'VcsTextPageFooter',
    components: {},
    props: {
      textPage: {
        type: Object,
        required: true,
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
      }

      return {
        addTextPage,
      };
    },
  };
</script>
