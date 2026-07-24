<template>
  <v-card flat class="pa-2 vcs-import-component">
    <vcs-file-drop
      :height="dropElementHeight"
      :multiple="multiple"
      v-model="files"
    />
    <vcs-file-input
      :loading="loading"
      :multiple="multiple"
      :accept="fileTypes.join(',')"
      v-bind="noListenerAttrs"
      v-model="files"
    />
    <slot />
    <div class="d-flex justify-end gc-1 mx-3 pt-2 pb-1">
      <vcs-form-button
        variant="filled"
        :disabled="files.length === 0"
        @click="doImport"
      >
        {{ $st('components.import.submit') }}
      </vcs-form-button>
      <vcs-form-button @click="$emit('close')">
        {{ $st('components.cancel') }}
      </vcs-form-button>
    </div>
  </v-card>
</template>

<script lang="ts">
  import { VCard } from 'vuetify/components';
  import type { PropType } from 'vue';
  import { computed, defineComponent, inject, ref } from 'vue';
  import { getCaughtError } from '@vcmap/core';
  import { removeListenersFromAttrs } from '../attrsHelpers.js';
  import { useFontSize } from '../../vuePlugins/vuetify.js';
  import VcsFileDrop from './VcsFileDrop.ts.vue';
  import VcsFormButton from '../buttons/VcsFormButton.ts.vue';
  import VcsFileInput from '../form-inputs-controls/VcsFileInput.ts.vue';
  import { NotificationType } from '../../notifier/notifier.js';
  import type VcsUiApp from '../../vcsUiApp.js';

  /**
   * A component providing an import functionality for files
   * @vue-prop {function(Array<File>):boolean} importFiles - the callback to
   * @vue-prop {string[]} [fileTypes=[]] - accepted file types, see https://html.spec.whatwg.org/multipage/input.html#attr-input-accept
   * @vue-prop {boolean} [multiple=true] - allows or disallows importing multiple files at once
   * @vue-data {#default} - Slot to add additional html after file input and before the buttons
   */
  export default defineComponent({
    name: 'VcsImportComponent',
    components: { VcsFormButton, VcsFileInput, VCard, VcsFileDrop },
    props: {
      importFiles: {
        type: Function,
        required: true,
      },
      fileTypes: {
        type: Array as PropType<string[]>,
        default: () => [],
      },
      multiple: {
        type: Boolean,
        default: true,
      },
    },
    emits: ['close'],
    setup(props, { attrs, emit }) {
      const app = inject('vcsApp') as VcsUiApp;
      const localFiles = ref<File[]>([]);
      const loading = ref(false);
      const files = computed<File[]>({
        get() {
          return localFiles.value;
        },
        set(value) {
          localFiles.value = Array.isArray(value) ? value : [value];
        },
      });

      const noListenerAttrs = computed(() => removeListenersFromAttrs(attrs));

      const fontSize = useFontSize();
      const dropElementHeight = computed(() => {
        return fontSize.value * 6 + 18;
      });

      return {
        files,
        loading,
        noListenerAttrs,
        dropElementHeight,
        async doImport(): Promise<void> {
          loading.value = true;
          try {
            const close = await props.importFiles(files.value);
            if (close) {
              emit('close');
            }
          } catch (e: unknown) {
            app.notifier.add({
              type: NotificationType.ERROR,
              message: getCaughtError(e).message,
            });
          } finally {
            loading.value = false;
          }
        },
      };
    },
  });
</script>

<style scoped></style>
