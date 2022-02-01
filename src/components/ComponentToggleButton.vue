<template>
  <VcsButton
    @click="toggle"
    :icon="icon"
    :v-bind="{...$props, ...$attrs} "
    :title="title"
    :isActive="state"
  >
    <slot />
  </VcsButton>
</template>

<script>
  import { defineComponent } from '@vue/composition-api';
  import { VcsButton } from '@vcsuite/ui-components';

  export default defineComponent({
    setup(props, { emit }) {
      const toggle = (e) => {
        emit('toggle', e);
      };
      return { toggle };
    },
    components: { VcsButton },
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
