<script setup lang="ts">
  import { inject } from 'vue';
  import { useDisplay } from 'vuetify';
  import { VContainer } from 'vuetify/components';
  import type VcsUiApp from '../vcsUiApp.js';
  import { getMobileLogo } from './uiConfigHelper.js';
  import VcsButton from '../components/buttons/VcsButton.ts.vue';
  import PanelManagerComponent from '../manager/panel/PanelManagerComponent.ts.vue';
  import WindowManagerComponent from '../manager/window/WindowManager.ts.vue';
  import ToolboxManagerComponent from '../manager/toolbox/ToolboxManagerComponent.ts.vue';
  import NotifierComponent from '../notifier/NotifierComponent.ts.vue';
  import { isMobileLandscape } from '../vuePlugins/vuetify.js';
  import type { VcsAction } from '../actions/actionHelper.js';

  /**
   * @description The main container with map canvas
   * @vue-prop {VcsAction} attributionAction
   */
  defineProps<{ attributionAction: VcsAction }>();

  const app = inject('vcsApp') as VcsUiApp;
  const { config } = app.uiConfig;

  const { smAndDown, xs, sm, smAndUp } = useDisplay();
  const mobileLandscape = isMobileLandscape();
  const mobileLogo = getMobileLogo(app);
</script>

<template>
  <v-container
    class="vcs-container pa-0"
    :class="{
      'vcs-container-xs': xs,
      'with-header': !config.hideHeader && !mobileLandscape,
      'without-header': config.hideHeader || mobileLandscape,
      'without-footer': config.hideFooter || mobileLandscape,
    }"
    fluid
    absolute
  >
    <template v-if="smAndDown && mobileLogo">
      <img
        :src="mobileLogo"
        alt="Logo"
        draggable="false"
        class="mobile-logo"
        :class="{ 'mobile-logo': sm }"
      />
    </template>
    <VcsButton
      v-if="!smAndUp"
      :data-action-name="attributionAction.name"
      :key="attributionAction.name"
      :tooltip="attributionAction.title"
      icon="mdi-copyright"
      :active="attributionAction.active"
      @click.stop="attributionAction.callback($event)"
      class="z-index-1 mobile-attribution-btn"
    />
    <PanelManagerComponent />
    <ToolboxManagerComponent v-if="!config.hideToolbox && !mobileLandscape" />
    <WindowManagerComponent v-if="!mobileLandscape" />
    <NotifierComponent />
  </v-container>
</template>

<style scoped lang="scss">
  .without-header {
    top: 0px;
  }
  .with-header {
    top: calc(var(--v-vcs-font-size) * 3 + 9px);
  }
  .vcs-container {
    position: absolute;
    left: 0;
    right: 0;
    bottom: round(up, calc(var(--v-vcs-font-size) * 1.65), 1px);
  }
  .vcs-container.without-footer {
    bottom: 0;
  }

  .vcs-container-xs.with-header {
    top: 0;
    bottom: calc(var(--v-vcs-font-size) * 3 + 10px);
  }
  .vcs-container-xs.without-header {
    top: 0;
    bottom: 0px;
  }

  .mobile-logo {
    max-height: 40px;
    max-width: 70px;
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 1;
  }
  .mobile-attribution-btn {
    position: fixed;
    right: 32px;
    bottom: 67px;
    background-color: rgb(from rgb(var(--v-theme-surface-light)) / 0.5);
    color: rgb(var(--v-theme-on-surface));
    backdrop-filter: blur(1px);
    -webkit-backdrop-filter: blur(1px);
    padding: 6px !important;
    padding-bottom: 7px !important;
    border-radius: 4px;
    height: 35px !important;
    width: 35px !important;
    font-size: 20px !important;
    justify-content: center;
    align-items: center;
  }
  ::v-deep(.mobile-attribution-btn span i) {
    font-size: calc(var(--v-vcs-font-size) + 13px) !important;
  }
  .z-index-1 {
    z-index: 1;
  }
</style>
