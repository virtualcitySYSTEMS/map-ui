<template>
  <Button
    @click.native="() => toggle(windowState)"
    toggleable
    :icon="icon"
    :v-bind="{...$props, ...$attrs} "
    :value="!!windowComponents[componentName]"
    :title="componentName"
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
      componentName: {
        type: String,
        default: '',
      },
      windowState: {
        type: Object,
        default: () => ({}),
      },
      icon: {
        type: String,
        default: '',
      },
    },
  });
</script>
