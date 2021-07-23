<template>
  <Button
    @click.native="() => toggle(windowConfig)"
    toggleable
    :icon="icon"
    :v-bind="{...$props, ...$attrs} "
    :value="!!windowComponents[componentName]"
  >
    <slot />
  </Button>
</template>

<script>
  import { defineComponent, inject } from '@vue/composition-api';
  import Button from '@vcsuite/uicomponents/Button.vue';

  export default defineComponent({
    setup() {
      const windowManager = inject('windowManager');
      const { state: { items: windowComponents } } = windowManager;
      const toggle = c => windowManager.toggle(c);

      return { toggle, windowComponents };
    },
    components: { Button },
    props: {
      componentName: String,
      windowConfig: Object,
      icon: String,
    },
  });
</script>
