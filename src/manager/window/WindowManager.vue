<template>
  <div
    :class="{ 'win-container-mobile' : $vuetify.breakpoint.xs }"
  >
    <WindowComponent
      v-for="(id, zIndex) in componentIds"
      :key="id"
      :window-state="getState(id)"
      :slot-window="getSlot(id)"
      :z-index="zIndex"
      @dropped="dropped(id, $event)"
      @click="clicked(id)"
      :style="getStyles(id, zIndex)"
      :class="getState(id).classes"
      :is-on-top="isOnTop(zIndex)"
    >
      <component
        :is="getComponent(id)"
        :window-state="getState(id)"
        v-bind="getProps(id)"
      />
      <template v-if="!getState(id).hideHeader" #headerComponent>
        <component
          :is="getHeaderComponent(id)"
          :window-state="getState(id)"
          v-bind="getProps(id)"
          @close="close(id)"
        />
      </template>
    </WindowComponent>
  </div>
</template>

<style scoped lang="scss">
  .win-container-mobile {
    position: absolute;
    z-index: 2;
    width: 100%;
  }
  .win-container-mobile > {
    div{
      width: 100% !important;
      inset: unset !important;
      border-radius: 0 !important;
    }
  }

</style>

<script>
  import { inject, ref } from 'vue';

  import WindowComponent from './WindowComponent.vue';
  import WindowComponentHeader from './WindowComponentHeader.vue';

  export default {
    name: 'VcsWindowManager',
    components: { WindowComponent },
    setup() {
      const app = inject('vcsApp');
      /** @type {WindowManager} */
      const { windowManager } = app;

      const { componentIds } = windowManager;

      const getState = (id) => {
        return windowManager.get(id)?.state;
      };

      const getProps = (id) => {
        return windowManager.get(id)?.props ?? {};
      };

      const isOnTop = (zIndex) => {
        return zIndex === componentIds.length - 1;
      };

      const getStyles = (id, zIndex) => {
        const windowComponent = windowManager.get(id);
        const state = windowComponent?.state;
        const position = windowComponent?.position;
        return {
          zIndex,
          left: position.left,
          top: position.top,
          right: position.right,
          bottom: position.bottom,
          width: position.width,
          height: position.height,
          ...(state.styles || {}),
        };
      };

      const clicked = (id) => {
        if (windowManager.has(id)) {
          windowManager.bringWindowToTop(id);
        }
      };

      const dropped = (id, pos) => {
        const { innerWidth, innerHeight } = window;
        // clip position
        const top = Math.min(Math.max(0, pos.top - pos.dy), innerHeight - pos.height);
        const left = Math.min(Math.max(0, pos.left - pos.dx), innerWidth - pos.width);
        windowManager.setWindowPositionOptions(id, {
          top,
          left,
          width: pos.width,
          height: pos.height,
        });
      };

      return {
        componentIds: ref(componentIds),
        getComponent: id => windowManager.get(id).component,
        getHeaderComponent: id => windowManager.get(id).headerComponent || WindowComponentHeader,
        getStyles,
        getState,
        getProps,
        isOnTop,
        getSlot: id => windowManager.get(id).slot,
        close: (id) => { windowManager.remove(id); },
        dropped,
        clicked,
      };
    },
  };
</script>
