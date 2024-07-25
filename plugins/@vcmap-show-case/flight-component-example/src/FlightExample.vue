<template>
  <v-sheet>
    <VcsFlightComponent
      v-if="hasFlightInstance"
      :parent-id="$attrs['window-state'].id"
    />
    <div class="d-flex gc-2 px-2 pt-2 pb-1">
      <div class="d-flex gc-2 w-full justify-end">
        <VcsFormButton type="submit" variant="filled" @click="log">
          Log FlightOptions
        </VcsFormButton>
        <VcsFormButton @click="reset" icon="$vcsReturn" tooltip="Reset" />
      </div>
    </div>
  </v-sheet>
</template>

<script>
  import { VSheet } from 'vuetify/components';
  import {
    provide,
    ref,
    shallowRef,
    nextTick,
    toRaw,
    isReactive,
    reactive,
    watch,
  } from 'vue';
  import { VcsFlightComponent, VcsFormButton } from '@vcmap/ui';
  import { FlightInstance } from '@vcmap/core';

  export default {
    name: 'FlightExample',
    components: {
      VcsFormButton,
      VSheet,
      VcsFlightComponent,
    },
    setup() {
      const defaultFlightOptions = FlightInstance.getDefaultOptions();
      const flightInstance = shallowRef(
        new FlightInstance(defaultFlightOptions),
      );
      const hasFlightInstance = ref(true);
      provide('flightInstance', flightInstance);

      const obj = ref({
        foo: {
          bar: true,
          array: [1, 2, 3],
          obj: {
            baz: 'abc',
          },
        },
      });
      console.log('obj', obj);
      const raw = toRaw(obj);
      console.log('toRaw obj', raw);
      console.log('isReactive obj', isReactive(raw));
      console.log('isReactive foo', isReactive(raw.foo));
      console.log('isReactive array', isReactive(raw.array));

      const props = reactive({
        raw,
      });

      const internal = ref(structuredClone(toRaw(props.raw)));

      watch(
        internal,
        (newObj) => {
          console.log('watch', newObj);
        },
        { deep: true },
      );
      internal.value.foo.array[2] = 5;

      return {
        hasFlightInstance,
        async reset() {
          hasFlightInstance.value = false;
          flightInstance.value = new FlightInstance(defaultFlightOptions);
          await nextTick();
          hasFlightInstance.value = true;
        },
        log() {
          console.log(flightInstance.value.toJSON());
        },
      };
    },
  };
</script>
