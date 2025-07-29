import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import { name, version, mapVersion } from '../package.json';
import PanoramaInspector from './PanoramaInspector.vue';
import ShowClickInteraction from './showClickInteraction.js';

export default function panoramaInspector() {
  let destroy;
  let clickedInteraction;
  let removeInteraction;
  let clickedPrimitive;

  return {
    name,
    version,
    mapVersion,
    get clickedInteraction() {
      return clickedInteraction;
    },
    get clickedPrimitive() {
      return clickedPrimitive;
    },
    async initialize(app) {
      const { action, destroy: destroyAction } = createToggleAction(
        {
          name: 'Panorama Inspector',
        },
        {
          id: 'panorama-inspector',
          state: {
            headerTitle: 'panoramaInspector.title',
          },
          component: PanoramaInspector,
          slot: WindowSlot.DYNAMIC_RIGHT,
        },
        app.windowManager,
        name,
      );
      app.navbarManager.add(
        { id: 'panorama-inspector', action },
        name,
        ButtonLocation.MENU,
      );
      clickedInteraction = new ShowClickInteraction();
      removeInteraction =
        app.maps.eventHandler.addPersistentInteraction(clickedInteraction);
      destroy = destroyAction;
    },
    destroy() {
      destroy?.();
      removeInteraction?.();
      clickedInteraction?.destroy();
      clickedInteraction = undefined;
      clickedPrimitive?.destroy();
      clickedPrimitive = undefined;
    },
  };
}
