import type { VcsMap } from '@vcmap/core';
import { ObliqueMap } from '@vcmap/core';
import type VcsUiApp from './vcsUiApp.js';
import { NotificationType } from './notifier/notifier.js';

function createNotification(app: VcsUiApp): void {
  app.notifier.add({
    title: 'navigation.obliqueFallback.title',
    type: NotificationType.WARNING,
    message: 'navigation.obliqueFallback.message',
  });
}

export default function createObliqueFallbackWarnings(
  app: VcsUiApp,
): () => void {
  const fallbackMapEventListener =
    app.maps.fallbackMapActivated.addEventListener(() => {
      createNotification(app);
    });

  const mapListeners = new Map<VcsMap, () => void>();
  const setMapListener = (map: ObliqueMap): void => {
    mapListeners.set(
      map,
      map.failedToSetCollection.addEventListener(() => {
        createNotification(app);
      }),
    );
  };

  (app.maps.getByType(ObliqueMap.className) as ObliqueMap[]).forEach(
    setMapListener,
  );

  const mapAddedListener = app.maps.added.addEventListener((map) => {
    if (map instanceof ObliqueMap) {
      setMapListener(map);
    }
  });

  const mapRemovedListener = app.maps.removed.addEventListener((map) => {
    mapListeners.get(map)?.();
    mapListeners.delete(map);
  });

  return () => {
    fallbackMapEventListener();
    mapAddedListener();
    mapRemovedListener();
    [...mapListeners.values()].forEach((cb) => {
      cb();
    });
    mapListeners.clear();
  };
}
