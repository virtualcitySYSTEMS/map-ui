<template>
  <div
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <VcsTooltip
      :tooltip-position="tooltipPosition"
      :tooltip="errorMessage"
      color="error"
    >
      <template #activator="{ on, attrs }">
        <span v-on="on">
          <v-select
            append-icon="mdi-chevron-down"
            hide-details
            flat
            :outlined="isOutlined"
            :dense="isDense"
            :height="isDense ? 24 : 32"
            :class="$attrs.color === 'primary' ? 'primary--select' : ''"
            v-bind="{...$attrs, ...attrs}"
            v-on="{...$listeners, ...on}"
            @update:error="setError"
          >
            <template #selection="{ item, index }">
              <span v-if="index === 0" class="text-truncate">{{ item }}</span>
              <span v-if="index === 1" class="text-no-wrap grey--text text-caption">
                (+{{ $attrs.value.length - 1 }})
              </span>
            </template>
          </v-select>
        </span>
      </template>
    </VcsTooltip>
  </div>
</template>
<style lang="scss" scoped>
 .v-text-field {
   padding: 0;
   margin: 0;
 }

 .vcs-select-hover{
   color: var(--v-primary-base) !important;
 }

 .primary--select {
   ::v-deep {
     .v-select__selection,
     .v-select__selection--comma,
     .v-select.v-text-field input {
       color: var(--v-primary-base);
     }
   }
 }
 .v-select{
   &.v-select--is-multi{
     ::v-deep {
       .v-select__selections{
          flex-wrap: nowrap;
       }
     }
   }
 }
</style>
<script>

  import { VSelect } from 'vuetify/lib';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import validate from '../notification/validation.js';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-select/ |vuetify select}.
   * Provides two height options depending on "dense" property:
   * - if dense is set true (default), height is 24 px
   * - if dense is set false, height is 32 px
   * Provides VcsTooltip to show error messages
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-computed {boolean} isDense - Whether size of select is dense.
   * @vue-computed {boolean} isOutlined - Select is outlined on either hover, focus or error, if not disabled.
   */
  export default {
    name: 'VcsSelect',
    components: {
      VcsTooltip,
      VSelect,
    },
    props: {
      tooltipPosition: {
        type: String,
        default: 'right',
      },
    },
    data() {
      return {
        hover: false,
        errorMessage: '',
      };
    },
    computed: {
      isDense() {
        return this.$attrs.dense !== undefined && this.$attrs.dense !== false;
      },
      isOutlined() {
        return (this.hover || this.errorMessage.length > 0) &&
          !(this.$attrs.disabled || this.$attrs.disabled === '');
      },
    },
    methods: {
      setError() {
        const rules = [...this.$attrs.rules].concat(this.$attrs.errorMessages);
        this.errorMessage = validate(rules, this.$attrs.value).join('\n');
      },
    },
  };
</script>

