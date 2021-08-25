<template>
  <div v-if="windowState" :id="`window-component--${windowState.id}`" class="d-contents">
    <v-sheet
      class="v-sheet elevation-3 d-flex justify-space-between pa-2 transition-color-100-ease"
      :class="{
        'cursor-grab': isDynamic(),
        'grey--text': !isOnTop(),
        'rounded-tl': !isDocked(),
        'rounded-tr': !isDocked(),
      }"
      :draggable="isDynamic()"
    >
      <slot name="header">
        <span>
          <slot name="icon">
            <v-icon
              v-if="windowState.icon"
              class="mr-2 primary--text"
              v-text="windowState.icon"
            />

          </slot>

          <h3 class="font-size-14 d-inline-block user-select-none">{{ windowState.header | translate }}</h3>
        </span>
      </slot>

      <slot name="close">
        <v-icon
          @click="close(windowState.id)"
          size="16"
          v-text="'mdi-close-thick'"
        />
      </slot>
    </v-sheet>

    <v-sheet
      class="v-sheet elevation-3 overflow-y-auto overflow-x-hidden w-full"
      :class="{
        'rounded-br': !isDocked(),
        'rounded-bl': !isDocked(),
      }"
    >
      <slot />
    </v-sheet>
  </div>
</template>

<script>
  import { computed, defineComponent, inject } from '@vue/composition-api';


  export default defineComponent({
    props: {
      windowId: String,
    },
    setup(props) {
      const windowWidth = computed(() => window.innerWidth);
      const windowManager = inject('windowManager');
      const windowState = windowManager.get(props.windowId);
      const isDynamic = () => windowState.windowSlot !== 'static';
      const isOnTop = () => windowManager.state.zIndexMap[windowState.id] === windowManager.state.zIndexMax;
      const isDocked = () => (
        windowState.position.toNumbers().top === 48
      ) &&
        (
          windowState.position.toNumbers().left === 0 ||
          windowState.position.toNumbers().right === 0 ||
          windowState.position.toNumbers().left + windowState.width === windowWidth
        );
      return {
        windowWidth,
        windowState,
        zIndexMap: windowManager.state.zIndexMap,
        zIndexMax: windowManager.state.zIndexMax,
        close: id => windowManager.remove(id),
        isDynamic,
        isOnTop,
        isDocked,
      };
    },
  });
</script>

