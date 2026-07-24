<template>
  <v-row
    no-gutters
    v-if="localValue"
    class="vcs-coordinate"
    :class="{ 'py-1': !paddingProvided }"
  >
    <slot name="prepend" v-bind="{ ...$props }" />
    <template v-for="(_, idx) in localValue">
      <v-col :key="`coordinate-${idx}`" v-if="!hideZ || idx < 2">
        <VcsTextField
          :hide-spin-buttons="true"
          type="number"
          class="py-0"
          :min="getRangeFromExtent(idx, extent)?.[0]"
          :max="getRangeFromExtent(idx, extent)?.[1]"
          :step="steps[idx]"
          :unit="units[idx]"
          :prefix="prefixes[idx]"
          force-prefix
          :decimals="decimals[idx]"
          v-bind="noListenerAttrs"
          v-model.number="localValue[idx]"
          :rules="getRulesForAxis(idx)"
        />
      </v-col>
    </template>

    <slot name="append" v-bind="{ ...$props }" />
  </v-row>
</template>

<script lang="ts">
  import type { Extent } from 'ol/extent.js';
  import type { Coordinate } from 'ol/coordinate.js';
  import type { PropType } from 'vue';
  import { computed, defineComponent } from 'vue';
  import { VRow, VCol } from 'vuetify/components';
  import VcsTextField from './VcsTextField.ts.vue';
  import { between } from '../style/composables.js';
  import { useProxiedComplexModel } from '../modelHelper.js';
  import { removeListenersFromAttrs } from '../attrsHelpers.js';
  import { usePadding } from '../composables.js';

  function getRangeFromExtent(
    idx: number,
    extent: Extent,
  ): undefined | [number, number] {
    if (idx === 0) {
      return [extent[0], extent[2]];
    } else if (idx === 1) {
      return [extent[1], extent[3]];
    }
    return undefined;
  }

  function isInRange(
    number: number,
    range: [number, number],
  ): boolean | string {
    return between(number, range) || 'components.coordinate.outOfRange';
  }

  /**
   * @description An input for a coordinate providing a VcsTextField for each dimension.
   * All attrs and listeners are forwarded to the input fields.
   * @vue-prop {import("ol").Coordinate}  modelValue - A coordinate, with x, y and optionally z value.
   * @vue-prop {boolean}  [hideZ=false] - Hide z input field.
   * @vue-prop {Array<string>}  [prefixes=['X','Y','Z']] - An optional array of length three, with prefixes for each input
   * @vue-prop {Array<string>}  [units=['°','°','m']] - An optional array of length three, with units for each input
   * @vue-prop {Array<number>}  [decimals=[8,8,2]] - An optional array of length three, with number of decimal places for each input
   * @vue-prop {Array<number>}  [steps=[0.00001,0.00001,1]] - An optional array of length three, with step for each input. Default steps are for WGS84 coordinates.
   * @vue-prop {import("ol/extent").Extent}  [extent=[-180,-90,180,90]] - An optional extent as range for x and y inputs. Default is WGS84 extent.
   * @vue-prop {Array<Array<()=>boolean|string)>>}  [axisRules] - An optional array of length three, with additional rules for corresponding input
   * @vue-data {slot}  [#prepend] - A slot to prepend column(s) in row
   * @vue-data {slot}  [#append] - A slot to append column(s) in row
   */
  export default defineComponent({
    name: 'VcsCoordinate',
    components: {
      VRow,
      VCol,
      VcsTextField,
    },
    inheritAttrs: false,
    props: {
      modelValue: {
        type: Array as PropType<Coordinate>,
        default: () => [0, 0, 0],
      },
      hideZ: {
        type: Boolean,
        default: false,
      },
      prefixes: {
        type: Array as PropType<string[]>,
        default: () => ['X', 'Y', 'Z'],
      },
      units: {
        type: Array as PropType<string[]>,
        default: () => ['°', '°', 'm'],
      },
      decimals: {
        type: Array as PropType<number[]>,
        default: () => [8, 8, 2],
      },
      steps: {
        type: Array as PropType<number[]>,
        default: () => [0.00001, 0.00001, 1],
      },
      extent: {
        type: Array as PropType<number[]>,
        default: () => [-180, -90, 180, 90],
      },
      axisRules: {
        type: Array as PropType<Array<(v: number) => boolean | string>[]>,
        default: () => [[], [], []],
      },
    },
    emits: ['update:modelValue'],
    setup(props, { attrs, emit }) {
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);
      const noListenerAttrs = computed(() => removeListenersFromAttrs(attrs));
      const paddingProvided = usePadding(attrs);

      return {
        paddingProvided,
        localValue,
        noListenerAttrs,
        getRangeFromExtent,
        getRulesForAxis(idx: number): Array<(v: number) => boolean | string> {
          const rules = [];
          const range = getRangeFromExtent(idx, props.extent);
          if (range) {
            rules.push((v: number) => isInRange(v, range));
          }
          if (Array.isArray(props.axisRules[idx])) {
            rules.push(...props.axisRules[idx]);
          }
          if (Array.isArray(attrs.rules)) {
            rules.push(...attrs.rules);
          }
          return rules;
        },
      };
    },
  });
</script>

<style lang="scss" scoped></style>
