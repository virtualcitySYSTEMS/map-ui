<template>
  <v-card flat class="pa-2">
    <file-drop elevation="4" height="60px" v-model="files" />
    <vcs-text-field
      type="file"
      v-model="files"
      :loading="loading"
      :multiple="multiple"
      :accept="fileTypes.join(',')"
    />
    <div class="d-flex justify-end gap-1 mx-3 pt-2 pb-1">
      <vcs-form-button @click="$emit('close')">
        {{ $t('components.cancel') }}
      </vcs-form-button>
      <vcs-form-button
        variant="filled"
        :disabled="files.length === 0"
        @click="doImport"
        >{{ $t('components.import.submit') }}</vcs-form-button
      >
    </div>
  </v-card>
</template>

<script>
  import { VCard } from 'vuetify/lib';
  import { computed, inject, ref } from 'vue';
  import FileDrop from './FileDrop.vue';
  import VcsFormButton from '../buttons/VcsFormButton.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';
  import { NotificationType } from '../../notifier/notifier.js';

  /**
   * @vue-prop {function(Array<File>):boolean} importFiles - the callback to
   * @vue-prop {string[]} [fileTypes=[]]
   * @vue-prop {boolean} [multiple=false]
   */
  export default {
    name: 'ImportComponent',
    components: { VcsFormButton, VcsTextField, VCard, FileDrop },
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
    setup(props, { emit }) {
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

      return {
        files,
        loading,
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
