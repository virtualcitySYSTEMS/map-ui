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
  >
    <div class="panel-content">
      <slot />
    </div>
    <div
      class="resize-handle"
      :class="{
        'resize-handle-left': isLeft,
        'resize-handle-right': isRight,
        'resize-handle-bottom': isBottom,
        'resize-handle-resizable': panelState.resizable,
      }"
      @pointerdown="startResize"
    ></div>
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
          if (!props.panelState.resizable) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          emit('resize', props.panelState.id);
        },
      };
    },
  };
</script>

<style scoped lang="scss">
  .panel-component {
    display: flex;
    flex-direction: column;
  }

  .theme--light {
    background: rgb(var(--v-theme-surface));
  }

  .theme--dark {
    background: rgb(var(--v-theme-surface));
  }

  .panel-content {
    flex: 1;
    overflow: auto;
    padding: 0 4px;
    min-height: 0; /* Important for flex children to be scrollable */
  }

  .resize-handle {
    position: absolute;
    background: rgb(var(--v-theme-surface-light));
  }

  .resize-handle-left {
    width: 4px;
    top: 0;
    bottom: 0;
    right: 0;
  }

  .resize-handle-right {
    width: 4px;
    top: 0;
    bottom: 0;
    left: 0;
  }

  .resize-handle-bottom {
    left: 0;
    right: 0;
    top: 0;
    height: 4px;
  }

  .resize-handle-resizable.resize-handle-left,
  .resize-handle-resizable.resize-handle-right {
    cursor: ew-resize;
  }

  .resize-handle-resizable.resize-handle-bottom {
    cursor: n-resize;
  }
</style>
