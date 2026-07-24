<template>
  <AbstractConfigEditor
    class="vcs-viewpoint-editor"
    @submit="apply"
    @cancel="cancel"
    @reset="reset"
    :auto-close="false"
    v-bind="{ ...$attrs, ...$props }"
  >
    <VcsViewpointComponent
      hide-name
      :name-rules="nameRules"
      v-bind="$attrs"
      v-model="localConfig"
    />
  </AbstractConfigEditor>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent, inject, onUnmounted, ref, toRaw } from 'vue';
  import type { ViewpointOptions } from '@vcmap/core';
  import { getLogger } from '@vcsuite/logger';
  import deepEqual from 'fast-deep-equal';
  import AbstractConfigEditor from '../plugins/AbstractConfigEditor.ts.vue';
  import VcsViewpointComponent, {
    gotoViewpointOptions,
  } from './VcsViewpointComponent.ts.vue';
  import type VcsUiApp from '../../vcsUiApp.js';

  /**
   * An editor component for viewpoints using AbstractConfigEditor and VcsViewpointComponent
   * @vue-prop nameRules Optional rules for name input.
   */
  export default defineComponent({
    name: 'VcsViewpointEditor',
    components: {
      AbstractConfigEditor,
      VcsViewpointComponent,
    },
    props: {
      getConfig: {
        type: Function as PropType<() => ViewpointOptions>,
        required: true,
      },
      setConfig: {
        type: Function as PropType<(config: ViewpointOptions) => Promise<void>>,
        required: true,
      },
      nameRules: {
        type: Array as PropType<Array<(v: string) => boolean | string>>,
        default: () => [],
      },
    },
    emits: ['close'],
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;
      const localConfig = ref(props.getConfig());
      const originalConfig = structuredClone(props.getConfig());
      let cancel = false;

      async function gotoViewpoint(): Promise<void> {
        await gotoViewpointOptions(app, localConfig.value);
      }

      async function reset(): Promise<void> {
        localConfig.value = props.getConfig();
        await gotoViewpoint();
      }

      gotoViewpoint().catch((err: unknown) => {
        getLogger('ViewpointEditor.vue').error(String(err));
      });

      onUnmounted(async () => {
        if (!cancel && !deepEqual(originalConfig, toRaw(localConfig.value))) {
          await props.setConfig(localConfig.value);
        }
      });

      return {
        localConfig,
        reset,
        apply(): void {
          emit('close');
        },
        async cancel(): Promise<void> {
          await reset();
          cancel = true;
          emit('close');
        },
      };
    },
  });
</script>

<style scoped></style>
