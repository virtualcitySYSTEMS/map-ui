<template>
  <span class="d-flex justify-space-between">
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
    <v-icon
      class=".float-right"
      @click.stop="close"
      size="16"
      v-text="'mdi-close-thick'"
    />
  </span>
</template>

<script>

  export default {
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

