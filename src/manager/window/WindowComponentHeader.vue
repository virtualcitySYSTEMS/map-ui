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
    <div class="d-flex justify-space-between align-center">
      <template v-if="windowState.headerActions?.length > 0">
        <VcsActionButtonList
          :actions="windowState.headerActions"
          :overflow-count="windowState.headerActionsOverflowCount ?? 3"
          small
        />
        <v-divider
          vertical
          inset
          class="mx-2"
        />
      </template>
      <VcsButton
        @click.stop="close"
        small
        icon="mdi-close-thick"
        tooltip="components.close"
      />
    </div>
  </span>
</template>

<style lang="scss" scoped>
.window-component-header{
  max-height: 16px;

  .v-divider--vertical.v-divider--inset {
    margin-top: 2px;
  }
}
</style>

<script>
  import { VIcon, VDivider } from 'vuetify/lib';
  import VcsButton from '../../components/buttons/VcsButton.vue';
  import VcsActionButtonList from '../../components/buttons/VcsActionButtonList.vue';

  /**
   * Default window component header with drag functionality close action and further optional window actions.
   * @vue-prop {WindowState}    windowState - state of the window component.
   */
  export default {
    name: 'WindowComponentHeader',
    components: {
      VcsActionButtonList,
      VcsButton,
      VIcon,
      VDivider,
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

