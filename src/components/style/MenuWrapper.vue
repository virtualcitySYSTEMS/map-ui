<template>
  <v-sheet>
    <div class="d-flex align-center py-1">
      <VcsCheckbox
        :value="!!value"
        @change="handleCheckbox"
        :disabled="disabled"
      />
      <v-menu
        :close-on-content-click="false"
        :close-on-click="false"
        v-model="isMenuOpen"
        :absolute="true"
        :disabled="!value || disabled"
        min-width="300"
        max-width="300"
      >
        <template #activator="{ on, attrs }">
          <VcsTooltip :tooltip="name">
            <template #activator="{ on: tooltipOn, attrs: tooltipAttrs }">
              <v-card
                rounded
                height="24px"
                width="32px"
                v-bind="{ ...attrs, ...tooltipAttrs }"
                v-on="{ ...on, ...tooltipOn }"
                class="tiled-background"
              >
                <slot name="preview" />
              </v-card>
            </template>
          </VcsTooltip>
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
      <span class="ml-2">{{ $t(name) }}</span>
    </div>
  </v-sheet>
</template>

<script>
  import { ref } from 'vue';
  import { VSheet, VMenu, VCard } from 'vuetify/lib';
  import VcsFormSection from '../form-inputs-controls/VcsFormSection.vue';
  import VcsCheckbox from '../form-inputs-controls/VcsCheckbox.vue';
  import VcsTooltip from '../notification/VcsTooltip.vue';

  /**
   * @description A wrapper for style components, that provides:
   * - a 32 x 24 px preview
   * - a checkbox that emits null when unchecked and the value of the valueDefault prop when checked again. If the vauleDefault is undefined or null, the valueFallback will be emitted.
   * - a menu that pops up when clicking the preview. It has also a reset button that emits the value of the valueDefault prop when clicked
   * @vue-prop {Object} [value] - Style options that are modelled by the checkbox.
   * @vue-prop {string} name - The name that is displayed in the header of the menu and in the tooltip of the preview.
   * @vue-prop {Object} [valueDefault] - The default Options, that are applied when clicking reset or setting the checkbox from null to true.
   * @vue-prop {Object} valueFallback - The fallback Options, in case the valueDefault is null or undefined. These are applied when the checkbox is checked again and the default value is null. The fallback value must not be null or undefined.
   */
  export default {
    name: 'MenuWrapper',
    components: {
      VSheet,
      VMenu,
      VCard,
      VcsFormSection,
      VcsTooltip,
      VcsCheckbox,
    },
    props: {
      value: {
        default: undefined,
        required: false,
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
    setup(props, { emit }) {
      const isMenuOpen = ref(false);

      return {
        isMenuOpen,
        reset() {
          emit('input', props.valueDefault);
        },
        close() {
          isMenuOpen.value = false;
        },
        handleCheckbox(value) {
          emit(
            'input',
            value ? props.valueDefault || props.valueFallback : null,
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
