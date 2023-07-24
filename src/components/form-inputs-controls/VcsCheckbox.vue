<template>
  <VcsTooltip
    :tooltip-position="tooltipPosition"
    :tooltip="errorMessage"
    color="error"
    :max-width="200"
  >
    <template #activator="{ on, attrs }">
      <span v-on="on">
        <v-checkbox
          ref="checkbox"
          :input-value="$attrs.value"
          on-icon="$vcsCheckboxChecked"
          off-icon="$vcsCheckbox"
          class="vcs-checkbox"
          :class="{ 'pl-1': !isDense }"
          hide-details
          indeterminate-icon="$vcsCheckboxIndeterminate"
          :dense="isDense"
          :ripple="false"
          v-bind="{ ...$attrs, ...attrs }"
          v-on="{ ...$listeners, ...on }"
        >
          <template #label>
            <VcsLabel :html-for="$attrs.id" :dense="isDense">
              <slot name="label" />
              <span v-if="!$slots.label">{{ $t($attrs.label) }}</span>
            </VcsLabel>
          </template>
        </v-checkbox>
      </span>
    </template>
  </VcsTooltip>
</template>
<style lang="scss" scoped>
  @import '../../styles/shades.scss';
  .vcs-checkbox {
    ::v-deep {
      .v-input--selection-controls__input {
        margin: 0;
        padding: 0;
      }
      label.v-label.error--text {
        animation: none;
      }

      .primary--text,
      .v-label:not(.v-label--is-disabled) {
        &.theme--light {
          color: map-get($shades, 'black') !important;
          &.error--text {
            color: var(--v-error-base) !important;
          }
        }
        &.theme--dark {
          color: map-get($shades, 'white') !important;
          &.error--text {
            color: var(--v-error-base) !important;
          }
        }
      }
    }
  }
  .v-input--selection-controls {
    margin: 0;
    padding: 0;
  }
</style>
<script>
  import { computed, ref } from 'vue';
  import { VCheckbox } from 'vuetify/lib';
  import VcsLabel from './VcsLabel.vue';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import { useErrorSync } from './composables.js';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-checkbox/ |vuetify checkbox}.
   * Provides two height options depending on "dense" property:
   * - if dense is set true (default), height is 24 px
   * - if dense is set false, height is 32 px
   * Provides VcsTooltip to show error messages
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {string} label - Label to be displayed, will be translated.
   * @vue-data {slot} [#label] - slot to pass html for Checkbox label. Overrides label passed as prop.
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
    setup(props, { attrs }) {
      const checkbox = ref();

      const errorMessage = useErrorSync(checkbox);
      const isDense = computed(() => attrs.dense !== false);

      return {
        checkbox,
        errorMessage,
        isDense,
      };
    },
    model: {
      event: 'change',
    },
  };
</script>
