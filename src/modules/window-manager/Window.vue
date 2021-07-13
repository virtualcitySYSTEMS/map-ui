<template>
  <div class="d-contents">
    <v-sheet
      class="cursor-grab v-sheet d-flex justify-space-between pa-2 transition-color-100-ease"
      :class="{
        'grey--text': zIndex < zIndexMax,
        'rounded-tl': window.position.asNumber.top > 48
          && window.position.asNumber.left > 0,
        'rounded-tr': window.position.asNumber.top > 48
          && window.position.asNumber.left < (windowWidth - window.width),
      }"
      draggable
    >
      <slot name="header">
        <span>
          <slot name="icon">
            <v-icon v-if="window.icon" class="mr-2 primary--text" v-text="window.icon" />
          </slot>

          <h3 class="font-size-14 d-inline-block">{{ window.header | translate }}</h3>
        </span>
      </slot>

      <slot name="close">
        <v-icon
          @click="$emit('close', window.id)"
          size="16"
          v-text="'mdi-close-thick'"
        />
      </slot>
    </v-sheet>

    <v-sheet
      class="v-sheet elevation-3 overflow-y-auto overflow-x-hidden w-full"
      :class="{
        'rounded-br': window.position.asNumber.top > 0
          && window.position.asNumber.left < (windowWidth - window.width),
        'rounded-bl': window.position.asNumber.left > 0,
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
      window: Object,
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

