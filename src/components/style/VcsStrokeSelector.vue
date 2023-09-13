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
      :value="rgbaObject"
      @input="updateColor"
      mode="rgba"
      :hide-mode-switch="true"
      :disabled="!value"
    />
  </v-sheet>
</template>

<script>
  import { computed } from 'vue';
  import { VSheet, VColorPicker, VContainer, VRow, VCol } from 'vuetify/lib';
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
      value: {
        type: Object,
        default: undefined,
      },
    },
    setup(props, { emit }) {
      return {
        rgbaObject: useColorObject(() => props.value?.color),
        width: computed({
          get() {
            return props.value?.width;
          },
          set(value) {
            if (value > 0 && value !== props.value?.width) {
              const stroke = {
                width: value,
              };
              if (props.value?.color) {
                stroke.color = [...props.value.color];
              }
              emit('input', stroke);
            }
          },
        }),
        updateColor(rgba) {
          const stroke = {
            color: [rgba.r, rgba.g, rgba.b, rgba.a],
            width: props.value?.width,
          };
          emit('input', stroke);
        },
      };
    },
  };
</script>
