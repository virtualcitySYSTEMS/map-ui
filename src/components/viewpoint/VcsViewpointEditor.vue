<template>
  <AbstractConfigEditor
    @submit="apply"
    @cancel="cancel"
    @reset="reset"
    :auto-close="false"
    v-bind="{ ...$attrs, ...$props }"
  >
    <VcsViewpointComponent
      v-model="localConfig"
      hide-name
      :name-rules="nameRules"
    />
  </AbstractConfigEditor>
</template>

<script>
  import { inject, onUnmounted, ref } from 'vue';
  import { getLogger } from '@vcsuite/logger';
  import deepEqual from 'fast-deep-equal';
  import AbstractConfigEditor from '../plugins/AbstractConfigEditor.vue';
  import VcsViewpointComponent, {
    gotoViewpointOptions,
  } from './VcsViewpointComponent.vue';

  /**
   * An editor component for viewpoints using AbstractConfigEditor and VcsViewpointComponent
   * @vue-prop {() => import("@vcmap/core").ViewpointOptions} getConfig
   * @vue-prop {(import("@vcmap/core").ViewpointOptions) => Promise<void>} setConfig
   * @vue-prop {Array<(v:string)=>(boolean|string)>} nameRules - Optional rules for name input.
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
      nameRules: {
        type: Array,
        default: () => [],
      },
    },
    setup(props, { emit }) {
      const app = inject('vcsApp');
      const localConfig = ref(props.getConfig());
      const originalConfig = structuredClone(props.getConfig());
      let cancel = false;

      async function gotoViewpoint() {
        await gotoViewpointOptions(app, localConfig.value);
      }

      async function reset() {
        localConfig.value = props.getConfig();
        await gotoViewpoint();
      }

      gotoViewpoint().catch((err) =>
        getLogger('ViewpointEditor.vue').error(err),
      );

      onUnmounted(() => {
        if (
          !cancel &&
          !deepEqual(originalConfig, structuredClone(localConfig.value))
        ) {
          props.setConfig(localConfig.value);
        }
      });

      return {
        localConfig,
        apply() {
          emit('close');
        },
        async cancel() {
          await reset();
          cancel = true;
          emit('close');
        },
        reset,
      };
    },
  };
</script>

<style scoped></style>
