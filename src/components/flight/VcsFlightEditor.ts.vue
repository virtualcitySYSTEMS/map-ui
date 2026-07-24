<template>
  <AbstractConfigEditor
    class="vcs-flight-editor"
    @submit="apply"
    @cancel="cancel"
    @reset="reset"
    v-bind="{ ...$attrs, ...$props }"
  >
    <VcsFlightComponent
      :parent-id="parentId"
      v-bind="{ ...$attrs, ...$props }"
    />
  </AbstractConfigEditor>
</template>

<script lang="ts">
  import { defineComponent, onUnmounted, provide } from 'vue';
  import type { PropType } from 'vue';
  import { FlightInstance } from '@vcmap/core';
  import deepEqual from 'fast-deep-equal';
  import AbstractConfigEditor from '../plugins/AbstractConfigEditor.ts.vue';
  import VcsFlightComponent from './VcsFlightComponent.ts.vue';
  import type { WindowState } from '../../manager/window/windowManager.js';

  /**
   * An editor component for viewpoints using AbstractConfigEditor and VcsFlightComponent
   * @vue-prop {() => import("@vcmap/core").FlightInstance} getProvidedFlightInstance
   * @vue-prop {(instance: import("@vcmap/core").FlightInstance) => Promise<void>} setFlightInstance
   */
  export default defineComponent({
    name: 'VcsFlightEditor',
    components: {
      AbstractConfigEditor,
      VcsFlightComponent,
    },
    props: {
      getFlightInstance: {
        type: Function as PropType<() => FlightInstance>,
        required: true,
      },
      setFlightInstance: {
        type: Function as PropType<(instance: FlightInstance) => Promise<void>>,
        required: true,
      },
      resetFlightInstance: {
        type: Function as PropType<(instance: FlightInstance) => Promise<void>>,
        default: () => Promise.resolve(),
      },
    },
    emits: ['close'],
    setup(props, { attrs, emit }) {
      const flightInstance = props.getFlightInstance();
      let cancel = false;

      const originalConfig = flightInstance.toJSON();
      provide('flightInstance', flightInstance);

      onUnmounted(async () => {
        if (!cancel && !deepEqual(originalConfig, flightInstance.toJSON())) {
          await props.setFlightInstance(flightInstance);
        }
      });

      return {
        parentId: (attrs['window-state'] as WindowState).id,
        apply(): void {
          emit('close');
        },
        async cancel(): Promise<void> {
          cancel = true;
          await props.resetFlightInstance(new FlightInstance(originalConfig));
          emit('close');
        },
        async reset(): Promise<void> {
          await props.resetFlightInstance(new FlightInstance(originalConfig));
        },
      };
    },
  });
</script>

<style scoped></style>
