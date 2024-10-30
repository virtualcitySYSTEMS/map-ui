<template>
  <v-sheet class="vcs-stroke-selector">
    <v-container class="px-1 py-0">
      <v-row no-gutters>
        <v-col>
          <VcsLabel :html-for="`${cid}-draw-stroke-width`">
            {{ $t('components.style.lineWidth') }}
          </VcsLabel>
        </v-col>
        <v-col cols="3">
          <VcsTextField
            :id="`${cid}-draw-stroke-width`"
            v-model.number="width"
            :hide-spin-buttons="true"
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

<script>
  import { computed } from 'vue';
  import {
    VSheet,
    VColorPicker,
    VContainer,
    VRow,
    VCol,
  } from 'vuetify/components';
  import { useComponentId } from '../composables.js';
  import VcsLabel from '../form-inputs-controls/VcsLabel.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';
  import { useColorObject } from './composables.js';
  import { useProxiedComplexModel } from '../modelHelper.js';

  /**
   * @description Allows to model a JSON representation of ol/Stroke vector style with a vuetify VColorPicker.
   * @vue-prop {import("ol/style/Stroke").Options} [modelValue] - The Stroke Options
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
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);
      const cid = useComponentId();
      return {
        rgbaObject: useColorObject(() => localValue.value?.color),
        width: computed({
          get() {
            return localValue.value?.width;
          },
          set(value) {
            if (value > 0 && value !== localValue.value?.width) {
              localValue.value.width = value;
            }
          },
        }),
        updateColor(rgba) {
          localValue.value.color = [rgba.r, rgba.g, rgba.b, rgba.a ?? 1];
        },
        cid,
      };
    },
  };
</script>
