<template>
  <span class="d-flex justify-space-between align-center window-component-header">
    <span>
      <v-icon
        v-if="windowState.headerIcon"
        class="mr-2"
        :class="{ 'primary--text': isOnTop }"
        v-text="windowState.headerIcon"
        size="16"
      />
      <h3
        class="d-inline-block user-select-none font-weight-bold"
        :class="{ 'text--primary': isOnTop }"
      >
        {{ $t(windowState.headerTitle) }}
      </h3>
    </span>
    <div class="d-flex justify-space-between align-center">
      <template v-if="windowState.headerActions?.length > 0">
        <VcsActionButtonList
          :actions="windowState.headerActions"
          :overflow-count="windowState.headerActionsOverflow ?? 3"
          small
        />
        <v-divider
          vertical
          inset
          class="mx-1"
        />
      </template>
      <VcsButton
        v-if="windowState.infoUrl"
        @click.stop="infoAction.callback()"
        small
        :icon="infoAction.icon"
        :tooltip="infoAction.title"
        class="px-1 d-flex"
      />
      <VcsButton
        v-if="isDockable"
        @click.stop="pin"
        small
        icon="mdi-pin"
        tooltip="components.pin"
        class="px-1 d-flex"
      />
      <VcsButton
        @click.stop="close"
        small
        icon="mdi-close-thick"
        tooltip="components.close"
        class="d-flex"
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
  import { computed } from 'vue';
  import VcsButton from '../../components/buttons/VcsButton.vue';
  import VcsActionButtonList from '../../components/buttons/VcsActionButtonList.vue';
  import { createLinkAction } from '../../actions/actionHelper.js';

  /**
   * Default window component header with drag functionality close action and further optional window actions.
   * @vue-prop {WindowState}    windowState - state of the window component.
   * @vue-event {void} pin - raised when pin button is clicked
   * @vue-event {void} close - raised when close button is clicked
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
      isOnTop: {
        type: Boolean,
        required: true,
        default: false,
      },
      slotWindow: {
        type: Object,
        required: true,
      },
    },
    setup(props, { emit }) {
      const pin = () => {
        emit('pin');
      };
      const close = () => {
        emit('close');
      };
      const isDockable = computed(() => !props.windowState.hidePin && props.windowState.dockable);

      const infoAction = props.windowState.infoUrl ? createLinkAction({
        name: 'info',
        title: 'content.infoAction.title',
        icon: '$vcsInfo',
      }, props.windowState.infoUrl) : {};

      return {
        pin,
        close,
        isDockable,
        infoAction,
      };
    },
  };
</script>

