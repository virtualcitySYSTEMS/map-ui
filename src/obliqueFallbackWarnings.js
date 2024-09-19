import { ObliqueMap } from '@vcmap/core';
import { NotificationType } from './notifier/notifier.js';

function createNotification(app) {
  app.notifier.add({
    title: 'navigation.obliqueFallback.title',
    type: NotificationType.WARNING,
    message: 'navigation.obliqueFallback.message',
  });
}

/**
 * @param {import("./vcsUiApp.js").default} app
 * @returns {() => void}
 */
export default function createObliqueFallbackWarnings(app) {
  const fallbackMapEventListener =
    app.maps.fallbackMapActivated.addEventListener(() => {
      createNotification(app);
    });

  const mapListeners = new Map();
  const setMapListener = (map) => {
    mapListeners.set(
      map,
      map.failedToSetCollection.addEventListener(() => {
        createNotification(app);
      }),
    );
  };

  app.maps.getByType(ObliqueMap.className).forEach(setMapListener);

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
