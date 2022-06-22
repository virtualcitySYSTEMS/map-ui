<template>
  <section class="vcs-form-section">
    <slot name="title">
      <article class="pa-2 accent">
        <div class="form-section-header d-flex justify-space-between align-center">
          <strong class="caption">{{ $t(title) }}</strong>
          <VcsActionButtonList
            :actions="titleActions"
            small
          />
        </div>
      </article>
    </slot>
    <article class="section-content">
      <slot />
    </article>
  </section>
</template>


<script>
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';

  /**
   * @description
   * Stylized form section with action buttons
   * @vue-data {slot} [#title] - slot to override form section header
   * @vue-data {slot} [#default] - slot with the section content
   * @vue-prop {string} title - Title to be displayed, will be translated.
   * @vue-prop {Array<VcsAction>}    titleActions - Icons to be displayed on the right side
   */
  export default {
    name: 'VcsFormSection',
    components: { VcsActionButtonList },
    props: {
      title: {
        type: String,
        default: undefined,
      },
      titleActions: {
        type: Array,
        default: () => ([]),
      },
    },
  };
</script>
