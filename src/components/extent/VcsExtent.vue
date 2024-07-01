<template>
  <v-container class="py-0 px-1">
    <v-row no-gutters v-if="modelValue.projection">
      <v-col :cols="firstCols">
        <VcsLabel html-for="projection">
          {{ $t('components.extent.projection') }}
        </VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField
          id="projection"
          disabled
          :model-value="modelValue.projection.epsg"
        />
      </v-col>
    </v-row>
    <VcsCoordinate
      hide-z
      v-model="min"
      :disabled="disabled"
      :axis-rules="[
        [(v) => checkInput(v, max[0])],
        [(v) => checkInput(v, max[1])],
      ]"
    >
      <template #prepend="{ prefixes }">
        <v-col :cols="firstCols">
          <VcsLabel :html-for="`${prefixes[0]}-coordinate`">
            {{ $t('components.extent.min') }}
          </VcsLabel>
        </v-col>
      </template>
    </VcsCoordinate>
    <VcsCoordinate
      hide-z
      v-model="max"
      :disabled="disabled"
      :axis-rules="[
        [(v) => checkInput(min[0], v)],
        [(v) => checkInput(min[1], v)],
      ]"
    >
      <template #prepend="{ prefixes }">
        <v-col :cols="firstCols">
          <VcsLabel :html-for="`${prefixes[0]}-coordinate`">
            {{ $t('components.extent.max') }}
          </VcsLabel>
        </v-col>
      </template>
    </VcsCoordinate>
  </v-container>
</template>

<script>
  import { computed, toRaw } from 'vue';
  import { VCol, VContainer, VRow } from 'vuetify/components';
  import { Extent } from '@vcmap/core';
  import VcsLabel from '../form-inputs-controls/VcsLabel.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';
  import VcsCoordinate from '../form-inputs-controls/VcsCoordinate.vue';
  import { useProxiedComplexModel } from '../modelHelper.js';

  function checkInput(min, max) {
    return min < max || 'components.extent.invalid';
  }

  /**
   * An input for modelling @vcmap/core ExtentOptions
   * @vue-prop {import("@vcmap/core").ExtentOptions} [modelValue] - the extent options to be modeled.
   * @vue-prop {boolean} [disabled=false] - Disable coordinate input.
   * @vue-prop {number} [firstCols=4] - Property to set the column distribution. Default is 4 (one-third/two-third). Use 6 for half-half.
   */
  export default {
    name: 'VcsExtent',
    inheritAttrs: false,
    components: {
      VcsCoordinate,
      VContainer,
      VRow,
      VCol,
      VcsLabel,
      VcsTextField,
    },
    props: {
      modelValue: {
        type: Object,
        default: () => new Extent().toJSON(),
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      firstCols: {
        type: Number,
        default: 4,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);

      const getCoordinate = (start, end = 4) =>
        computed({
          get() {
            return localValue.value.coordinates.slice(start, end);
          },
          set(value) {
            const clone = structuredClone(toRaw(localValue.value));
            clone.coordinates[start] = value[0];
            clone.coordinates[end - 1] = value[1];
            if (Extent.validateOptions(clone)) {
              localValue.value = clone;
            }
          },
        });

      return {
        min: getCoordinate(0, 2),
        max: getCoordinate(2),
        checkInput,
      };
    },
  };
</script>

<style scoped></style>
