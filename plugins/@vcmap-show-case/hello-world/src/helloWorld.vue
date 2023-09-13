<template>
  <v-sheet class="hello-world">
    <v-card class="pa-2 ma-2">
      <v-container>
        <v-row class="justify-center mb-4">
          <h1>{{ $t('helloWorld.helloWorld') }}</h1>
        </v-row>
        <v-row class="justify-center mb-4">
          <v-img :src="logoUrl" alt="plugin-assets example" max-width="200" />
        </v-row>
        <v-row class="justify-center">
          <VcsButton
            v-if="showHelloWorldBtn"
            icon="mdi-times"
            tooltip="helloWorld.logTooltip"
            @click="helloWorld"
          >
            {{ $t('helloWorld.log') }}
          </VcsButton>
          <VcsButton icon="mdi-times" @click="closeSelf">
            {{ $t('helloWorld.close') }}
          </VcsButton>
        </v-row>
      </v-container>
    </v-card>
  </v-sheet>
</template>

<style scoped lang="scss">
  .hello-world {
    background-color: aqua;
  }
</style>
<script>
  import { inject } from 'vue';
  import { VcsButton, getPluginAssetUrl } from '@vcmap/ui';
  import { VSheet, VCard, VContainer, VRow, VImg } from 'vuetify/lib';
  import { name } from '../package.json';

  export const windowId = 'hello_world_window_id';

  export default {
    name: 'HelloWorld',
    components: {
      VcsButton,
      VSheet,
      VCard,
      VContainer,
      VRow,
      VImg,
    },
    setup() {
      const app = inject('vcsApp');
      const { helloWorld, showHelloWorldBtn } = app.plugins.getByKey(name);

      return {
        closeSelf() {
          app.windowManager.remove(windowId);
        },
        helloWorld() {
          // eslint-disable-next-line no-console
          console.log(helloWorld());
        },
        showHelloWorldBtn,
        logoUrl: getPluginAssetUrl(app, name, 'plugin-assets/vcs_logo.png'),
      };
    },
  };
</script>
