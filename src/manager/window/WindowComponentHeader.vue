<template>
  <div
    class="d-flex justify-space-between align-center window-component-header"
  >
    <h3 class="d-flex align-center flex-grow-1">
      <v-icon
        v-if="windowState.headerIcon"
        class="mr-1"
        :class="{ 'text-primary': isOnTop }"
        size="16"
      >
        {{ windowState.headerIcon }}
      </v-icon>
      <span
        ref="headerRef"
        class="d-inline-block user-select-none font-weight-bold vcs-window-header-title"
        :class="{ 'text-primary': isOnTop }"
      >
        {{ translatedHeaderTitle }}
      </span>
      <v-tooltip v-if="headerTooltip" activator="parent">
        {{ $st(headerTooltip) }}
      </v-tooltip>
    </h3>
    <div class="d-flex justify-space-between align-center">
      <template v-if="windowState.headerActions?.length > 0">
        <VcsActionButtonList
          :actions="windowState.headerActions"
          :overflow-count="windowState.headerActionsOverflow ?? 3"
        />
        <v-divider vertical inset class="mx-1 my-1" />
      </template>
      <VcsButton
        v-if="infoAction"
        @click.stop="infoAction.callback()"
        :icon="infoAction.icon"
        :tooltip="infoAction.title"
        class="px-1 d-flex"
      />
      <VcsButton
        v-if="isDockable"
        @click.stop="pin"
        icon="mdi-pin"
        tooltip="components.pin"
        class="px-1 d-flex"
      />
      <VcsButton
        @click.stop="close"
        icon="mdi-close-thick"
        tooltip="components.close"
        class="d-flex"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .window-component-header {
    max-height: calc(var(--v-vcs-item-height) / 2);

    h3 {
      line-height: calc(var(--v-vcs-item-height) / 2);
    }
    .v-divider--vertical.v-divider--inset {
      margin-top: 2px;
    }
  }
  .user-select-none {
    user-select: none;
  }
  .vcs-window-header-title {
    width: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
</style>

<script>
  import { VIcon, VDivider, VTooltip } from 'vuetify/components';
  import { computed, getCurrentInstance, ref } from 'vue';
  import { createEllipseTooltip } from '../../components/composables.js';
  import VcsButton from '../../components/buttons/VcsButton.vue';
  import VcsActionButtonList from '../../components/buttons/VcsActionButtonList.vue';
  import { createLinkAction } from '../../actions/actionHelper.js';

  /**
   * @description Default window component header with drag functionality close action and further optional window actions.
   * @vue-prop {WindowState}    windowState - state of the window component.
   * @vue-event {void} pin - raised when pin button is clicked
   * @vue-event {void} close - raised when close button is clicked
   * @vue-computed {boolean} isDockable
   * @vue-computed {string} translatedHeaderTitle - translates header title and joins array
   */
  export default {
    name: 'WindowComponentHeader',
    components: {
      VcsActionButtonList,
      VcsButton,
      VIcon,
      VDivider,
      VTooltip,
    },
    inheritAttrs: false,
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
      const isDockable = computed(
        () => !props.windowState.hidePin && props.windowState.dockable,
      );

      const vm = getCurrentInstance().proxy;

      const translatedHeaderTitle = computed(() =>
        Array.isArray(props.windowState.headerTitle)
          ? props.windowState.headerTitle.map((t) => vm.$st(t)).join(' ')
          : vm.$st(props.windowState.headerTitle),
      );

      const headerRef = ref(null);

      const infoAction =
        props.windowState.infoUrl || props.windowState.infoUrlCallback
          ? createLinkAction(
              {
                name: 'info',
                title: 'content.infoAction.title',
                icon: '$vcsHelp',
              },
              props.windowState.infoUrl || props.windowState.infoUrlCallback,
            )
          : undefined;

      return {
        pin,
        close,
        isDockable,
        translatedHeaderTitle,
        headerRef,
        headerTooltip: createEllipseTooltip(
          computed(() => headerRef.value),
          computed(() => undefined),
          translatedHeaderTitle,
        ),
        infoAction,
      };
    },
  };
</script>
