<template>
  <v-sheet class="vcs-stroke-selector">
    <v-container class="px-1 py-0">
      <v-row no-gutters>
        <v-col>
          <VcsLabel :html-for="`${cid}-draw-stroke-width`">
            {{ $st('components.style.lineWidth') }}
          </VcsLabel>
        </v-col>
        <v-col cols="3">
          <VcsTextField
            :id="`${cid}-draw-stroke-width`"
            v-model.number="width"
            hide-spin-buttons
            type="number"
            unit="px"
            :disabled="!modelValue"
          />
        </v-col>
      </v-row>
    </v-container>
    <v-color-picker
      :model-value="rgbaObject"
      @update:model-value="updateColor"
      mode="rgba"
      :disabled="!modelValue"
      width="100%"
    />
  </v-sheet>
</template>

<script lang="ts">
  import { computed, defineComponent } from 'vue';
  import type { PropType } from 'vue';
  import type { Options as StrokeOptions } from 'ol/style/Stroke.js';
  import {
    VSheet,
    VColorPicker,
    VContainer,
    VRow,
    VCol,
  } from 'vuetify/components';
  import { useComponentId } from '../composables.js';
  import VcsLabel from '../form-inputs-controls/VcsLabel.ts.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.ts.vue';
  import { useColorObject } from './composables.js';
  import { useProxiedComplexModel } from '../modelHelper.js';

  /**
   * @description Allows to model a JSON representation of ol/Stroke vector style with a vuetify VColorPicker.
   * @vue-prop {import("ol/style/Stroke").Options} [modelValue] - The Stroke Options
   */
  export default defineComponent({
    name: 'VcsStrokeSelector',
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
        type: Object as PropType<StrokeOptions>,
        default: () => ({}),
      },
    },
    setup(props, { emit }) {
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);
      const cid = useComponentId();
      return {
        rgbaObject: useColorObject(() => localValue.value?.color),
        width: computed({
          get: () => localValue.value?.width,
          set(value) {
            if (!!value && value > 0 && value !== localValue.value?.width) {
              localValue.value.width = value;
            }
          },
        }),
        updateColor(rgba: {
          r: number;
          g: number;
          b: number;
          a?: number;
        }): void {
          // Ensures alpha is not null, e.g. when the color is set by the user by pastying a color code.
          localValue.value.color = [rgba.r, rgba.g, rgba.b, rgba.a ?? 1];
        },
        cid,
      };
    },
  });
</script>
