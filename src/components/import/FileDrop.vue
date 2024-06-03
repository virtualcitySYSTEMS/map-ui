<template>
  <v-card
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="dropped"
    class="d-flex justify-center drop-field"
    :class="{ dragging: isDragging }"
    :dragging="isDragging"
    v-bind="$attrs"
  >
    <slot>
      <v-card-title>{{ $st(title) }}</v-card-title>
    </slot>
  </v-card>
</template>

<script>
  import { VCard, VCardTitle } from 'vuetify/components';
  import { ref } from 'vue';

  export default {
    name: 'FileDrop',
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
    },
    setup(_p, { emit }) {
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
            emit('update:modelValue', files);
          }
        },
      };
    },
  };
</script>

<style scoped lang="scss">
  .drop-field {
    outline: 4px dashed var(--v-base-base);
    outline-offset: -8px;
    background-color: var(--v-base-lighten4);
  }

  .dragging {
    outline-color: var(--v-primary-base);
    background-color: var(--v-base-lighten1);
  }
</style>
