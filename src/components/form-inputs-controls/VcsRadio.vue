<template>
  <VcsTooltip
    :tooltip-position="tooltipPosition"
    :tooltip="errorMessage"
    color="error"
  >
    <template #activator="{ on, attrs }">
      <span v-on="on">
        <v-radio-group
          hide-details
          class="w-full vcs-radio-group"
          :dense="$attrs.dense!==false"
          :ripple="false"
          v-bind="{...$attrs, ...attrs}"
          v-on="{...$listeners, ...on}"
          @update:error="setError"
        >
          <v-radio
            v-for="(item, idx) in items"
            :id="`radio-${idx}`"
            :key="`radio-${idx}`"
            :ripple="false"
            :color="item.color ?? 'secondary'"
            :value="item.value ?? item"
            :disabled="item.disabled ?? false"
            :class="$attrs.dense!==false ? 'vcs-radio-dense' : 'vcs-radio'"
          >
            <template #label>
              <VcsLabel :html-for="`radio-${idx}`" :dense="!!$attrs.dense">
                {{ $t(item.label ?? item) }}
              </VcsLabel>
            </template>
          </v-radio>
        </v-radio-group>
      </span>
    </template>
  </VcsTooltip>
</template>
<style lang="scss" scoped>
@import "../../styles/vcsFont";
.v-input--radio-group--column .v-radio:not(:last-child):not(:only-child) {
  margin-bottom: 0;
}
.v-input{
  &.vcs-radio-group{
    ::v-deep {
      margin-top: 0;
      padding-top: 0;
      label.v-label,
      .v-icon.v-icon{
        font-size: $base-font-size;
        color: inherit;
      }
      .v-radio:not(:last-child):not(:only-child){
        margin-bottom: 0;
      }
      .v-input--selection-controls__input{
        margin: 0;
      }
    }
  }
}
.vcs-radio {
  height: 40px;
  align-items: center;
}
.vcs-radio-dense {
  height: 32px;
  align-items: center;
}
</style>
<script>
  import { VRadio, VRadioGroup } from 'vuetify/lib';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import VcsLabel from './VcsLabel.vue';
  import validate from '../notification/validation.js';

  /**
   * @typedef {Object} VcsRadioItem
   * @property {string} label
   * @property {string} [color='secondary']
   * @property {any} value
   * @property {boolean} [disabled=false]
   */

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-radio-group/ |vuetify v-radio-group} using
   * {@link https://vuetifyjs.com/en/api/v-radio/ |vuetify v-radio}.
   * Provides two height options depending on "dense" property:
   * - if dense is set true (default), height is 24 px
   * - if dense is set false, height is 32 px
   * Provides VcsTooltip to show error messages
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {Array<string|VcsRadioItem>} items - A list of options. If strings are provided, the string is used as label and value.
   */
  export default {
    name: 'VcsRadio',
    components: {
      VcsTooltip,
      VcsLabel,
      VRadioGroup,
      VRadio,
    },
    props: {
      tooltipPosition: {
        type: String,
        default: 'right',
      },
      items: {
        type: Array,
        required: true,
      },
    },
    data() {
      return {
        errorMessage: '',
      };
    },
    methods: {
      setError() {
        const rules = [...this.$attrs.rules].concat(this.$attrs.errorMessages);
        this.errorMessage = validate(rules, this.$attrs.value).join('\n');
      },
    },
    model: {
      event: 'change',
    },
  };
</script>
