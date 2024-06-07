<template>
  <label
    :htmlFor="htmlFor"
    class="vcs-label"
    :class="{
      'vcs-label-required': required,
      'vcs-label-disabled': disabled,
    }"
  >
    <slot />
  </label>
</template>

<style lang="scss" scoped>
  .vcs-label {
    display: flex;
    align-items: center;
    height: var(--v-vcs-item-height);
    font-size: var(--v-vcs-font-size);
  }
  .vcs-label-required:after {
    content: ' *';
    color: rgb(var(--v-theme-error));
  }
  .vcs-label-disabled {
    opacity: var(--v-disabled-opacity);
  }
</style>
<script>
  /**
   * @description Stylized wrapper around {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label |label label}.
   * Pass the label text as innerHtml.
   * @vue-prop {string} htmlFor - an id reference the label is meant for.
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
