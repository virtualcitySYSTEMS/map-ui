<template>
  <v-sheet>
    <VcsViewpointComponent v-model="viewpointOptions" />
    <div class="d-flex gap-2 px-2 pt-2 pb-1">
      <div class="d-flex gap-2 w-full justify-start">
        <VcsFormButton icon="$vcsReturn" @click="reset" />
      </div>
      <div class="d-flex gap-2 w-full justify-end">
        <VcsFormButton type="submit" variant="filled" @click="log">
          Log ViewpointOptions
        </VcsFormButton>
      </div>
    </div>
  </v-sheet>
</template>

<script>
  import { VSheet } from 'vuetify/lib';
  import { inject, ref } from 'vue';
  import { VcsViewpointComponent, VcsFormButton } from '@vcmap/ui';
  import { Viewpoint } from '@vcmap/core';

  export default {
    name: 'ViewpointExample',
    components: {
      VcsFormButton,
      VSheet,
      VcsViewpointComponent,
    },
    setup() {
      const app = inject('vcsApp');
      const defaultViewpointOptions =
        app.maps.activeMap?.getViewpointSync()?.toJSON() ||
        Viewpoint.getDefaultOptions();

      const viewpointOptions = ref(structuredClone(defaultViewpointOptions));

      return {
        viewpointOptions,
        reset() {
          viewpointOptions.value = structuredClone(defaultViewpointOptions);
          app.maps.activeMap.gotoViewpoint(
            new Viewpoint(viewpointOptions.value),
          );
        },
        log() {
          console.log({ ...viewpointOptions.value });
        },
      };
    },
  };
</script>
