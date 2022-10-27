<template>
  <VcsTooltip
    :tooltip-position="tooltipPosition"
    :tooltip="errorMessage"
    color="error"
  >
    <template #activator="{ on, attrs }">
      <span v-on="on">
        <v-checkbox
          on-icon="$vcsCheckboxChecked"
          off-icon="$vcsCheckbox"
          class="vcs-checkbox"
          hide-details
          indeterminate-icon="$vcsCheckboxIndeterminate"
          :dense="$attrs.dense!==false"
          :ripple="false"
          v-bind="{...$attrs, ...attrs}"
          v-on="{...$listeners, ...on}"
          @update:error="setError"
        >
          <template #label>
            <VcsLabel :html-for="$attrs.id" :dense="!!$attrs.dense">
              {{ $t($attrs.label) }}
            </VcsLabel>
          </template>
        </v-checkbox>
      </span>
    </template>
  </VcsTooltip>
</template>
<style lang="scss" scoped>
.vcs-checkbox {
  ::v-deep {
    label.v-label,
    .v-icon.v-icon{
      color: inherit;
    }
    .v-input--selection-controls__input {
      margin: 0;
      padding: 0;
    }
  }
}
.v-input--selection-controls {
  margin: 0;
  padding: 0;
}
</style>
<script>
  import { VCheckbox } from 'vuetify/lib';
  import VcsLabel from './VcsLabel.vue';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import validate from '../notification/validation.js';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-checkbox/ |vuetify checkbox}.
   * Provides two height options depending on "dense" property:
   * - if dense is set true (default), height is 24 px
   * - if dense is set false, height is 32 px
   * Provides VcsTooltip to show error messages
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {string} label - Label to be displayed, will be translated.
   */
  export default {
    name: 'VcsCheckbox',
    components: {
      VcsTooltip,
      VcsLabel,
      VCheckbox,
    },
    props: {
      tooltipPosition: {
        type: String,
        default: 'right',
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
