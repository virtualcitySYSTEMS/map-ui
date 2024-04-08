<template>
  <div class="pa-1">
    <VcsToolButton
      v-for="(location, index) in panelLocations"
      :key="`b-${index}`"
      :active="isActive(location).value"
      @click="(e) => toggle(e, location)"
      class="pa-1"
    >
      toggle {{ location }}
    </VcsToolButton>
    <v-divider />
    <VcsToolButton class="pa-1" @click="switchLR"
      >switch LEFT-RIGHT
    </VcsToolButton>
    <VcsToolButton class="pa-1" @click="toggleResizable"
      >toggle resizable
    </VcsToolButton>
  </div>
</template>
<style></style>
<script>
  import { computed, inject, ref } from 'vue';
  import { VDivider } from 'vuetify/lib';
  import { VcsToolButton, PanelLocation } from '@vcmap/ui';
  import { name as owner } from '../package.json';
  import IframePanelExample from './IframePanelExample.vue';
  import TextPanelExample from './TextPanelExample.vue';
  import ImgPanelExample from './ImgPanelExample.vue';

  export default {
    name: 'PanelExample',
    components: { VcsToolButton, VDivider },
    setup() {
      const app = inject('vcsApp');
      const panelLocations = Object.values(PanelLocation);
      const componentIds = ref(app.panelManager.componentIds);

      const sampleIds = {
        [PanelLocation.LEFT]: 'panel-1',
        [PanelLocation.RIGHT]: 'panel-2',
        [PanelLocation.BOTTOM]: 'panel-3',
      };

      const sampleComponent = {
        [PanelLocation.LEFT]: IframePanelExample,
        [PanelLocation.RIGHT]: TextPanelExample,
        [PanelLocation.BOTTOM]: ImgPanelExample,
      };

      const sampleClasses = {
        [PanelLocation.LEFT]: {
          green: true,
        },
        [PanelLocation.RIGHT]: {
          red: true,
        },
      };

      const sampleStyles = {
        [PanelLocation.BOTTOM]: {
          backgroundColor: '#2196f3',
        },
      };

      const panelComponentOptions = (location) => ({
        id: sampleIds[location],
        component: sampleComponent[location],
        state: {
          classes: sampleClasses[location],
          styles: sampleStyles[location],
        },
      });

      return {
        toggle(e, location) {
          if (app.panelManager.hasLocation(location)) {
            app.panelManager.removePanelAtLocation(location);
          } else {
            e.stopPropagation();
            app.panelManager.add(
              { ...panelComponentOptions(location) },
              owner,
              location,
            );
          }
        },
        switchLR() {
          const l = app.panelManager.getLocation(PanelLocation.LEFT);
          const r = app.panelManager.getLocation(PanelLocation.RIGHT);
          app.panelManager.removePanelAtLocation(PanelLocation.LEFT);
          app.panelManager.removePanelAtLocation(PanelLocation.RIGHT);
          if (l) {
            const { id, component, state } = l;
            app.panelManager.add(
              { id, component, state },
              owner,
              PanelLocation.RIGHT,
            );
          }
          if (r) {
            const { id, component, state } = r;
            app.panelManager.add(
              { id, component, state },
              owner,
              PanelLocation.LEFT,
            );
          }
        },
        toggleResizable() {
          app.panelManager.componentIds.forEach((id) => {
            Object.assign(app.panelManager.get(id).state, {
              resizable: !app.panelManager.get(id).state.resizable,
            });
          });
        },
        panelLocations,
        isActive(location) {
          return computed(() =>
            componentIds.value.includes(
              app.panelManager.getLocation(location)?.id,
            ),
          );
        },
      };
    },
  };
</script>
