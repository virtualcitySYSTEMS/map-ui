<template>
  <v-sheet>
    <div class="d-flex align-center py-1">
      <VcsCheckbox
        :model-value="!!modelValue"
        @update:modelValue="handleCheckbox"
        :disabled="disabled"
      />
      <v-menu
        :close-on-content-click="false"
        persistent
        v-model="isMenuOpen"
        :absolute="true"
        :disabled="!modelValue || disabled"
        width="300"
      >
        <template #activator="{ props }">
          <v-card
            rounded
            height="24px"
            width="32px"
            v-bind="props"
            class="tiled-background"
          >
            <slot name="preview" />
          </v-card>
        </template>
        <VcsFormSection
          :heading="name"
          :header-actions="[
            {
              name: 'reset',
              title: 'components.style.reset',
              icon: '$vcsReturn',
              callback: () => {
                reset();
              },
            },
            {
              name: 'close',
              title: 'components.close',
              icon: 'mdi-close-thick',
              callback: () => {
                close();
              },
            },
          ]"
        >
          <slot name="content" />
        </VcsFormSection>
      </v-menu>
      <span class="ml-2">{{ $st(name) }}</span>
    </div>
  </v-sheet>
</template>

<script>
  import { ref, toRaw } from 'vue';
  import { VSheet, VMenu, VCard } from 'vuetify/components';
  import VcsFormSection from '../section/VcsFormSection.vue';
  import VcsCheckbox from '../form-inputs-controls/VcsCheckbox.vue';

  /**
   * @description A wrapper for style components, that provides:
   * - a 32 x 24 px preview
   * - a checkbox that emits null when unchecked and the value of the valueDefault prop when checked again.
   *   If the valueDefault is undefined or null, the valueFallback will be emitted.
   * - a menu that pops up when clicking the preview. It has also a reset button that emits the value of the valueDefault prop when clicked
   * @vue-prop {Object} [modelValue] - Style options that are modelled by the checkbox.
   * @vue-prop {string} name - The name that is displayed in the header of the menu and in the tooltip of the preview.
   * @vue-prop {Object} [valueDefault] - The default Options, that are applied when clicking reset or setting the checkbox from null to true.
   * @vue-prop {Object} valueFallback - The fallback Options, in case the valueDefault is null or undefined. These are applied when the checkbox is checked again and the default value is null. The fallback value must not be null or undefined.
   * @vue-prop {boolean} [disabled=false] - Disable the input
   */
  export default {
    name: 'MenuWrapper',
    components: {
      VSheet,
      VMenu,
      VCard,
      VcsFormSection,
      VcsCheckbox,
    },
    props: {
      modelValue: {
        default: undefined,
        type: Object,
      },
      valueDefault: {
        default: undefined,
        type: Object,
      },
      valueFallback: {
        required: true,
        type: Object,
      },
      name: {
        required: true,
        type: String,
      },
      disabled: {
        default: false,
        type: Boolean,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const isMenuOpen = ref(false);

      return {
        isMenuOpen,
        reset() {
          emit('update:modelValue', structuredClone(toRaw(props.valueDefault)));
        },
        close() {
          isMenuOpen.value = false;
        },
        handleCheckbox(value) {
          emit(
            'update:modelValue',
            value
              ? structuredClone(toRaw(props.valueDefault)) ||
                  structuredClone(toRaw(props.valueFallback))
              : null,
          );
        },
      };
    },
  };
</script>

<style scoped>
  .tiled-background {
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVQYlWNgYGCQwoKxgqGgcJA5h3yFAAs8BRWVSwooAAAAAElFTkSuQmCC)
      repeat;
  }
</style>
