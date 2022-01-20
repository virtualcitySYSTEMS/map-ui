<template>
  <div>
    <WindowComponent
      v-for="(id, zIndex) in windowIds"
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
      />
      <template v-if="!getState(id).hideHeader" #headerComponent>
        <component
          :is="getHeaderComponent(id)"
          :window-state="getState(id)"
          @close="close(id)"
        />
      </template>
    </WindowComponent>
  </div>
</template>

<script>
  import {
    defineComponent,
    inject,
  } from '@vue/composition-api';

  import WindowComponent from './WindowComponent.vue';
  import WindowComponentHeader from '@/modules/window-manager/WindowComponentHeader.vue';

  export default defineComponent({
    name: 'VcsWindowManager',
    components: { WindowComponent },
    setup() {
      /** @type {WindowManager} */
      const windowManager = inject('windowManager');

      const { windowIds } = windowManager;

      const getState = (id) => {
        return windowManager.get(id)?.state;
      };

      const isOnTop = (zIndex) => {
        return zIndex === windowIds.length - 1;
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
        const top = Math.min(Math.max(48, pos.top - pos.dy), innerHeight - pos.height);
        const left = Math.min(Math.max(0, pos.left - pos.dx), innerWidth - pos.width);
        windowManager.setWindowPositionOptions(id, {
          top,
          left,
          width: pos.width,
          height: pos.height,
        });
      };

      return {
        windowIds,
        getComponent: id => windowManager.get(id).component,
        getHeaderComponent: id => windowManager.get(id).headerComponent || WindowComponentHeader,
        getStyles,
        getState,
        isOnTop,
        getSlot: id => windowManager.get(id).slot,
        close: (id) => { windowManager.remove(id); },
        dropped,
        clicked,
      };
    },
  });
</script>
