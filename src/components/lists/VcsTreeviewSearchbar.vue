<template>
  <div
    class="pa-2 bg-base-lighten-3 position-relative d-flex flex-row justify-space-between align-center rounded-0"
  >
    <slot name="prepend">
      <v-icon class="search-icon my-0 ml-1" size="12"> $vcsSearch </v-icon>
    </slot>

    <slot v-bind="{ ...$props, attrs: $attrs }">
      <VcsTextField
        class="searchbar outlined rounded-xl align-center justify-center base-lighten-4 pa-1 pl-6"
        :placeholder="$st(placeholder)"
        v-bind="$attrs"
        clearable
      />
    </slot>

    <slot name="append" :has-filter="hasFilter">
      <v-icon v-if="hasFilter" class="ml-2" size="16">$vcsFilter</v-icon>
    </slot>
  </div>
</template>

<style lang="scss" scoped>
  .search-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 12px;
  }

  // set rounded outline
  :deep(.v-input.outlined) {
    outline-style: none;
    font-size: 12px;
    box-shadow: 0 0 0 1px rgb(var(--v-theme-base-lighten-2));

    &:has(.v-field--focused) {
      box-shadow: 0 0 0 1px rgb(var(--v-theme-primary)) !important;
    }
  }

  // override item height
  :deep(
      .v-input--density-compact
        > .v-input__control
        > .v-field
        > .v-field__field
        > .v-field__input
    ) {
    --v-input-control-height: calc(var(--v-vcs-item-height) - 20px) !important;
    min-height: var(--v-input-control-height);
  }

  // override background color of VcsTextField
  :deep(.v-input) {
    background: rgb(var(--v-theme-base-lighten-4));
  }

  // remove outline of VcsTextField
  :deep(.v-field *) {
    border-width: 0;
    border-bottom: 0;
  }

  // override primary--placeholder of VcsTextField
  :deep(input::placeholder) {
    color: rgb(var(--v-theme-base-lighten-1)) !important;
    font-style: initial !important;
    opacity: 0.75 !important;
  }
</style>

<script>
  import { VIcon } from 'vuetify/components';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';

  /**
   * @description stylized searchbar used in VcsTreeview, VcsDataTable and VcsList
   * @vue-prop {string} [placeholder='search.title'] - Placeholder will be displayed in the search field, and will be translated.
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
      VcsTextField,
    },
    props: {
      placeholder: {
        type: String,
        default: 'search.title',
      },
      hasFilter: {
        type: Boolean,
        default: false,
      },
    },
  };
</script>
