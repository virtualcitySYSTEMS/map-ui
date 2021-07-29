<template>
  <div v-if="windowState" :id="`window-component--${windowState.id}`" class="d-contents">
    <v-sheet
      class="v-sheet elevation-3 d-flex justify-space-between pa-2 transition-color-100-ease"
      :class="{
        'cursor-grab': !windowState.isDocked,
        'grey--text': zIndex < zIndexMax,
        'rounded-tl': windowState.position.asNumber.top > 48
          && windowState.position.asNumber.left > 0,
        'rounded-tr': windowState.position.asNumber.top > 48
          && windowState.position.asNumber.left < (windowWidth - windowState.width),
      }"
      :draggable="!windowState.isDocked"
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

          <h3 class="font-size-14 d-inline-block">{{ windowState.header | translate }}</h3>
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
        'rounded-br': windowState.position.asNumber.top > 0
          && windowState.position.asNumber.left < (windowWidth - windowState.width),
        'rounded-bl': windowState.position.asNumber.left > 0,
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
      return {
        windowWidth,
        windowState,
        zIndexMax: windowManager.state.zIndexMax,
        zIndex: windowManager.state.zIndexMap[props.windowId],
      };
    },
  });
</script>

