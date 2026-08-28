<template>
  <div v-if="mapActions.length > 0" class="maps-group-mobile-menu">
    <v-menu v-model="open" location="center" z-index="99">
      <template #activator="{ props }">
        <VcsToolButton
          class="vcs-toolbox-toggle-button pl-4"
          width="50"
          :icon="activeIcon"
          v-bind="props"
        >
          <v-icon>{{ open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </VcsToolButton>
      </template>

      <v-toolbar
        class="vcs-toolbox-toolbar--secondary mx-auto bottom-align rounded-t elevation-4 opacity-80 px-1"
        :height="toolboxHeight"
      >
        <v-toolbar-items class="w-100">
          <div class="d-flex align-center justify-space-between gc-1 w-100">
            <VcsToolButton
              v-for="action in mapActions"
              :key="action.name"
              :tooltip="action.title"
              :icon="action.icon"
              :disabled="action.disabled"
              :active="action.active"
              @click.stop="
                (e: PointerEvent) => {
                  $emit('click', e);
                  open = false;
                  action.callback(e);
                }
              "
              v-bind="{ ...$attrs }"
            />
          </div>
        </v-toolbar-items>
      </v-toolbar>
    </v-menu>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, inject, ref } from 'vue';
  import { VMenu, VIcon, VToolbar, VToolbarItems } from 'vuetify/components';
  import type VcsUiApp from '../vcsUiApp.js';
  import VcsToolButton from '../components/buttons/VcsToolButton.ts.vue';
  import { useFontSize } from '../vuePlugins/vuetify.js';
  import {
    ButtonLocation,
    getActionsByLocation,
  } from '../manager/navbarManager.js';

  export default defineComponent({
    name: 'MapsGroupMobileMenu',
    components: {
      VcsToolButton,
      VMenu,
      VIcon,
      VToolbar,
      VToolbarItems,
    },
    emits: ['click'],
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const open = ref(false);

      const mobileButtonComponents = computed(() =>
        app.navbarManager.getAllForDevice('mobile'),
      );

      const mapActions = computed(() =>
        getActionsByLocation(
          mobileButtonComponents.value,
          ButtonLocation.MAP,
          [...app.plugins].map((p) => p.name),
        ),
      );

      const activeIcon = computed(
        () => mapActions.value.find((a) => a.active)?.icon,
      );

      const fontSize = useFontSize();
      const toolboxHeight = computed(() => fontSize.value * 3 + 5);

      return {
        open,
        activeIcon,
        toolboxHeight,
        mapActions,
      };
    },
  });
</script>

<style lang="scss" scoped>
  .bottom-align {
    bottom: calc(var(--v-vcs-font-size) * 3 - 2px) !important;
  }
</style>
