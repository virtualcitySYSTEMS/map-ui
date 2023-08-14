<template>
  <div
    class="pa-2 base lighten-3 position-relative d-flex flex-row justify-space-between align-center rounded-0"
  >
    <slot name="prepend">
      <v-icon class="search-icon my-0 ml-1" size="12"> $vcsSearch </v-icon>
    </slot>

    <slot v-bind="{ ...$props, on: $listeners }">
      <v-text-field
        solo
        dense
        hide-details
        class="searchbar outlined rounded-xl align-center d-flex justify-center base lighten-4 pa-1 pl-6"
        :placeholder="$t(placeholder)"
        :value="value"
        v-on="$listeners"
        clearable
      />
    </slot>

    <slot name="append" :has-filter="hasFilter">
      <v-icon v-if="hasFilter" class="ml-2" size="16">$vcsFilter</v-icon>
    </slot>
  </div>
</template>

<style lang="scss" scoped>
  .input-container {
    position: relative;
  }

  .search-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 12px;
  }

  input {
    border-radius: 9999rem;
    outline-style: none;
    font-size: 12px;
    box-shadow: 0 0 0 1px var(--v-base-lighten2);

    &:focus {
      box-shadow: 0 0 0 1px var(--v-primary-base);
    }
  }

  ::v-deep {
    .v-input__slot {
      background-color: transparent !important;
    }

    .v-input__append-inner {
      height: 20px;
      display: flex;
      justify-content: center;
      align-items: center;

      .v-icon {
        width: 20px;
        height: 20px;
        font-size: 16px;
      }
    }

    .v-text-field.v-text-field--solo.v-input--dense > .v-input__control {
      min-height: unset;
    }

    .v-text-field.v-text-field--enclosed:not(.v-text-field--rounded)
      > .v-input__control
      > .v-input__slot,
    .v-text-field.v-text-field--enclosed .v-text-field__details {
      padding: 0 8px;
    }

    .v-input.outlined {
      outline-style: none;
      font-size: 12px;
      box-shadow: 0 0 0 1px var(--v-base-lighten2);

      &:focus,
      &.v-input--is-focused {
        box-shadow: 0 0 0 1px var(--v-primary-base);
      }
    }

    .v-text-field.v-input--dense:not(
        .v-text-field--outlined
      ).v-text-field__prefix,
    .v-text-field.v-input--dense:not(
        .v-text-field--outlined
      ).v-text-field__suffix,
    .v-text-field.v-input--dense:not(.v-text-field--outlined) input {
      padding: 0;
    }

    .v-text-field.v-text-field--solo:not(.v-text-field--solo-flat)
      > .v-input__control
      > .v-input__slot {
      box-shadow: none;
      border-radius: 0;
    }
  }
</style>

<script>
  import { VIcon, VTextField } from 'vuetify/lib';

  /**
   * @description stylized searchbar used in VcsTreeview, VcsDataTable and VcsList
   * @vue-prop {string} [placeholder='search.title'] - Placeholder will be displayed in the search field, and will be translated.
   * @vue-prop {string[]} [customClasses] - CSS classes to customize style
   * @vue-prop {string} [value] - The search value
   * @vue-prop {boolean} [hasFilter=false] - Appends a filter icon
   * @vue-data {slot} [prepend] - prepend slot overwriting search icon
   * @vue-data {slot} [default] - default slot overwriting search input text field. binds all props
   * @vue-data {slot} [append] - append slot overwriting filter icon. binds hasFilter prop
   */
  export default {
    name: 'VcsTreeviewSearchbar',
    components: {
      VIcon,
      VTextField,
    },
    props: {
      placeholder: {
        type: String,
        default: 'search.title',
      },
      customClasses: {
        type: Array,
        default: () => [],
      },
      value: {
        type: String,
        default: '',
      },
      hasFilter: {
        type: Boolean,
        default: false,
      },
    },
  };
</script>
