<template>
  <AbstractConfigEditor
    class="vcs-flight-editor"
    @submit="apply"
    @cancel="cancel"
    @reset="reset"
    v-bind="{ ...$attrs, ...$props }"
  >
    <VcsFlightComponent
      :parent-id="$attrs['window-state'].id"
      v-bind="{ ...$attrs, ...$props }"
    />
  </AbstractConfigEditor>
</template>

<script>
  import { onUnmounted, provide } from 'vue';
  import { FlightInstance } from '@vcmap/core';
  import deepEqual from 'fast-deep-equal';
  import AbstractConfigEditor from '../plugins/AbstractConfigEditor.vue';
  import VcsFlightComponent from './VcsFlightComponent.vue';

  /**
   * An editor component for viewpoints using AbstractConfigEditor and VcsFlightComponent
   * @vue-prop {() => import("@vcmap/core").FlightInstance} getProvidedFlightInstance
   * @vue-prop {(instance: import("@vcmap/core).FlightInstance) => Promise<void>} setFlightInstance
   */
  export default {
    name: 'VcsFlightEditor',
    components: {
      AbstractConfigEditor,
      VcsFlightComponent,
    },
    props: {
      getFlightInstance: {
        type: Function,
        required: true,
      },
      setFlightInstance: {
        type: Function,
        required: true,
      },
      resetFlightInstance: {
        type: Function,
        default: () => {},
      },
    },
    setup(props, { emit }) {
      const flightInstance = props.getFlightInstance();
      let cancel = false;

      const originalConfig = flightInstance.toJSON();
      provide('flightInstance', flightInstance);

      onUnmounted(() => {
        if (!cancel && !deepEqual(originalConfig, flightInstance.toJSON())) {
          props.setFlightInstance(flightInstance);
        }
      });

      return {
        async apply() {
          emit('close');
        },
        async cancel() {
          await props.resetFlightInstance(new FlightInstance(originalConfig));
          cancel = true;
          emit('close');
        },
        async reset() {
          await props.resetFlightInstance(new FlightInstance(originalConfig));
        },
      };
    },
  };
</script>

<style scoped></style>
