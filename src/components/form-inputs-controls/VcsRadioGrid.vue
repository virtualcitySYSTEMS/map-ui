<template>
  <VcsTooltip
    :tooltip-position="tooltipPosition"
    :tooltip="errorMessage"
    color="error"
    :max-width="200"
  >
    <template #activator="{ props }">
      <v-container
        v-bind="props"
        class="py-0"
        :class="isDense ? 'px-1' : 'px-2'"
      >
        <v-radio-group
          ref="radioGroup"
          hide-details
          class="vcs-radio-group"
          :ripple="false"
          :density="isDense ? 'compact' : undefined"
          v-bind="{ ...$attrs }"
        >
          <div class="d-flex gc-1 px-2 pt-2 pb-1 justify-center">
            <div v-for="(item, idx) in items" :key="idx">
              <div class="pt-1 pb-0" :class="$attrs.disabled ? 'disabled' : ''">
                <slot
                  name="label"
                  :model-value="item[itemValue]"
                  :src="item.src"
                >
                  <img :src="item.src" :alt="item[itemValue]" class="image" />
                </slot>
              </div>
              <v-radio
                :value="item[itemValue]"
                :ripple="false"
                class="ma-0 justify-center"
                :class="isDense ? 'vcs-radio-dense' : 'vcs-radio'"
                :dense="isDense"
              />
            </div>
          </div>
        </v-radio-group>
      </v-container>
    </template>
  </VcsTooltip>
</template>

<script>
  import { computed, ref } from 'vue';
  import { VContainer, VRadioGroup, VRadio } from 'vuetify/components';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import { useErrorSync } from './composables.js';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-radio-group/ |vuetify radio group} which places icons or raster src files above the radio buttons as labels and arranges them in a grid.
   * Use figure and figcaption for labeled radio icons:
   * @example
   * <VcsRadioGrid v-model="model" items="items" >
   *    <template #label="{ src, value }">
   *       <figure>
   *          <v-icon size="24" class="d-flex justify-center">{{src}}</v-icon>
   *          <figcaption class="d-flex justify-center">{{ value }}</figcaption>
   *       </figure>
   *    </template>
   * </VcsRadioGrid>
   * @vue-prop {{value: string, src: string}[]} items - The items to be displayed in the grid. The src is the path to the raster image.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {string} itemValue - The key of the provided item objects that contains the value.
   * @vue-data {slot} [#label] - slot to display labels where the src does not contain a path to an img but e.g. the name of an icon. Then an v-icon can be used in the slot.
   */
  export default {
    name: 'VcsRadioGrid',
    inheritAttrs: false,
    components: {
      VContainer,
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
      :deep(*) {
        margin-top: 0;
        padding-top: 0;
      }
      :deep(label.v-label),
      :deep(.v-icon.v-icon) {
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
      :deep(.v-radio:not(:last-child):not(:only-child)) {
        margin-bottom: 0;
      }
      :deep(.v-input--selection-controls__input) {
        margin: 0;
      }
      :deep(label.v-label.error--text) {
        animation: none;
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
  .disabled {
    opacity: 0.3;
  }
</style>
