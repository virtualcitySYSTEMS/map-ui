<template>
  <Button
    @click.native="toggle"
    toggleable
    :icon="icon"
    :v-bind="{...$props, ...$attrs} "
    :value="state"
    :title="title"
  >
    <slot />
  </Button>
</template>

<script>
  import { defineComponent } from '@vue/composition-api';
  import Button from '@vcsuite/uicomponents/Button.vue';

  export default defineComponent({
    setup(props, { emit }) {
      const toggle = (e) => {
        emit('toggle', e);
      };
      return { toggle };
    },
    components: { Button },
    props: {
      state: {
        type: Boolean,
        default: false,
      },
      title: {
        type: String,
        default: '',
      },
      icon: {
        type: String,
        default: '',
      },
    },
  });
</script>
