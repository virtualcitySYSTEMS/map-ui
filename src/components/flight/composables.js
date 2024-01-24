import { inject, isRef, unref } from 'vue';
import VcsViewpointEditor from '../viewpoint/VcsViewpointEditor.vue';

/**
 * Unwraps the FlightInstance, if a shallowRef is provided
 * @returns {import("@vcmap/core").FlightInstance}
 */
export function getProvidedFlightInstance() {
  const injected = inject('flightInstance');
  if (isRef(injected)) {
    return unref(injected);
  }
  return injected;
}

/**
 * @param {import("../../manager/window/windowManager.js").default} windowManager
 * @param {import("vue").Ref<boolean>} disabled
 * @returns {(function(): void)}
 */
export function setupFlightAnchorEditingListener(windowManager, disabled) {
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
    anchorEditorListeners.forEach((cb) => cb());
  };
}
