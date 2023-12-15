<template>
  <span class="d-inline-block text-truncate mr-10">
    <span
      v-for="attribution in mergedAttributions"
      class="attribution-span"
      :key="attribution.provider"
    >
      <a :href="attribution.url" target="_blank"
        >{{ $t(attribution.provider) }} <span>{{ attribution.years }}</span>
      </a>
    </span>
    <VcsButton
      :key="attributionAction.name"
      :tooltip="attributionAction.title"
      :icon="attributionAction.icon"
      :active="attributionAction.active"
      :disabled="attributionAction.disabled"
      @click.stop="attributionAction.callback($event)"
    />
  </span>
</template>

<style lang="scss" scoped>
  .attribution-wrap .vcs-button-wrap {
    bottom: 3px;
  }

  a:before {
    content: '\00a9\00a0';
  }
  .attribution-span {
    font-size: smaller;
    &:before {
      content: '\00a0\007c\00a0';
    }
    &:first-child::before {
      content: '';
    }
    span {
      font-size: inherit;
    }
  }
</style>

<script>
  import { computed } from 'vue';
  import { mergeAttributions } from './attributionsHelper.js';
  import VcsButton from '../components/buttons/VcsButton.vue';

  /**
   * @description Lists attributions of maps, layers and oblique collections within the footer
   * @vue-prop {import("vue").Ref<Array<AttributionEntry>} entries - array with one entry per active VcsObject
   * @vue-prop {VcsAction} attributionAction - action to open attribution window
   * @vue-computed {Array<{provider: string, years: string, url: URL}>} mergedAttributions - array with one entry per provider
   */
  export default {
    name: 'VcsAttributionsFooter',
    components: {
      VcsButton,
    },
    props: {
      entries: {
        type: Array,
        required: true,
      },
      attributionAction: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      const mergedAttributions = computed(() =>
        mergeAttributions(props.entries),
      );
      return {
        mergedAttributions,
      };
    },
  };
</script>
