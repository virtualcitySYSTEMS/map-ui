<template>
  <div>
    <VcsFormButton
      v-for="(example, index) in examples"
      :key="`b-${index}`"
      @click="(e) => toggle(e, example)"
      class="pa-1"
    >
      toggle {{ example }}
    </VcsFormButton>

    <VcsFormButton @click="toggleClass()" :active="showTestClass" class="pa-1">
      Change Static2 TestClass
    </VcsFormButton>
  </div>
</template>
<style></style>
<script>
  import { inject, onUnmounted, ref, computed } from 'vue';
  import { getLogger } from '@vcsuite/logger';

  import { WindowSlot, VcsFormButton } from '@vcmap/ui';
  import WindowExampleToggleChild from './windowExampleToggleChild.vue';
  import WindowExampleContent from './windowExampleContent.vue';
  import MyCustomHeader from './myCustomHeader.vue';
  import EmptyComponent from './emptyComponent.vue';
  import { name as owner } from './package.json';

  const showTestClass = ref(false);

  export default {
    name: 'WindowExample',
    components: { VcsFormButton },
    setup() {
      const exampleWindows = [
        {
          id: 'dynamicLeft',
          headerTitle: 'Example dynamicLeft',
          component: WindowExampleToggleChild,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        {
          id: 'dynamicLeft2',
          state: {
            headerTitle: 'Example dynamicLeft2',
          },
          component: WindowExampleToggleChild,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        {
          id: 'dynamicLeft2 large',
          state: {
            headerTitle: 'Example dynamicLeft2 with 1000px width',
          },
          component: WindowExampleToggleChild,
          slot: WindowSlot.DYNAMIC_LEFT,
          position: {
            width: '1000px',
          },
        },
        {
          id: 'dynamicRight',
          state: {
            headerTitle: 'Example dynamicRight',
          },
          component: WindowExampleContent,
          headerComponent: MyCustomHeader,
          slot: WindowSlot.DYNAMIC_RIGHT,
          props: {
            sample: 'A window property',
          },
        },
        {
          id: 'dynamicRight2',
          state: {
            headerTitle: 'Example dynamicRight2',
          },
          component: WindowExampleContent,
          slot: WindowSlot.DYNAMIC_RIGHT,
        },
        {
          id: 'static',
          state: {
            headerTitle: 'Example static',
            styles: { 'background-color': 'red' },
          },
          component: WindowExampleToggleChild,
          slot: WindowSlot.STATIC,
        },
        {
          id: 'static2',
          state: {
            headerTitle: 'Example static2 With TestClass',
            classes: {
              vcsTest: computed(() => {
                return showTestClass.value;
              }),
            },
          },
          component: EmptyComponent,
          slot: WindowSlot.STATIC,
        },
        {
          id: 'position1',
          state: {
            headerTitle: 'Example position1 relative',
          },
          component: WindowExampleToggleChild,
          position: {
            left: '30%',
            right: '30%',
            top: '40%',
            bottom: '20%',
          },
        },
        {
          id: 'position2',
          state: {
            hideHeader: false,
            headerTitle: 'Example position2 absolute',
          },
          component: WindowExampleToggleChild,
          position: {
            left: '200px',
            top: '300px',
            minHeight: '250px',
            maxHeight: '500px',
            minWidth: '400px',
            maxWidth: '1000px',
          },
        },
      ];

      onUnmounted(() => {
        // can be used to get a callback when the window is closed
        getLogger('windowManagerExample').log('got unmounted');
      });

      const app = inject('vcsApp');
      return {
        showTestClass,
        toggleClass() {
          showTestClass.value = !showTestClass.value;
          if (app.windowManager.has('static2')) {
            if (showTestClass.value) {
              app.windowManager.get('static2').state.classes = ['vcsTest'];
            } else {
              app.windowManager.get('static2').state.classes = [];
            }
          }
        },
        toggle(e, windowId) {
          if (app.windowManager.has(windowId)) {
            app.windowManager.remove(windowId);
          } else {
            e.stopPropagation();
            const windowComponentOptions = exampleWindows.find(
              (item) => item.id === windowId,
            );
            app.windowManager.add(windowComponentOptions, owner);
          }
        },
        examples: exampleWindows.map((item) => item.id),
      };
    },
  };
</script>
