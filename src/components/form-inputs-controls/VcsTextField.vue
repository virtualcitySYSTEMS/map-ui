<template>
  <v-text-field
    ref="textFieldRef"
    variant="outlined"
    clear-icon="$close"
    :hide-details="false"
    :rules="rules"
    :type="type"
    color="primary"
    class="vcs-text-field primary--placeholder"
    :class="{
      'py-1': !paddingProvided,
      'no-prepended-content': !prependedContent,
    }"
    v-bind="$attrs"
    :prefix="forcePrefix ? undefined : $attrs.prefix"
    v-model="visibleValue"
    v-model:focused="focused"
  >
    <template #append-inner v-if="unit">
      <slot name="append-inner">{{ unit }}</slot>
    </template>
    <template v-for="slot of forwardSlots" #[slot]="scope">
      <slot :name="slot" v-bind="scope ?? {}" />
    </template>
    <template #message="scope">
      <v-tooltip
        ref="errorTooltipRef"
        :activator="textFieldRef"
        v-if="scope?.message"
        :text="$st(scope?.message)"
        content-class="bg-error"
        :location="tooltipPosition"
      />
      <slot name="message" v-bind="scope ?? {}"></slot>
    </template>
    <template #default="scope">
      <v-tooltip
        v-if="tooltip && !errorTooltipRef"
        :activator="textFieldRef"
        :location="tooltipPosition"
        :text="$st(tooltip)"
      ></v-tooltip>
      <slot name="default" v-bind="scope ?? {}"></slot>
    </template>
    <!-- use slot to show prefix always, independent of modelValue (unlike prefix prop) -->
    <template #prepend-inner="prependInnerScope">
      <slot name="prepend-inner" v-bind="prependInnerScope">
        <template v-if="forcePrefix && $attrs.prefix">
          {{ $attrs.prefix }}
        </template>
      </slot>
    </template>
  </v-text-field>
</template>

<style lang="scss" scoped>
  @import './vcsTextField.scss';
</style>
<script>
  import { computed, ref } from 'vue';
  import { VTextField, VTooltip } from 'vuetify/components';
  import { useForwardSlots, usePadding } from '../composables.js';
  import { useProxiedAtomicModel } from '../modelHelper.js';

  function countDecimalPlaces(value) {
    if (value) {
      const str = value.toString();
      const decimalIndex = str.indexOf('.');
      if (decimalIndex > 0) {
        return str.length - decimalIndex - 1;
      }
    }
    return 0;
  }

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
   * @vue-prop {boolean}                                [forcePrefix=false] - If set, forces the prefix to be always rendered independent of modelValue by using prepend-inner slot
   */
  export default {
    name: 'VcsTextField',
    inheritAttrs: false,
    components: {
      VTooltip,
      VTextField,
    },
    props: {
      type: {
        type: String,
        default: 'text',
      },
      modelValue: {
        type: [String, Number],
        default(rawProps) {
          if (rawProps.type === 'number') {
            return 0;
          }
          return '';
        },
      },
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
      forcePrefix: {
        type: Boolean,
        default: false,
      },
    },
    setup(props, { attrs, slots }) {
      const textFieldRef = ref();
      const errorTooltipRef = ref();
      const focused = ref(attrs.autofocus);

      // local value without emitting new value
      const localValue = useProxiedAtomicModel(props, 'modelValue', () => {});

      const visibleValue = computed({
        get() {
          if (
            !focused.value &&
            props.type === 'number' &&
            props.decimals &&
            countDecimalPlaces(localValue.value) > props.decimals
          ) {
            const v = parseFloat(localValue.value);
            if (Number.isFinite(v)) {
              return v.toFixed(props.decimals);
            }
          }
          return localValue.value ?? '';
        },
        set(value) {
          // emit is not needed since the vuetify component already emits an @input event. (forwarded listeners)
          if (props.type === 'number') {
            localValue.value = parseFloat(value);
          } else {
            localValue.value = value;
          }
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
      const forwardSlots = useForwardSlots(slots, ['default', 'message']);

      const prependedContent = computed(() => {
        return (props.forcePrefix && attrs.prefix) || !!slots['prepend-inner'];
      });
      return {
        prependedContent,
        forwardSlots,
        paddingProvided,
        visibleValue,
        rules,
        textFieldRef,
        errorTooltipRef,
        focused,
      };
    },
  };
</script>
