<template>
  <div>
    <VcsButton v-for="(example, index) in examples" :key="`b-${index}`" @click="(e) => toggle(e, example)">
      toggle {{ example }}
    </VcsButton>

    <VcsButton @click="toggleClass()">
      Change Static2 TestClass
    </VcsButton>
  </div>
</template>
<style>


</style>
<script>
  import { inject, onUnmounted, ref, computed } from '@vue/composition-api';
  import { getLogger } from '@vcsuite/logger';
  import { VcsButton } from '@vcsuite/ui-components';

  import { EmptyCmpt, windowSlot } from '@vcmap/ui';
  import VcsContent from './vcsContent.vue';
  import MyCustomHeader from './myCustomHeader.vue';

  const showTestClass = ref(false);

  export default {
    name: 'WindowManagerExample',
    components: { VcsButton },
    setup() {
      const exampleWindows = [
        {
          id: 'dynamicLeft',
          headerTitle: 'Example dynamicLeft',
          component: EmptyCmpt,
          slot: windowSlot.DYNAMIC_LEFT,
        },
        {
          id: 'dynamicLeft2',
          state: {
            headerTitle: 'Example dynamicLeft2',
          },
          component: EmptyCmpt,
          slot: windowSlot.DYNAMIC_LEFT,
        },
        {
          id: 'dynamicRight',
          state: {
            headerTitle: 'Example dynamicRight',
          },
          component: EmptyCmpt,
          headerComponent: MyCustomHeader,
          slot: windowSlot.DYNAMIC_RIGHT,
        },
        {
          id: 'dynamicRight2',
          state: {
            headerTitle: 'Example dynamicRight2',
          },
          component: EmptyCmpt,
          slot: windowSlot.DYNAMIC_RIGHT,
        },
        {
          id: 'static',
          state: {
            headerTitle: 'Example static',
            styles: { 'background-color': 'red' },
          },
          component: VcsContent,
          slot: windowSlot.STATIC,
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
          component: VcsContent,
          slot: windowSlot.STATIC,
        },
        {
          id: 'position1',
          state: {
            headerTitle: 'Example position1',
          },
          component: VcsContent,
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
            hideHeader: true,
            headerTitle: 'Example position2',
          },
          component: EmptyCmpt,
          position: {
            left: '35%',
            right: '35%',
            top: '40%',
            bottom: '20%',
          },
        },
      ];

      onUnmounted(() => {
        // can be used to get a callback when the window is closed
        getLogger('windowManagerExample').log('got unmounted');
      });

      /**
       * @type {Map<string, WindowComponent>}
       */
      const windowComponents = new Map();

      const app = inject('vcsApp');
      return {
        toggleClass() {
          showTestClass.value = !showTestClass.value;
        },
        toggle(e, windowId) {
          if (app.windowManager.has(windowId)) {
            app.windowManager.remove(windowId);
          } else {
            e.stopPropagation();
            const windowComponentOptions =
              windowComponents.get(windowId) || exampleWindows.find(item => item.id === windowId);
            const windowComponent = app.windowManager.add(windowComponentOptions, 'WindowManagerExample');
            windowComponents.set(windowId, windowComponent);
          }
        },
        examples: exampleWindows.map(item => item.id),
      };
    },
  };
</script>
