<template>
  <div
    :id="panelState.id"
    class="position-absolute panel-component"
    :class="{
      'panel-component-left': isLeft,
      'panel-component-right': isRight,
      'panel-component-bottom': isBottom,
      'theme--light': !appIsDark,
      'theme--dark': appIsDark,
      resizable: panelState.resizable,
    }"
    @mousedown="startResize"
    @mouseup="stopResize"
  >
    <slot />
  </div>
</template>

<script>
  import { computed, inject, provide, getCurrentInstance } from 'vue';
  import { PanelLocation } from './panelManager.js';

  export default {
    name: 'PanelComponent',
    props: {
      panelState: {
        type: Object,
        required: true,
      },
    },
    emits: ['resize'],
    setup(props, { emit }) {
      const app = inject('vcsApp');
      const panel = app.panelManager.get(props.panelState.id);
      if (panel?.provides) {
        Object.entries(panel.provides).forEach(([key, value]) => {
          provide(key, value);
        });
      }

      return {
        appIsDark: computed(() => {
          return getCurrentInstance().proxy.$vuetify.theme.dark || !1;
        }),
        isLeft: computed(
          () => props.panelState.location === PanelLocation.LEFT,
        ),
        isRight: computed(
          () => props.panelState.location === PanelLocation.RIGHT,
        ),
        isBottom: computed(
          () => props.panelState.location === PanelLocation.BOTTOM,
        ),
        startResize(e) {
          const { resizable, location } = props.panelState;
          if (
            resizable &&
            ((location === PanelLocation.LEFT &&
              e.currentTarget.clientWidth - e.offsetX < 4) ||
              (location === PanelLocation.RIGHT && e.offsetX < 4) ||
              (location === PanelLocation.BOTTOM && e.offsetY < 4))
          ) {
            emit('resize', props.panelState.id);
          }
        },
        stopResize() {
          emit('resize', undefined);
        },
      };
    },
  };
</script>

<style scoped lang="scss">
  .panel-component {
    padding: 0 4px;
  }
  .panel-component::after {
    content: '';
    position: absolute;
    background: rgb(var(--v-theme-surface-light));
  }

  .panel-component-left::after {
    width: 4px;
    top: 0;
    bottom: 0;
    right: 0;
  }
  .panel-component-left.resizable::after {
    cursor: ew-resize;
  }
  .panel-component-right::after {
    width: 4px;
    top: 0;
    bottom: 0;
    left: 0;
  }
  .panel-component-right.resizable::after {
    cursor: ew-resize;
  }
  .panel-component-bottom::after {
    left: 0;
    right: 0;
    top: 0;
    height: 4px;
  }
  .panel-component-bottom.resizable::after {
    cursor: n-resize;
  }
</style>
