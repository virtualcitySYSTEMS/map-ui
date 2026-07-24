<template>
  <v-dialog
    v-model="show"
    class="vcs-loading-overlay"
    :max-width="maxWidth"
    :persistent="persistent"
  >
    <v-card class="pa-1">
      <v-card-title v-if="title" class="title loading">
        {{ $st(title) }}
      </v-card-title>
      <v-card-text v-if="text" class="px-4">
        {{ $st(text) }}
      </v-card-text>
      <div class="d-flex justify-end px-4" v-if="hasProgress">
        {{ localProgress }}%
      </div>
      <div class="px-4 pb-1 pt-2">
        <v-progress-linear
          :model-value="localProgress"
          :indeterminate="!hasProgress"
          rounded
        />
      </div>
      <template #actions v-if="cancellable">
        <div class="pa-2">
          <VcsFormButton @click="show = false">
            {{ $st('components.cancel') }}
          </VcsFormButton>
        </div>
      </template>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
  import {
    VDialog,
    VCard,
    VCardText,
    VProgressLinear,
    VCardTitle,
  } from 'vuetify/components';
  import type { PropType, Ref } from 'vue';
  import { computed, defineComponent, ref, watch } from 'vue';
  import VcsFormButton from '../buttons/VcsFormButton.ts.vue';

  /**
   * @description Basic overlay to display a progress bar on a VCard, with optional text and cancel button.
   * @vue-prop {import("vue").Ref<number>|undefined} [progress] - The current progress value, between 0 and 1.
   * @vue-prop {string} [title] - The title of the overlay. Will be translated.
   * @vue-prop {string} [text=''] - Optional text to display in the overlay. Will be translated.
   * @vue-prop {boolean} [cancellable=true] - Whether the overlay can be cancelled by the user.
   * @vue-prop {string|number} [maxWidth='500'] - Optional max-width for the dialog.
   * @vue-prop {boolean} [persistent=true] - Whether the dialog should be persistent (not dismissible by clicking outside).
   */
  export default defineComponent({
    name: 'VcsLoadingOverlay',
    components: {
      VDialog,
      VCard,
      VCardTitle,
      VCardText,
      VProgressLinear,
      VcsFormButton,
    },
    props: {
      progress: {
        type: Object as PropType<Ref<number>>,
        default: undefined,
      },
      title: {
        type: String,
        default: '',
      },
      text: {
        type: String,
        default: '',
      },
      cancellable: {
        type: Boolean,
        default: true,
      },
      maxWidth: {
        type: [String, Number],
        default: '500px',
      },
      persistent: {
        type: Boolean,
        default: true,
      },
    },
    emits: ['cancel'],
    setup(props, { emit }) {
      const show = ref(true);
      watch(show, () => {
        if (!show.value) {
          emit('cancel');
        }
      });
      return {
        show,
        hasProgress: props.progress !== undefined,
        localProgress: computed(() => {
          if (props.progress && props.progress.value !== undefined) {
            return Math.round(props.progress.value * 100);
          }
          return 0;
        }),
      };
    },
  });
</script>

<style scoped lang="scss">
  .title {
    font-size: calc(var(--v-vcs-font-size) * 1.2);
  }

  .loading:after {
    content: ' .';
    animation: dots 2s steps(4, end) infinite;
  }
  @keyframes dots {
    0%,
    100% {
      content: '';
    }
    25% {
      content: '.';
    }
    50% {
      content: '..';
    }
    75% {
      content: '...';
    }
  }
</style>
