<template>
  <div class="w-100 collection-component-provider">
    <slot>
      <CollectionComponent />
    </slot>
  </div>
</template>

<script lang="ts">
  import { defineComponent, inject, provide } from 'vue';
  import CollectionComponent from './CollectionComponent.ts.vue';
  import type CollectionManager from './collectionManager.js';

  /**
   * @description Provides a CollectionComponentClass of a CollectionManager.
   * Default rendering of the slot is the `CollectionComponent.ts.vue`
   * The collectionManager must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   * @vue-prop {string} componentId - ID of the collectionComponent to be provided
   * @vue-data {slot} [#default] - Slot rendering collection component.
   */
  export default defineComponent({
    name: 'CollectionComponentProvider',
    components: { CollectionComponent },
    props: {
      componentId: { type: String, required: true },
    },
    setup(props) {
      const collectionManager = inject(
        'collectionManager',
      ) as CollectionManager;
      const collectionComponent = collectionManager.get(props.componentId);
      provide('collectionComponent', collectionComponent);
    },
  });
</script>
