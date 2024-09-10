<template>
  <v-card
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="dropped"
    class="d-flex justify-center drop-field vcs-file-drop"
    :class="{ dragging: isDragging }"
    :dragging="isDragging"
    flat
    v-bind="$attrs"
  >
    <slot>
      <v-card-title class="d-flex align-center text-primary">{{
        $st(title)
      }}</v-card-title>
    </slot>
  </v-card>
</template>

<script>
  import { VCard, VCardTitle } from 'vuetify/components';
  import { ref } from 'vue';

  /**
   * A component providing a file drop area based on  {@link https://vuetifyjs.com/en/api/v-card/|vuetify v-card}
   * @vue-props {Array<File>} [modelValue=[]] - The model containing dropped files
   * @vue-props {string} [title] - Option to override the drop areas default title
   * @vue-prop {boolean} [multiple=true] - allows or disallows importing multiple files at once
   */
  export default {
    name: 'VcsFileDrop',
    components: {
      VCard,
      VCardTitle,
    },
    props: {
      modelValue: {
        type: Array,
        default: () => [],
      },
      title: {
        type: String,
        default: 'components.import.fileDrop',
      },
      multiple: {
        type: Boolean,
        default: true,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const isDragging = ref(false);

      return {
        isDragging,
        dropped(event) {
          isDragging.value = false;
          if (event.dataTransfer?.files) {
            const files = [];
            for (let i = 0; i < event.dataTransfer.files.length; i++) {
              files.push(event.dataTransfer.files[i]);
            }
            emit('update:modelValue', props.multiple ? files : files[0]);
          }
        },
      };
    },
  };
</script>

<style scoped lang="scss">
  .drop-field {
    margin: 8px 8px;
    outline: 2px dashed rgb(var(--v-theme-primary));
    border-radius: 4px;
    background-color: rgb(var(--v-theme-base-lighten-4));
  }

  .dragging {
    background-color: rgb(var(--v-theme-primary-lighten-3));
  }
</style>
