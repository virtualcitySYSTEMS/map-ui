<template>
  <span class="d-flex justify-space-between align-center window-component-header">
    <span>
      <v-icon
        v-if="windowState.headerIcon"
        class="mr-2 primary--text"
        v-text="windowState.headerIcon"
      />
      <h3 class="font-size-14 d-inline-block user-select-none font-weight-bold">
        {{ $t(windowState.headerTitle) }}
      </h3>
    </span>
    <VcsButton
      @click.stop="close"
      small
      icon="mdi-close-thick"
      tooltip="components.close"
    />
  </span>
</template>

<style>
.window-component-header{
  max-height: 16px;
}
</style>

<script>
  import { VIcon } from 'vuetify/lib';
  import VcsButton from '../../components/buttons/VcsButton.vue';

  export default {
    name: 'WindowComponentHeader',
    components: {
      VcsButton,
      VIcon,
    },
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

