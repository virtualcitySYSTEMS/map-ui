<template>
  <section class="vcs-form-section">
    <slot name="title">
      <article class="pa-2 accent">
        <div class="form-section-header d-flex justify-space-between align-center">
          <strong class="caption">{{ title }}</strong>

          <div v-if="titleActions" class="form-section-header__actions">
            <v-icon
              v-for="(action, index) of titleActions"
              :key="action.name"
              v-text="action.icon"
              :size="action.size || '16'"
              :class="{ 'mr-1': titleActions.length > 1 && (index + 1) < titleActions.length }"
            />
          </div>
        </div>
      </article>
    </slot>
    <article class="section-content">
      <slot />
    </article>
  </section>
</template>


<script>
  import Vue from 'vue';

  /**
   * @description
   * Stylized form section with action buttons
   * @vue-prop {string}   title - Title to be displayed
   * @vue-prop {Array}    titleActions - Icons to be displayed on the right side
   */
  export default Vue.extend({
    name: 'VcsFormSection',
    props: {
      title: {
        type: String,
        default: undefined,
      },
      titleActions: {
        type: Array,
        default: () => ([]), // { name, icon, size }
      },
    },
  });
</script>
