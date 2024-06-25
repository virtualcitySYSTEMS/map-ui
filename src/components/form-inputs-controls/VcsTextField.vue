<template>
  <v-text-field
    ref="textFieldRef"
    variant="outlined"
    clear-icon="$close"
    :hide-details="false"
    :rules="rules"
    class="primary--placeholder"
    :class="{
      'py-1': !paddingProvided,
    }"
    v-bind="$attrs"
    v-model="visibleValue"
  >
    <template #append-inner v-if="unit">
      <slot name="append-inner">{{ unit }}</slot>
    </template>
    <template v-for="slot of Object.keys($slots)" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
    <template #message="{ message }">
      <v-tooltip
        ref="errorTooltipRef"
        :activator="textFieldRef"
        v-if="message"
        :text="message"
        content-class="bg-error"
        :location="tooltipPosition"
      />
    </template>
    <v-tooltip
      v-if="tooltip && !errorTooltipRef"
      :activator="textFieldRef"
      :location="tooltipPosition"
      :text="tooltip"
    ></v-tooltip>
  </v-text-field>
</template>

<style lang="scss" scoped>
  @import './vcsTextField.scss';
</style>
<script>
  import { computed, ref } from 'vue';
  import { VTextField, VTooltip } from 'vuetify/components';
  import { usePadding } from './composables.js';

  /**
   * @description extends API of {@link https://vuetifyjs.com/en/api/v-text-field v-text-field}.
   * Provides VcsTooltip to
   * - show error messages on focus
   * - show tooltips, if no error messages are available
   * When clicking esc key, previous input is restored.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the tooltip.
   * @vue-prop {string|undefined}                       tooltip - Optional tooltip which will be shown on hover when no error message is shown
   * @vue-prop {string}                                 unit - Unit for number input fields. Is displayed behind the number.
   * @vue-prop {number|undefined}                       [decimals] - An optional number of decimal places the visible value will be rounded to. Does not affect the input value!
   */
  export default {
    name: 'VcsTextField',
    inheritAttrs: false,
    components: {
      VTooltip,
      VTextField,
    },
    props: {
      tooltip: {
        type: String,
        default: undefined,
      },
      tooltipPosition: {
        type: String,
        default: 'right',
      },
      unit: {
        type: String,
        default: '',
      },
      decimals: {
        type: Number,
        default: undefined,
      },
    },
    setup(props, { attrs, emit }) {
      const textFieldRef = ref();
      const errorTooltipRef = ref();

      const visibleValue = computed({
        get() {
          if (
            attrs.type === 'number' &&
            Number.isFinite(attrs.modelValue) &&
            props.decimals >= 0
          ) {
            return parseFloat(attrs.modelValue.toFixed(props.decimals));
          }
          return attrs.modelValue ?? '';
        },
        set(value) {
          if (attrs.type === 'file') {
            emit('update:modelValue', value);
          }
          // emit is not needed for other types, the vuetify component already emits an @input event. (forwarded listeners)
        },
      });

      const rules = computed(() => {
        if (attrs.type === 'number' && Array.isArray(attrs.rules)) {
          return attrs.rules.map((rule) => {
            return (value) => rule(parseFloat(value));
          });
        } else {
          return attrs.rules;
        }
      });

      const paddingProvided = usePadding(attrs);

      return {
        paddingProvided,
        visibleValue,
        rules,
        textFieldRef,
        errorTooltipRef,
      };
    },
  };
</script>
