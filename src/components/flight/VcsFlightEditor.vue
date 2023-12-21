<template>
  <AbstractConfigEditor
    @submit="apply"
    @cancel="reset"
    @reset="reset"
    v-bind="{ ...$attrs, ...$props }"
    :set-config-on-cancel="false"
  >
    <VcsFlightComponent
      :parent-id="$attrs['window-state'].id"
      v-bind="{ ...$attrs, ...$props }"
    />
  </AbstractConfigEditor>
</template>

<script>
  import { provide } from 'vue';
  import { FlightInstance } from '@vcmap/core';
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
    setup(props) {
      const flightInstance = props.getFlightInstance();

      const originalConfig = flightInstance.toJSON();
      provide('flightInstance', flightInstance);

      return {
        async apply() {
          await props.setFlightInstance(flightInstance);
        },
        async reset() {
          await props.resetFlightInstance(new FlightInstance(originalConfig));
        },
      };
    },
  };
</script>

<style scoped></style>
