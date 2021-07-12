<template>
  <div class="d-contents">
    <v-sheet
      class="cursor-grab v-sheet d-flex justify-space-between pa-2 transition-color-100-ease"
      :class="{
        'grey--text': zIndex < zIndexMax,
        'rounded-tl': draggableWindow.position.asNumber.top > 48
          && draggableWindow.position.asNumber.left > 0,
        'rounded-tr': draggableWindow.position.asNumber.top > 48
          && draggableWindow.position.asNumber.left < (windowWidth - draggableWindow.width),
      }"
      draggable
    >
      <slot name="header">
        <span>
          <slot name="icon">
            <v-icon v-if="draggableWindow.icon" class="mr-2 primary--text" v-text="draggableWindow.icon" />
          </slot>

          <h3 class="font-size-14 d-inline-block">{{ draggableWindow.header | translate }}</h3>
        </span>
      </slot>

      <slot name="close">
        <v-icon
          @click="$emit('close', draggableWindow.id)"
          size="16"
          v-text="'mdi-close-thick'"
        />
      </slot>
    </v-sheet>

    <v-sheet
      class="v-sheet elevation-3 overflow-y-auto overflow-x-hidden w-full"
      :class="{
        'rounded-br': draggableWindow.position.asNumber.top > 0
          && draggableWindow.position.asNumber.left < (windowWidth - draggableWindow.width),
        'rounded-bl': draggableWindow.position.asNumber.left > 0,
      }"
    >
      <slot />
    </v-sheet>
  </div>
</template>

<script>
  import VueCompositionAPI, { computed, defineComponent } from '@vue/composition-api';
  import Vue from 'vue';

  Vue.use(VueCompositionAPI);

  export default defineComponent({
    props: {
      draggableWindow: Object,
      zIndex: Number,
      zIndexMax: Number,
    },
    setup() {
      const windowWidth = computed(() => window.innerWidth);
      return {
        windowWidth,
      };
    },
  });
</script>

