import { ref } from 'vue';
import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import { name, version, mapVersion } from '../package.json';
import TilesetFeatureVisibilityComponent, {
  windowId,
} from './TilesetFeatureVisibilityComponent.vue';
import TilesetFeatureVisibilityInteraction from './TilesetFeatureVisibilityInteraction.js';

export default function tilesetFeatureVisibilityPlugin() {
  /** @type {(() => number)|null} */
  let removeInteraction = null;
  /** @type {TilesetFeatureVisibilityInteraction|null} */
  let interaction = null;
  /** @type {import('@vcmap/ui').VcsUiApp|null} */
  let vcsApp = null;
  /** @type {import('vue').Ref<string[]>} */
  const globallyHiddenIds = ref([]);

  return {
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    get mapVersion() {
      return mapVersion;
    },

    /**
     * Activate the tileset feature visibility interaction for the given layer.
     * @param {import('@vcmap/core').CesiumTilesetLayer} layer
     * @param {function():void} [onRemoved] - called if the interaction is forcefully removed
     */
    activateInteraction(layer, onRemoved) {
      if (removeInteraction) {
        removeInteraction();
        removeInteraction = null;
      }
      interaction = new TilesetFeatureVisibilityInteraction(layer, (id) => {
        vcsApp.layers.globalHider.hideObjects([id]);
        if (!globallyHiddenIds.value.includes(id)) {
          globallyHiddenIds.value = [...globallyHiddenIds.value, id];
        }
      });
      removeInteraction = vcsApp.maps.eventHandler.addExclusiveInteraction(
        interaction,
        () => {
          interaction = null;
          removeInteraction = null;
          onRemoved?.();
        },
        undefined,
        name,
      );
    },

    /**
     * Deactivate the tileset feature visibility interaction.
     */
    deactivateInteraction() {
      if (removeInteraction) {
        removeInteraction();
        removeInteraction = null;
      }
      interaction = null;
    },

    /**
     * Show a feature that was globally hidden by this plugin.
     * @param {string} id
     */
    globalShowObject(id) {
      vcsApp.layers.globalHider.showObjects([id]);
      globallyHiddenIds.value = globallyHiddenIds.value.filter((i) => i !== id);
    },

    /**
     * Show all features that were globally hidden by this plugin.
     */
    clearGloballyHidden() {
      const ids = [...globallyHiddenIds.value];
      vcsApp.layers.globalHider.showObjects(ids);
      globallyHiddenIds.value = [];
    },

    /**
     * Reactive ref of feature ids globally hidden by this plugin.
     * @type {import('vue').Ref<string[]>}
     */
    get globallyHiddenIds() {
      return globallyHiddenIds;
    },

    /**
     * @param {import('@vcmap/ui').VcsUiApp} app
     */
    initialize(app) {
      vcsApp = app;

      const { action, destroy } = createToggleAction(
        {
          name: 'Tileset Feature Visibility',
          title: 'Tileset Feature Visibility',
          icon: 'mdi-layers-search',
        },
        {
          id: windowId,
          state: {
            headerTitle: 'Tileset Feature Visibility',
            headerIcon: 'mdi-layers-search',
          },
          component: TilesetFeatureVisibilityComponent,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        app.windowManager,
        name,
      );

      app.navbarManager.add(
        { id: 'tileset-feature-visibility', action },
        name,
        ButtonLocation.TOOL,
      );

      this._destroy = destroy;
    },

    destroy() {
      this.deactivateInteraction();
      this.clearGloballyHidden();
      this._destroy?.();
    },
  };
}
