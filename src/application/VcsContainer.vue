<template>
  <v-container
    class="vcs-container pa-0"
    :class="{ 'vcs-container-xs': xs }"
    fluid
    absolute
    style="background: #1b5e20"
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
    <ToolboxManagerComponent />
    <WindowManagerComponent />
    <NotifierComponent />
  </v-container>
</template>

<style scoped lang="scss">
  .vcs-container {
    position: absolute;
    top: 48px;
    left: 0;
    right: 0;
    bottom: 22px;
  }

  .vcs-container-xs {
    top: 0;
    bottom: 56px;
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
</style>

<script>
  import { computed, inject } from 'vue';
  import { useDisplay } from 'vuetify';
  import { VContainer } from 'vuetify/components';
  import PanelManagerComponent from '../manager/panel/PanelManagerComponent.vue';
  import WindowManagerComponent from '../manager/window/WindowManager.vue';
  import ToolboxManagerComponent from '../manager/toolbox/ToolboxManager.vue';
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
      const app = inject('vcsApp');

      const { xs } = useDisplay();

      return {
        xs,
        mobileLogo: computed(
          () =>
            app.uiConfig.config.value.mobileLogo ??
            app.uiConfig.config.value.logo ??
            VcsDefaultLogoMobile,
        ),
      };
    },
  };
</script>
