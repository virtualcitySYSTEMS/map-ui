<template>
  <v-sheet>
    <v-container class="px-1 py-0">
      <v-row no-gutters>
        <v-col>
          <VcsLabel html-for="draw-stroke-width">
            {{ $t('components.style.lineWidth') }}
          </VcsLabel>
        </v-col>
        <v-col cols="3">
          <VcsTextField
            id="draw-stroke-width"
            v-model.number="width"
            type="number"
            unit="px"
            :disabled="!value"
          />
        </v-col>
      </v-row>
    </v-container>
    <v-color-picker
      :model-value="rgbaObject"
      @update:model-value="updateColor"
      mode="rgba"
      :disabled="!value"
    />
  </v-sheet>
</template>

<script>
  import { computed } from 'vue';
  import {
    VSheet,
    VColorPicker,
    VContainer,
    VRow,
    VCol,
  } from 'vuetify/components';
  import VcsLabel from '../form-inputs-controls/VcsLabel.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';
  import { useColorObject } from './composables.js';

  /**
   * @description Allows to model a JSON representation of ol/Stroke vector style with a vuetify VColorPicker.
   * @vue-prop {import("ol/style/Stroke").Options} value - The Stroke Options
   */
  export default {
    name: 'VcsFillSelector',
    components: {
      VSheet,
      VColorPicker,
      VContainer,
      VRow,
      VCol,
      VcsLabel,
      VcsTextField,
    },
    props: {
      modelValue: {
        type: Object,
        default: undefined,
      },
    },
    setup(props, { emit }) {
      return {
        rgbaObject: useColorObject(() => props.modelValue?.color),
        width: computed({
          get() {
            return props.modelValue?.width;
          },
          set(value) {
            if (value > 0 && value !== props.modelValue?.width) {
              const stroke = {
                width: value,
              };
              if (props.modelValue?.color) {
                stroke.color = [...props.modelValue.color];
              }
              emit('update:modelValue', stroke);
            }
          },
        }),
        updateColor(rgba) {
          const stroke = {
            color: [rgba.r, rgba.g, rgba.b, rgba.a],
            width: props.modelValue?.width,
          };
          emit('update:modelValue', stroke);
        },
      };
    },
  };
</script>
