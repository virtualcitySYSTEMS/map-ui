<template>
  <label
    :htmlFor="htmlFor"
    class="vcs-label"
    :class="{
      'vcs-label-dense': dense,
      'vcs-label-required': required,
      'px-1': dense,
      'px-2': !dense,
      'vcs-label-disabled': disabled,
      'theme--dark': $vuetify.theme.dark,
      'theme--light': !$vuetify.theme.dark,
    }"
  >
    <slot />
  </label>
</template>

<style lang="scss" scoped>
  @import '../../styles/vcsGrid.scss';
  @import '../../styles/vcsFont';
  @import '../../styles/shades.scss';

  .vcs-label {
    font-size: $vcs-font-size;
    line-height: $line-height-base;
  }
  .vcs-label-dense {
    line-height: $line-height-dense;
  }
  .vcs-label-required:after {
    content: ' *';
    color: var(--v-error-base);
  }
  .vcs-label-disabled {
    &.theme--dark {
      color: rgba(map-get($shades, 'white'), 0.5);
    }
    &.theme--light {
      color: rgba(map-get($shades, 'black'), 0.3);
    }
  }
</style>
<script>
  /**
   * @description Stylized wrapper around {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label |label label}.
   * pass the label text as innerHtml
   * @vue-prop {string} htmlFor - an id reference the label is meant for
   * @vue-prop {boolean} [dense=true] - default line height is 32px (dense). If set false, height is 40px.
   * @vue-prop {boolean} [required=false] - Marks an input field as required by adding an asterisk after the label.
   * @vue-prop {boolean} [disabled=false] - Marks an input field as disabled by adding transparency to the label.
   */
  export default {
    name: 'VcsLabel',
    props: {
      htmlFor: {
        type: String,
        default: undefined,
      },
      dense: {
        type: Boolean,
        default: true,
      },
      required: {
        type: Boolean,
        default: false,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
    },
  };
</script>
