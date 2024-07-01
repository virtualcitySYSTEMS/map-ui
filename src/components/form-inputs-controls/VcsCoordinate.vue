<template>
  <v-row no-gutters v-if="localValue">
    <slot name="prepend" v-bind="{ ...$props }" />
    <template v-for="(_, idx) in localValue">
      <v-col :key="`${prefixes[idx]}-coordinate`" v-if="!hideZ || idx < 2">
        <VcsTextField
          :id="`${prefixes[idx]}-coordinate`"
          :hide-spin-buttons="true"
          type="number"
          :min="getRangeFromExtent(idx, extent)?.[0]"
          :max="getRangeFromExtent(idx, extent)?.[1]"
          :step="steps[idx]"
          :prefix="prefixes[idx]"
          :unit="units[idx]"
          :decimals="decimals[idx]"
          v-bind="noListenerAttrs"
          v-model="localValue[idx]"
          :rules="getRulesForAxis(idx)"
        />
      </v-col>
    </template>

    <slot name="append" v-bind="{ ...$props }" />
  </v-row>
</template>

<style lang="scss" scoped></style>

<script>
  import { computed } from 'vue';
  import { VRow, VCol } from 'vuetify/components';
  import VcsTextField from './VcsTextField.vue';
  import { between } from '../style/composables.js';
  import { useProxiedComplexModel } from '../modelHelper.js';
  import { removeListenersFromAttrs } from '../attrsHelpers.js';

  /**
   *
   * @param {number} idx
   * @param {import("ol/extent").Extent} extent
   * @returns {undefined|number[]}
   */
  function getRangeFromExtent(idx, extent) {
    if (idx === 0) {
      return [extent[0], extent[2]];
    } else if (idx === 1) {
      return [extent[1], extent[3]];
    }
    return undefined;
  }

  /**
   * @param {number} number
   * @param {number[]} range
   * @returns {boolean|string}
   */
  function isInRange(number, range) {
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
  export default {
    name: 'VcsCoordinate',
    inheritAttrs: false,
    components: {
      VRow,
      VCol,
      VcsTextField,
    },
    props: {
      modelValue: {
        type: Array,
        default: () => [0, 0, 0],
      },
      hideZ: {
        type: Boolean,
        default: false,
      },
      prefixes: {
        type: Array,
        default: () => ['X', 'Y', 'Z'],
      },
      units: {
        type: Array,
        default: () => ['°', '°', 'm'],
      },
      decimals: {
        type: Array,
        default: () => [8, 8, 2],
      },
      steps: {
        type: Array,
        default: () => [0.00001, 0.00001, 1],
      },
      extent: {
        type: Array,
        default: () => [-180, -90, 180, 90],
      },
      axisRules: {
        type: Array,
        default: () => [[], [], []],
      },
    },
    setup(props, { attrs, emit }) {
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);
      const noListenerAttrs = computed(() => removeListenersFromAttrs(attrs));

      return {
        localValue,
        noListenerAttrs,
        getRangeFromExtent,
        getRulesForAxis(idx) {
          const rules = [];
          const range = getRangeFromExtent(idx, props.extent);
          if (range) {
            rules.push((v) => isInRange(v, range));
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
  };
</script>
