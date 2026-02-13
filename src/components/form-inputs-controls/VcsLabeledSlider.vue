<template>
  <div class="vcs-labeled-slider">
    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel
          :html-for="`${cid}-${label}`"
          v-bind="$attrs"
          :help-text="tooltip"
          class="pt-1 gc-2"
        >
          {{ $t(label) }}
        </VcsLabel>
      </v-col>
      <v-col :cols="textInputCols">
        <VcsTextField
          v-if="allowTextInput"
          type="number"
          v-bind="$attrs"
          v-model.number="localValue"
        />
        <div v-else class="d-flex align-center justify-end">
          {{ getVisibleValue(localValue) }}
        </div>
      </v-col>
    </v-row>
    <v-row no-gutters class="slider-container">
      <VcsSlider
        :id="`${cid}-${label}`"
        v-bind="$attrs"
        v-model.number="localValue"
      />
    </v-row>
  </div>
</template>

<script>
  import { VCol, VRow } from 'vuetify/components';
  import VcsTextField from './VcsTextField.vue';
  import VcsLabel from './VcsLabel.vue';
  import VcsSlider from './VcsSlider.vue';
  import { useProxiedAtomicModel } from '../modelHelper.js';
  import { useComponentId } from '../composables.js';

  /**
   * @description stylized component, rendering a row with a label and an inputfield, and another with a slider.
   * @vue-prop {number} modelValue - The value modeled by the slider and inputfield.
   * @vue-prop {string} label - The title of the value to be modeled. Will be translated.
   * @vue-prop {string} [tooltip] - An optional tooltip for the label.
   * @vue-prop {boolean} [allowTextInput=false] - Whether to allow the value to be manually set in an inputfield.
   * @vue-prop {number} [textInputCols=6] - The number of columns the text input should take (out of 12).
   * All other props will be forwarded to the slider and inputfield (if allowTextInput is true). E.g. min, max, step, disabled and unit can be provided to the component.
   */
  export default {
    name: 'VcsLabeledSlider',
    components: {
      VCol,
      VRow,
      VcsLabel,
      VcsSlider,
      VcsTextField,
    },
    props: {
      modelValue: { type: Number, required: true },
      label: { type: String, required: true },
      tooltip: { type: String, default: undefined },
      allowTextInput: { type: Boolean, default: false },
      textInputCols: { type: Number, default: 6 },
    },
    emits: ['update:modelValue'],
    setup(props, { attrs, emit }) {
      const cid = useComponentId();
      const localValue = useProxiedAtomicModel(props, 'modelValue', emit);

      function getVisibleValue(value) {
        if (Number.isFinite(value)) {
          const unitText = attrs.unit ? ` ${attrs.unit}` : '';
          return `${value}${unitText}`;
        }
        return '';
      }

      return {
        cid,
        localValue,
        getVisibleValue,
      };
    },
  };
</script>

<style lang="scss" scoped>
  .slider-container {
    padding-inline: 2px;
    overflow: hidden;
    :deep(.vcs-slider) {
      overflow: visible !important;
    }
  }
</style>
