<template>
  <AbstractConfigEditor
    @submit="apply"
    @reset="reset"
    show-reset
    v-bind="{ ...$attrs, ...$props }"
  >
    <VcsViewpointComponent v-model="localConfig" v-bind="{ ...$attrs }" />
  </AbstractConfigEditor>
</template>

<script>
  import { inject, ref } from 'vue';
  import { Viewpoint } from '@vcmap/core';
  import { getLogger } from '@vcsuite/logger';
  import AbstractConfigEditor from '../plugins/AbstractConfigEditor.vue';
  import VcsViewpointComponent from './VcsViewpointComponent.vue';

  /**
   * An editor component for viewpoints using AbstractConfigEditor and VcsViewpointComponent
   * @vue-prop {() => import("@vcmap/core").ViewpointOptions} getConfig
   * @vue-prop {(options: import("@vcmap/core").ViewpointOptions) => Promise<void>} setConfig
   */
  export default {
    name: 'VcsViewpointEditor',
    components: {
      AbstractConfigEditor,
      VcsViewpointComponent,
    },
    props: {
      getConfig: {
        type: Function,
        required: true,
      },
      setConfig: {
        type: Function,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp');
      const localConfig = ref({});

      async function gotoViewpoint() {
        const clone = structuredClone(localConfig.value);
        clone.animate = false;
        const viewpoint = new Viewpoint(clone);
        if (app?.maps.activeMap && viewpoint.isValid()) {
          await app.maps.activeMap.gotoViewpoint(viewpoint);
        }
      }

      async function apply() {
        await props.setConfig(localConfig.value);
      }

      async function reset() {
        localConfig.value = await props.getConfig();
        await gotoViewpoint();
      }

      reset().catch((err) => getLogger('VcsViewpointEditor.vue').error(err));

      return {
        localConfig,
        apply,
        reset,
      };
    },
  };
</script>

<style scoped></style>
