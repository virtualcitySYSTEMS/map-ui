<template>
  <VcsTooltip
    :tooltip-position="tooltipPosition"
    :tooltip="errorMessage"
    color="error"
    :max-width="200"
  >
    <template #activator="{ on, attrs }">
      <v-container v-on="on" class="py-0" :class="isDense ? 'px-1' : 'px-2'">
        <v-radio-group
          ref="radioGroup"
          hide-details
          class="vcs-radio-group"
          :ripple="false"
          :dense="isDense"
          v-bind="{ ...$attrs, ...attrs }"
          v-on="{ ...$listeners, ...on }"
        >
          <v-row no-gutters class="justify-center">
            <v-col
              v-for="(item, idx) in items"
              :key="idx"
              cols="1"
              class="mx-2"
            >
              <v-row no-gutters>
                <v-col>
                  <div
                    class="d-flex justify-center label-wrapper pt-1"
                    :class="$attrs.disabled ? 'disabled' : ''"
                  >
                    <slot name="label" :value="item[itemValue]" :src="item.src">
                      <img
                        :src="item.src"
                        :alt="item[itemValue]"
                        class="image"
                      />
                    </slot>
                  </div>
                </v-col>
              </v-row>
              <v-row no-gutters>
                <v-col>
                  <v-radio
                    :value="item[itemValue]"
                    :ripple="false"
                    class="ma-0"
                    :class="isDense ? 'vcs-radio-dense' : 'vcs-radio'"
                    :dense="isDense"
                  />
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-radio-group>
      </v-container>
    </template>
  </VcsTooltip>
</template>

<script>
  import { computed, ref } from 'vue';
  import { VContainer, VRow, VCol, VRadioGroup, VRadio } from 'vuetify/lib';
  import { VcsTooltip } from '@vcmap/ui';
  import { useErrorSync } from './composables.js';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-radio-group/ |vuetify radio group} which places icons or raster src files above the radio buttons as labels and arranges them in a grid.
   * @vue-prop {{value: string, src: string}[]} items - The items to be displayed in the grid. The src is the path to the raster image.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {string} itemValue - The key of the provided item objects that contains the value.
   * @vue-prop {string} itemKey - The key of the provided item objects that should be used as a key for the v-for loop. Should be a string.
   * @vue-data {slot} [#label] - slot to display labels where the src does not contain a path to an img but e.g. the name of an icon. Then an v-icon can be used in the slot.
   */
  export default {
    name: 'VcsRadioGrid',
    components: {
      VContainer,
      VRow,
      VCol,
      VRadioGroup,
      VRadio,
      VcsTooltip,
    },
    props: {
      items: {
        type: Array,
        required: true,
      },
      tooltipPosition: {
        type: String,
        default: 'right',
      },
      itemValue: {
        type: String,
        default: 'value',
      },
      itemKey: {
        type: String,
        default: undefined,
      },
    },
    setup(props, { attrs }) {
      const radioGroup = ref();

      const errorMessage = useErrorSync(radioGroup);
      return {
        isDense: computed(() => attrs.dense !== false),
        radioGroup,
        errorMessage,
      };
    },
    model: {
      event: 'change',
    },
  };
</script>

<style lang="scss" scoped>
  // TODO: scss for radio buttons should be moved to own file.
  @import '../../styles/vcsFont.scss';
  @import '../../styles/shades.scss';
  .v-input--radio-group--column .v-radio:not(:last-child):not(:only-child) {
    margin-bottom: 0;
  }
  .v-input {
    &.vcs-radio-group {
      ::v-deep {
        margin-top: 0;
        padding-top: 0;
        label.v-label,
        .v-icon.v-icon {
          font-size: $vcs-font-size;
          color: inherit;
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
        .v-radio:not(:last-child):not(:only-child) {
          margin-bottom: 0;
        }
        .v-input--selection-controls__input {
          margin: 0;
        }
        label.v-label.error--text {
          animation: none;
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
  .image {
    max-height: 24px;
    max-width: 24px;
    height: auto;
    width: auto;
  }
  .label-wrapper {
    width: 24px;
  }
  .disabled {
    opacity: 0.3;
  }
</style>
