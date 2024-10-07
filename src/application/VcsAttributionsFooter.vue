<template>
  <div
    class="d-flex align-center justify-end overflow-hidden vcs-attributions-footer"
  >
    <div class="attribution-container">
      <span
        v-for="attribution in mergedAttributions"
        class="attribution"
        :key="attribution.provider"
      >
        <a :href="attribution.url ? attribution.url : null" target="_blank">
          {{ $st(attribution.provider) }} <span>{{ attribution.years }}</span>
        </a>
      </span>
    </div>
    <VcsButton
      class="flex-shrink-0"
      :key="attributionAction.name"
      :tooltip="attributionAction.title"
      :icon="attributionAction.icon"
      :active="attributionAction.active"
      :disabled="attributionAction.disabled"
      @click.stop="attributionAction.callback($event)"
    />
  </div>
</template>

<style lang="scss" scoped>
  .attribution-container {
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .attribution {
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
    a {
      color: var(--v-text-color);
      &:before {
        content: '\00a9\00a0';
      }
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
