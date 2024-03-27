import { reactive } from 'vue';
import { check, checkMaybe } from '@vcsuite/check';
import {
  createFlightVisualization,
  exportFlightAsGeoJson,
  exportFlightPathAsGeoJson,
  FlightInstance,
  moduleIdSymbol,
  parseFlightOptionsFromGeoJson,
} from '@vcmap/core';
import { NotificationType } from '../notifier/notifier.js';
import { downloadText } from '../downloadHelper.js';

/**
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").FlightInstance} instance
 * @returns {{action: import("./actionHelper.js").VcsAction, destroy: () => void}}
 */
export function createPlayAction(app, instance) {
  let stateListener = () => {};
  let destroyListener = () => {};
  /** @type {import("@vcmap/core").FlightPlayer|undefined} */
  let player;

  const action = reactive({
    name: 'play',
    icon: '$vcsPlayCircle',
    title: 'flight.playTooltip',
    callback: async () => {
      if (player) {
        if (player.state === 'playing') {
          player.pause();
        } else {
          player.play();
        }
      } else {
        player = await app.flights.setPlayerForFlight(instance);
        if (player) {
          stateListener = player.stateChanged.addEventListener((state) => {
            if (state === 'stopped') {
              action.icon = '$vcsPlayCircle';
              action.title = 'flight.playTooltip';
            } else if (state === 'paused') {
              action.icon = '$vcsPlayCircle';
              action.title = 'flight.playTooltip';
            } else {
              action.icon = 'mdi-pause';
              action.title = 'flight.pauseTooltip';
            }
          });
          destroyListener = player.destroyed.addEventListener(() => {
            player = null;
            action.icon = '$vcsPlayCircle';
            stateListener();
            destroyListener();
          });
          player.play();
        }
      }
    },
  });

  return {
    action,
    destroy: () => {
      if (player) {
        player.stop();
        player.destroy();
        player = null;
      }
    },
  };
}

/**
 * @enum {string}
 */
export const PlayerDirection = {
  Forward: 'forward',
  Backward: 'backward',
};

/**
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").FlightInstance} instance
 * @param {PlayerDirection} direction
 * @returns {{action: import("./actionHelper.js").VcsAction, destroy: () => void}}
 */
export function createStepAction(app, instance, direction) {
  check(direction, Object.values(PlayerDirection));

  let player;
  const action = reactive({
    name: `step-${direction}`,
    icon: `mdi-step-${direction}`,
    title: `flight.${direction}StepTooltip`,
    disabled: false,
    async callback() {
      if (player) {
        player[direction]?.();
      }
    },
  });

  const playerChangedListener = app.flights.playerChanged.addEventListener(
    (activePlayer) => {
      if (activePlayer?.flightInstanceName === instance.name) {
        player = activePlayer;
        action.disabled = false;
      } else {
        action.disabled = true;
      }
    },
  );

  return { action, destroy: playerChangedListener };
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").FlightInstance} instance
 * @param {PlayerDirection} direction
 * @returns {{ action: import("./actionHelper.js").VcsAction & { listeners:Object<string,()=>void>, destroy: () => void }}}
 */
export function createFastAction(app, instance, direction) {
  check(direction, Object.values(PlayerDirection));

  let player;
  const sign = direction === PlayerDirection.Forward ? 1 : -1;
  const icon =
    direction === PlayerDirection.Forward ? 'mdi-fast-forward' : 'mdi-rewind';
  const { multiplier } = instance;

  function accelerate() {
    instance.multiplier = sign * 5 * multiplier;
    player?.play();
  }

  function reset() {
    instance.multiplier = multiplier;
    player?.pause();
  }

  const action = {
    name: `fast-${direction}`,
    icon,
    title: `flight.${direction}FastTooltip`,
    disabled: false,
    callback() {},
    listeners: {
      mousedown: accelerate,
      pointerdown: accelerate,
      mouseup: reset,
      pointerup: reset,
      mouseout() {
        if (instance.multiplier !== multiplier) {
          reset();
        }
      },
    },
  };

  const playerChangedListener = app.flights.playerChanged.addEventListener(
    (activePlayer) => {
      if (activePlayer?.flightInstanceName === instance.name) {
        player = activePlayer;
        action.disabled = false;
      } else {
        action.disabled = true;
      }
    },
  );

  return { action, destroy: playerChangedListener };
}

/**
 *
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").FlightInstance} instance
 * @returns {{destroy: (() => void), actions: Array<import("./actionHelper.js").VcsAction> }}
 */
export function createFlightPlayerActions(app, instance) {
  const array = [
    createStepAction(app, instance, PlayerDirection.Backward),
    createFastAction(app, instance, PlayerDirection.Backward),
    createPlayAction(app, instance),
    createFastAction(app, instance, PlayerDirection.Forward),
    createStepAction(app, instance, PlayerDirection.Forward),
  ];

  return {
    actions: array.map(({ action }) => action),
    destroy: () => array.forEach(({ destroy }) => destroy()),
  };
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").FlightInstance} instance
 * @param {Array<import("./actionHelper.js").VcsAction>} actions
 * @returns {(function(): void)}
 */
export function setupFlightListItemPlayer(app, instance, actions) {
  function removeAction(action) {
    const index = actions.findIndex((a) => a.name === action.name);
    if (index > -1) {
      actions.splice(index, 1);
    }
  }

  let player;
  const listener = [];

  function setupListener(playAction, stopAction) {
    listener.forEach((cb) => cb());
    listener.slice(0);
    listener.push(
      player.stateChanged.addEventListener((state) => {
        if (state === 'stopped') {
          removeAction(stopAction);
          playAction.icon = 'mdi-play';
          playAction.title = 'flight.playTooltip';
        } else {
          if (!actions.includes(stopAction)) {
            actions.push(stopAction);
          }
          if (state === 'paused') {
            playAction.icon = 'mdi-play';
            playAction.title = 'flight.playTooltip';
          } else {
            playAction.icon = 'mdi-pause';
            playAction.title = 'flight.pauseTooltip';
          }
        }
      }),
      player.destroyed.addEventListener(() => {
        player = undefined;
        removeAction(stopAction);
        playAction.icon = 'mdi-play';
      }),
      instance.anchorsChanged.addEventListener(() => {
        playAction.disabled = !instance.isValid();
      }),
    );
  }

  const stopAction = {
    name: 'stop',
    icon: 'mdi-square',
    title: 'flight.stopTooltip',
    callback: () => {
      player?.stop();
    },
  };

  const playAction = reactive({
    name: 'play',
    icon: 'mdi-play',
    title: 'flight.playTooltip',
    disabled: !instance.isValid(),
    callback: async () => {
      if (player) {
        if (player.state === 'playing') {
          player.pause();
        } else {
          player.play();
        }
      } else {
        player = await app.flights.setPlayerForFlight(instance);
        setupListener(playAction, stopAction);
        player?.play();
      }
    },
  });

  if (!actions.includes(playAction)) {
    actions.push(playAction);
  }

  const playerChangedListener = app.flights.playerChanged.addEventListener(
    (flightPlayer) => {
      if (!player && flightPlayer?.flightInstanceName === instance.name) {
        player = flightPlayer;
        setupListener(playAction, stopAction);
      }
    },
  );

  return () => {
    listener.forEach((cb) => cb());
    playerChangedListener();
    if (player) {
      player.stop();
      player.destroy();
      player = undefined;
    }
    removeAction(playAction);
  };
}

/**
 *
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").FlightInstance} instance
 * @returns {{action: import("./actionHelper.js").VcsAction, destroy: function(): void}}
 */
export function createZoomToFlightAction(app, instance) {
  let flightVis;

  const action = {
    name: 'components.flight.zoom',
    title: 'components.flight.zoom',
    disabled: !instance.isValid(),
    async callback() {
      if (!flightVis) {
        flightVis = await createFlightVisualization(instance, app);
      }
      await flightVis.zoomToExtent();
    },
  };
  const listener = instance.anchorsChanged.addEventListener(() => {
    action.disabled = !instance.isValid();
  });
  return {
    action,
    destroy: () => {
      listener();
      flightVis.destroy();
    },
  };
}

/**
 *
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").FlightInstance} instance
 * @param {boolean} [active=true]
 * @returns {Promise<{action: import("./actionHelper.js").VcsAction, destroy:()=>void}>}
 */
export async function createFlightVisualizationAction(
  app,
  instance,
  active = true,
) {
  let flightVis = await createFlightVisualization(instance, app);

  const action = reactive({
    name: 'components.flight.hidePath',
    title: 'components.flight.hidePath',
    icon: 'mdi-eye-outline',
    active,
    async callback() {
      if (!flightVis) {
        flightVis = await createFlightVisualization(instance, app);
      }
      if (this.active) {
        flightVis.deactivate();
      } else {
        await flightVis.activate();
      }
      this.active = !this.active;
      this.icon = this.active ? 'mdi-eye-outline' : 'mdi-eye-off-outline';
    },
  });

  if (active) {
    await flightVis.activate();
  }

  const destroy = () => {
    flightVis.deactivate();
    flightVis.destroy();
  };

  return { action, destroy };
}

/**
 *
 * @param {import("@vcmap/core").FlightInstance} instance
 * @param {boolean} [isPathExport=false] - Set to true to export flight path. Per default flight is exported
 * @returns {{action: import("./actionHelper.js").VcsAction, destroy: function(): void}}
 */
export function createExportFlightAction(instance, isPathExport = false) {
  const exportFunction = (i) =>
    isPathExport ? exportFlightPathAsGeoJson(i) : exportFlightAsGeoJson(i);

  const name = isPathExport
    ? 'components.flight.exportPath'
    : 'components.flight.export';

  const action = {
    name,
    title: name,
    disabled: !instance.isValid(),
    callback() {
      const text = JSON.stringify(exportFunction(instance), null, 2);
      downloadText(
        text,
        `${instance.properties.title ?? instance.name}${
          isPathExport ? '-path' : ''
        }.json`,
      );
    },
  };

  const destroy = instance.anchorsChanged.addEventListener(() => {
    action.disabled = !instance.isValid();
  });

  return { action, destroy };
}

/**
 *
 * @param {import("../vcsUiApp.js").default} app
 * @param {File[]} files
 * @param {string} [moduleId]
 * @param {(imported:number[]) => void} [importSuccessCb] - An optional success cb providing the indices of app's flight collection for successful imported flight instances
 * @returns {Promise<boolean>}
 */
export async function importFlights(app, files, moduleId, importSuccessCb) {
  checkMaybe(moduleId, String);
  checkMaybe(importSuccessCb, Function);

  const { vueI18n } = app;
  const results = await Promise.all(
    files.map(async (file) => {
      const text = await file.text();
      try {
        return parseFlightOptionsFromGeoJson(JSON.parse(text));
      } catch (e) {
        app.notifier.add({
          type: NotificationType.ERROR,
          message: vueI18n.t('components.import.failure', {
            fileName: file.name,
          }),
        });
      }
      return undefined;
    }),
  );

  const flightsToImport = results.filter((f) => f).flat();

  const imported = flightsToImport
    .map((options) => {
      const instance = new FlightInstance(options);
      if (!instance.isValid()) {
        return null;
      }
      if (moduleId) {
        instance[moduleIdSymbol] = moduleId;
      }
      return app.flights.add(instance);
    })
    .filter((id) => id != null);
  const importedDelta = flightsToImport.length - imported.length;
  if (importedDelta > 0) {
    app.notifier.add({
      type: NotificationType.WARNING,
      message: vueI18n.t('components.import.addFailure', [importedDelta]),
    });
    return false;
  }
  if (imported.length > 0) {
    if (importSuccessCb) {
      importSuccessCb(imported);
    }
    app.notifier.add({
      type: NotificationType.SUCCESS,
      message: vueI18n.t('components.import.featuresAdded', [imported.length]),
    });
  } else {
    app.notifier.add({
      type: NotificationType.ERROR,
      message: vueI18n.t('components.import.nothingAdded'),
    });
    return false;
  }
  return true;
}
