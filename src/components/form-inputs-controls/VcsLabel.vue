<template>
  <label
    :htmlFor="htmlFor"
    class="vcs-label"
    :class="{
      'vcs-label-dense': dense,
      'px-1': dense,
      'px-2': !dense,
    }"
  >
    <slot />
  </label>
</template>

<style lang="scss" scoped>
  @import '../../styles/vcsGrid.scss';
  @import '../../styles/vcsFont';
  .vcs-label {
    font-size: $vcs-font-size;
    line-height: $line-height-base;
  }
  .vcs-label-dense {
    line-height: $line-height-dense;
  }
</style>
<script>
  /**
   * @description Stylized wrapper around {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label |label label}.
   * pass the label text as innerHtml
   * @vue-prop {string} htmlFor - an id reference the label is meant for
   * @vue-prop {boolean} [dense=true] - default line height is 32px (dense). If set false, height is 40px.
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
    },
  };
</script>
