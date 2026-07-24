import type { FlightInstance } from '@vcmap/core';
import type { Ref } from 'vue';
import { inject, isRef, unref } from 'vue';
import VcsViewpointEditor from '../viewpoint/VcsViewpointEditor.ts.vue';
import type WindowManager from '../../manager/window/windowManager.js';

/**
 * Unwraps the FlightInstance, if a shallowRef is provided
 * @returns {import("@vcmap/core").FlightInstance}
 */
export function getProvidedFlightInstance(): FlightInstance {
  const injected = inject('flightInstance') as
    | FlightInstance
    | Ref<FlightInstance>;
  if (isRef(injected)) {
    return unref(injected);
  }
  return injected;
}

export function setupFlightAnchorEditingListener(
  windowManager: WindowManager,
  disabled: Ref<boolean>,
): () => void {
  const editingAnchors = new Set();
  const anchorEditorListeners = [
    windowManager.added.addEventListener((added) => {
      if (added.component === VcsViewpointEditor) {
        editingAnchors.add(added.id);
      }
    }),
    windowManager.removed.addEventListener((removed) => {
      if (editingAnchors.has(removed.id)) {
        editingAnchors.delete(removed.id);
      }
      disabled.value = editingAnchors.size > 0;
    }),
  ];
  return () => {
    anchorEditorListeners.forEach((cb) => {
      cb();
    });
  };
}
