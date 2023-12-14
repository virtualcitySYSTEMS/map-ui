<template>
  <AbstractConfigEditor
    @submit="apply"
    v-bind="{ ...$attrs, ...$props }"
    :set-config-on-cancel="false"
  >
    <VcsFlightComponent :parent-id="$attrs['window-state'].id" />
  </AbstractConfigEditor>
</template>

<script>
  import { provide } from 'vue';
  import AbstractConfigEditor from '../plugins/AbstractConfigEditor.vue';
  import VcsFlightComponent from './VcsFlightComponent.vue';

  /**
   * An editor component for viewpoints using AbstractConfigEditor and VcsFlightComponent
   * @vue-prop {() => import("@vcmap/core").FlightInstance} getProvidedFlightInstance
   * @vue-prop {(instance: import("@vcmap/core).FlightInstance) => Promise<void>} setFlightInstance
   */
  export default {
    name: 'VcsViewpointEditor',
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
    },
    setup(props) {
      const flightInstance = props.getFlightInstance();
      provide('flightInstance', flightInstance);

      async function apply() {
        await props.setFlightInstance(flightInstance);
      }

      return {
        apply,
      };
    },
  };
</script>

<style scoped></style>
