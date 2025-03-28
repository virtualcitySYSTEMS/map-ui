<template>
  <v-container>
    <VcsFormButton
      v-for="num in [1, 2]"
      :key="num"
      @click.stop="toggle(num)"
      class="ma-1"
      >toggle child {{ num }}</VcsFormButton
    >
  </v-container>
</template>

<script>
  import { VContainer } from 'vuetify/components';
  import { VcsFormButton, WindowSlot } from '@vcmap/ui';
  import { inject } from 'vue';
  import WindowExampleContent from './WindowExampleContent.vue';
  import { name as owner } from '../package.json';

  export default {
    name: 'WindowExampleContent',
    components: { VContainer, VcsFormButton },
    setup(props, { attrs }) {
      const app = inject('vcsApp');
      const parentId = attrs['window-state'].id;
      const childId = `dynamicChild-${parentId}`;

      return {
        toggle(num) {
          const id = `${childId}-${num}`;
          if (app.windowManager.has(id)) {
            app.windowManager.remove(id);
          } else {
            app.windowManager.add(
              {
                id,
                parentId,
                state: {
                  headerTitle: `Example dynamicChild ${num}`,
                  headerIcon: 'mdi-human-child',
                },
                component: WindowExampleContent,
                slot: WindowSlot.DYNAMIC_CHILD,
              },
              owner,
            );
          }
        },
      };
    },
  };
</script>
<style scoped></style>
