<template>
  <div class="w-full">
    <slot>
      <collection-component />
    </slot>
  </div>
</template>

<script>
  import { inject, provide } from 'vue';
  import CollectionComponent from './CollectionComponent.vue';

  /**
   * @description Provides a CollectionComponentClass of a CollectionManager.
   * Default rendering of the slot is the `CollectionComponent.vue`
   * The collectionManager must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   * @vue-prop {string} componentId - ID of the collectionComponent to be provided
   * @vue-data {slot} [#default] - Slot rendering collection component.
   */
  export default {
    name: 'CollectionManagerProvider',
    components: {
      CollectionComponent,
    },
    props: {
      componentId: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      /**
       * @type {import("./collectionManager.js").CollectionManager}
       */
      const collectionManager = inject('collectionManager');
      const collectionComponent = collectionManager.get(props.componentId);
      provide('collectionComponent', collectionComponent);
    },
  };
</script>
