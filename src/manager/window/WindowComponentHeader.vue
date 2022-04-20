<template>
  <span class="d-flex justify-space-between align-center window-component-header">
    <span>
      <v-icon
        v-if="windowState.headerIcon"
        class="mr-2 primary--text"
        v-text="windowState.headerIcon"
      />
      <h3 class="font-size-14 d-inline-block user-select-none">
        {{ windowState.headerTitle | translate }}
      </h3>
    </span>
    <VcsButton
      @click.stop="close"
      small
      icon="mdi-close-thick"
    />
  </span>
</template>

<style>
.window-component-header{
  max-height: 16px;
}
</style>

<script>
  import { VcsButton } from '@vcsuite/ui-components';

  export default {
    components: { VcsButton },
    props: {
      windowState: {
        type: Object,
        required: true,
      },
    },
    setup(props, { emit }) {
      const close = () => {
        emit('close');
      };
      const clicked = (e) => {
        emit('click', e);
      };

      return {
        close,
        clicked,
      };
    },
  };
</script>

