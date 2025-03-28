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
        >{{ $t('components.import.submit') }}</vcs-form-button
      >
      <vcs-form-button @click="$emit('close')">
        {{ $t('components.cancel') }}
      </vcs-form-button>
    </div>
  </v-card>
</template>

<script>
  import { VCard } from 'vuetify/components';
  import { computed, inject, ref } from 'vue';
  import { removeListenersFromAttrs } from '../attrsHelpers.js';
  import { useFontSize } from '../../vuePlugins/vuetify.js';
  import VcsFileDrop from './VcsFileDrop.vue';
  import VcsFormButton from '../buttons/VcsFormButton.vue';
  import VcsFileInput from '../form-inputs-controls/VcsFileInput.vue';
  import { NotificationType } from '../../notifier/notifier.js';

  /**
   * A component providing an import functionality for files
   * @vue-prop {function(Array<File>):boolean} importFiles - the callback to
   * @vue-prop {string[]} [fileTypes=[]] - accepted file types, see https://html.spec.whatwg.org/multipage/input.html#attr-input-accept
   * @vue-prop {boolean} [multiple=true] - allows or disallows importing multiple files at once
   * @vue-data {#default} - Slot to add additional html after file input and before the buttons
   */
  export default {
    name: 'VcsImportComponent',
    components: { VcsFormButton, VcsFileInput, VCard, VcsFileDrop },
    props: {
      importFiles: {
        type: Function,
        required: true,
      },
      fileTypes: {
        type: Array,
        default: () => [],
      },
      multiple: {
        type: Boolean,
        default: true,
      },
    },
    emits: ['close'],
    setup(props, { attrs, emit }) {
      const app = inject('vcsApp');
      const localFiles = ref([]);
      const loading = ref(false);
      /**
       * @type {WritableComputedRef<Array<File>>}
       */
      const files = computed({
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
        async doImport() {
          loading.value = true;
          try {
            const close = await props.importFiles(files.value);
            if (close) {
              emit('close');
            }
          } catch (e) {
            app.notifier.add({
              type: NotificationType.ERROR,
              message: String(e.message),
            });
          } finally {
            loading.value = false;
          }
        },
      };
    },
  };
</script>

<style scoped></style>
