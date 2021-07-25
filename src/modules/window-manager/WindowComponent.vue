<template>
  <div :id="`window-component--${windowConfig.id}`" class="d-contents">
    <v-sheet
      class="cursor-grab v-sheet d-flex justify-space-between pa-2 transition-color-100-ease"
      :class="{
        'grey--text': zIndex < zIndexMax,
        'rounded-tl': windowConfig.position.asNumber.top > 48
          && windowConfig.position.asNumber.left > 0,
        'rounded-tr': windowConfig.position.asNumber.top > 48
          && windowConfig.position.asNumber.left < (windowWidth - windowConfig.width),
      }"
      draggable
    >
      <slot name="header">
        <span>
          <slot name="icon">
            <v-icon
              v-if="windowConfig.icon"
              class="mr-2 primary--text"
              v-text="windowConfig.icon"
            />
          </slot>

          <h3 class="font-size-14 d-inline-block">{{ windowConfig.header | translate }}</h3>
        </span>
      </slot>

      <slot name="close">
        <v-icon
          @click="$emit('close', windowConfig.id)"
          size="16"
          v-text="'mdi-close-thick'"
        />
      </slot>
    </v-sheet>

    <v-sheet
      class="v-sheet elevation-3 overflow-y-auto overflow-x-hidden w-full"
      :class="{
        'rounded-br': windowConfig.position.asNumber.top > 0
          && windowConfig.position.asNumber.left < (windowWidth - windowConfig.width),
        'rounded-bl': windowConfig.position.asNumber.left > 0,
      }"
    >
      <slot />
    </v-sheet>
  </div>
</template>

<script>
  import { computed, defineComponent } from '@vue/composition-api';

  export default defineComponent({
    props: {
      windowConfig: Object,
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

