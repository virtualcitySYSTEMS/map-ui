<template>
  <v-sheet>
    <VcsFormSection heading="Tileset Layer" expandable start-open>
      <v-container class="py-0 px-1">
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="layer-select">Layer</VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              id="layer-select"
              :items="layerItems"
              v-model="selectedLayerName"
              placeholder="Select a CesiumTilesetLayer"
            />
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>

    <VcsFormSection heading="Interaction" expandable start-open>
      <v-container class="py-1 px-2">
        <v-row no-gutters class="align-center">
          <v-col>
            Click to highlight, Ctrl+Click to hide, Shift+Click to hide globally
          </v-col>
        </v-row>
        <v-row no-gutters class="mt-2">
          <v-col>
            <VcsFormButton
              :variant="interactionActive ? 'filled' : 'outlined'"
              :disabled="!selectedLayerName"
              @click="toggleInteraction"
            >
              {{
                interactionActive
                  ? 'Deactivate Interaction'
                  : 'Activate Interaction'
              }}
            </VcsFormButton>
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>

    <VcsFormSection
      v-if="highlightedIds.length > 0"
      heading="Highlighted Features"
      expandable
      start-open
      :header-actions="highlightedHeaderActions"
    >
      <VcsList :items="highlightedListItems" :show-title="false" />
    </VcsFormSection>

    <VcsFormSection
      v-if="globallyHiddenIds.length > 0"
      heading="Globally Hidden Features"
      expandable
      start-open
      :header-actions="globallyHiddenHeaderActions"
    >
      <VcsList :items="globallyHiddenListItems" :show-title="false" />
    </VcsFormSection>

    <VcsFormSection
      v-if="hiddenIds.length > 0"
      heading="Hidden Features"
      expandable
      start-open
      :header-actions="hiddenHeaderActions"
    >
      <VcsList :items="hiddenListItems" :show-title="false" />
    </VcsFormSection>
  </v-sheet>
</template>

<script>
  import { computed, inject, onUnmounted, ref, watch } from 'vue';
  import {
    CesiumTilesetLayer,
    I3SLayer,
    VectorLayer,
    VectorTileLayer,
  } from '@vcmap/core';
  import {
    VcsFormButton,
    VcsFormSection,
    VcsList,
    VcsLabel,
    VcsSelect,
  } from '@vcmap/ui';
  import { VSheet, VContainer, VRow, VCol } from 'vuetify/components';
  import { name } from '../package.json';

  export const windowId = 'tileset-feature-visibility-window';

  export default {
    name: 'TilesetFeatureVisibilityComponent',
    components: {
      VSheet,
      VContainer,
      VRow,
      VCol,
      VcsFormButton,
      VcsFormSection,
      VcsList,
      VcsLabel,
      VcsSelect,
    },
    setup() {
      /** @type {import('@vcmap/ui').VcsUiApp} */
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey(name);

      const selectedLayerName = ref(null);
      const interactionActive = ref(false);
      const highlightedIds = ref([]);
      const hiddenIds = ref([]);
      const { globallyHiddenIds } = plugin;

      let visibilityListener = null;

      function buildLayerItems() {
        return [...app.layers]
          .filter(
            (l) =>
              l instanceof CesiumTilesetLayer ||
              l instanceof I3SLayer ||
              l instanceof VectorLayer ||
              l instanceof VectorTileLayer,
          )
          .map((l) => ({ title: l.properties.title || l.name, value: l.name }));
      }

      const layerItems = ref(buildLayerItems());
      const layerListeners = [
        app.layers.added.addEventListener(() => {
          layerItems.value = buildLayerItems();
        }),
        app.layers.removed.addEventListener(() => {
          layerItems.value = buildLayerItems();
        }),
      ];

      /** @returns {import('@vcmap/core').CesiumTilesetLayer|null} */
      function getSelectedLayer() {
        if (!selectedLayerName.value) return null;
        return /** @type {import('@vcmap/core').CesiumTilesetLayer} */ (
          app.layers.getByKey(selectedLayerName.value)
        );
      }

      function syncVisibilityState() {
        const layer = getSelectedLayer();
        if (!layer) {
          highlightedIds.value = [];
          hiddenIds.value = [];
          return;
        }
        highlightedIds.value = Object.keys(
          layer.featureVisibility.highlightedObjects,
        );
        hiddenIds.value = Object.keys(layer.featureVisibility.hiddenObjects);
      }

      watch(selectedLayerName, () => {
        // Deactivate interaction when layer changes
        if (interactionActive.value) {
          plugin.deactivateInteraction();
          interactionActive.value = false;
        }

        // Remove old listener
        if (visibilityListener) {
          visibilityListener();
          visibilityListener = null;
        }

        // Set up new listener
        const layer = getSelectedLayer();
        if (layer) {
          visibilityListener = layer.featureVisibility.changed.addEventListener(
            () => {
              syncVisibilityState();
            },
          );
          syncVisibilityState();
        } else {
          highlightedIds.value = [];
          hiddenIds.value = [];
        }
      });

      function toggleInteraction() {
        if (!selectedLayerName.value) return;
        if (interactionActive.value) {
          plugin.deactivateInteraction();
          interactionActive.value = false;
        } else {
          const layer = getSelectedLayer();
          if (layer) {
            plugin.activateInteraction(layer, () => {
              // Called when the interaction is forcefully removed by another tool
              interactionActive.value = false;
            });
            interactionActive.value = true;
          }
        }
      }

      function showAllFeatures() {
        const layer = getSelectedLayer();
        if (layer) {
          layer.featureVisibility.clearHiddenObjects();
        }
      }

      function clearHighlights() {
        const layer = getSelectedLayer();
        if (layer) {
          layer.featureVisibility.clearHighlighting();
        }
      }

      function unhighlightFeature(id) {
        const layer = getSelectedLayer();
        if (layer) {
          layer.featureVisibility.unHighlight([id]);
        }
      }

      function showFeature(id) {
        const layer = getSelectedLayer();
        if (layer) {
          layer.featureVisibility.showObjects([id]);
        }
      }

      function globalShowObject(id) {
        plugin.globalShowObject(id);
      }

      function clearGloballyHidden() {
        plugin.clearGloballyHidden();
      }

      const highlightedListItems = computed(() =>
        highlightedIds.value.map((id) => ({
          name: id,
          title: id,
          actions: [
            {
              name: 'unhighlight',
              icon: 'mdi-eye-off-outline',
              tooltip: 'Unhighlight feature',
              callback: () => unhighlightFeature(id),
            },
          ],
        })),
      );

      const hiddenListItems = computed(() =>
        hiddenIds.value.map((id) => ({
          name: id,
          title: id,
          actions: [
            {
              name: 'show',
              icon: 'mdi-eye-outline',
              tooltip: 'Show feature',
              callback: () => showFeature(id),
            },
          ],
        })),
      );

      const globallyHiddenListItems = computed(() =>
        globallyHiddenIds.value.map((id) => ({
          name: id,
          title: id,
          actions: [
            {
              name: 'globalShow',
              icon: 'mdi-eye-outline',
              tooltip: 'Show feature globally',
              callback: () => globalShowObject(id),
            },
          ],
        })),
      );

      const highlightedHeaderActions = computed(() => [
        {
          name: 'clearHighlights',
          icon: 'mdi-close-circle-outline',
          tooltip: 'Clear All Highlights',
          callback: clearHighlights,
        },
      ]);

      const hiddenHeaderActions = computed(() => [
        {
          name: 'showAllHidden',
          icon: 'mdi-eye-outline',
          tooltip: 'Show All Hidden Features',
          callback: showAllFeatures,
        },
      ]);

      const globallyHiddenHeaderActions = computed(() => [
        {
          name: 'clearGloballyHidden',
          icon: 'mdi-eye-outline',
          tooltip: 'Show All Globally Hidden',
          callback: clearGloballyHidden,
        },
      ]);

      onUnmounted(() => {
        layerListeners.forEach((cb) => cb());
        if (visibilityListener) {
          visibilityListener();
          visibilityListener = null;
        }
        if (interactionActive.value) {
          plugin.deactivateInteraction();
          interactionActive.value = false;
        }
      });

      return {
        layerItems,
        selectedLayerName,
        interactionActive,
        highlightedIds,
        hiddenIds,
        globallyHiddenIds,
        toggleInteraction,
        highlightedListItems,
        hiddenListItems,
        globallyHiddenListItems,
        highlightedHeaderActions,
        hiddenHeaderActions,
        globallyHiddenHeaderActions,
      };
    },
  };
</script>
