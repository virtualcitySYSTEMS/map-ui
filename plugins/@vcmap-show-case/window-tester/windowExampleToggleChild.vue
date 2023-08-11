<template>
  <v-container>
    <VcsFormButton @click="toggle">toggle child</VcsFormButton>
  </v-container>
</template>

<style scoped></style>
<script>
  import { VContainer } from 'vuetify/lib';
  import { VcsFormButton, WindowSlot } from '@vcmap/ui';
  import { inject } from 'vue';
  import WindowExampleContent from './windowExampleContent.vue';
  import { name as owner } from './package.json';

  export default {
    name: 'WindowExampleContent',
    components: { VContainer, VcsFormButton },
    setup(props, { attrs }) {
      const app = inject('vcsApp');
      const parentId = attrs['window-state'].id;
      const childId = `dynamicChild-${parentId}`;
      const childComponent = {
        id: childId,
        parentId,
        state: {
          headerTitle: 'Example dynamicChild',
          headerIcon: 'mdi-human-child',
        },
        component: WindowExampleContent,
        slot: WindowSlot.DYNAMIC_CHILD,
      };

      return {
        toggle(e) {
          if (app.windowManager.has(childId)) {
            app.windowManager.remove(childId);
          } else {
            e.stopPropagation();
            app.windowManager.add(childComponent, owner);
          }
        },
      };
    },
  };
</script>
