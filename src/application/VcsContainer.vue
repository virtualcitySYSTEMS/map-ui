<template>
  <v-container
    class="vcs-container pa-0"
    :class="{
      'vcs-container-xs': xs,
      'with-header': !config.hideHeader,
      'without-header': config.hideHeader,
      'without-footer': config.hideFooter,
    }"
    fluid
    absolute
  >
    <template v-if="xs">
      <img
        v-if="mobileLogo"
        :src="mobileLogo"
        alt="Logo"
        draggable="false"
        class="mobile-logo"
      />
    </template>
    <!--VcsButton
      v-if="!$vuetify.breakpoint.smAndUp && $vuetify.breakpoint.mobile"
      :key="attributionAction.name"
      :tooltip="attributionAction.title"
      :icon="attributionAction.icon"
      :active="attributionAction.active"
      @click.stop="attributionAction.callback($event)"
      class="z-index-1 mobile-attribution-btn"
    /-->
    <PanelManagerComponent />
    <ToolboxManagerComponent v-if="!config.hideToolbox" />
    <WindowManagerComponent />
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
    bottom: 56px;
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
    right: 2px;
    bottom: 36px;
  }
  .z-index-1 {
    z-index: 1;
  }
</style>

<script>
  import { computed, inject } from 'vue';
  import { useDisplay } from 'vuetify';
  import { VContainer } from 'vuetify/components';
  import PanelManagerComponent from '../manager/panel/PanelManagerComponent.vue';
  import WindowManagerComponent from '../manager/window/WindowManager.vue';
  import ToolboxManagerComponent from '../manager/toolbox/ToolboxManagerComponent.vue';
  import NotifierComponent from '../notifier/NotifierComponent.vue';
  import VcsDefaultLogoMobile from '../logo-mobile.svg';

  /**
   * @description The main container with map canvas
   * @vue-prop {VcsAction} attributionAction
   */
  export default {
    components: {
      PanelManagerComponent,
      WindowManagerComponent,
      ToolboxManagerComponent,
      VContainer,
      NotifierComponent,
    },
    props: {
      attributionAction: {
        type: Object,
        required: true,
      },
    },
    setup() {
      /** @type {import("../vcsUiApp.js").default} */
      const app = inject('vcsApp');
      const { xs } = useDisplay();
      return {
        config: app.uiConfig.config,
        xs,
        mobileLogo: computed(
          () =>
            app.uiConfig.config.mobileLogo ??
            app.uiConfig.config.logo ??
            VcsDefaultLogoMobile,
        ),
      };
    },
  };
</script>
