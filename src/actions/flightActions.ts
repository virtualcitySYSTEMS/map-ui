import { reactive, ref } from 'vue';
import type { GeoJsonFeatureCollection } from '@vcmap-cesium/engine';
import { check, maybe, ofEnum } from '@vcsuite/check';
import { getLogger } from '@vcsuite/logger';
import {
  createFlightVisualization,
  createFlightMovie,
  exportFlightAsGeoJson,
  exportFlightPathAsGeoJson,
  FlightInstance,
  moduleIdSymbol,
  parseFlightOptionsFromGeoJson,
  createFlightPlayer,
  LayerState,
  getCaughtError,
} from '@vcmap/core';
import type {
  FlightPathRecorderOptions,
  FlightPlayer,
  FlightPlayerClock,
  FlightPlayerState,
  FlightVisualization,
} from '@vcmap/core';
import { NotificationType } from '../notifier/notifier.js';
import { downloadBlob, downloadText } from '../downloadHelper.js';
import type { VcsAction, DestroyableAction } from './actionHelper.js';
import { addLoadingOverlay, callSafeAction } from './actionHelper.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import type VcsUiApp from '../vcsUiApp.js';

export function createPlayAction(
  app: VcsUiApp,
  instance: FlightInstance,
): DestroyableAction {
  let stateListener = (): void => {};
  let destroyListener = (): void => {};
  let player: FlightPlayer | undefined;

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
          player.play();
        }
      }
    },
  });

  function updateAction(state: FlightPlayerState): void {
    if (state === 'stopped' || state === 'paused') {
      action.icon = '$vcsPlayCircle';
      action.title = 'flight.playTooltip';
    } else {
      action.icon = 'mdi-pause';
      action.title = 'flight.pauseTooltip';
    }
  }

  function destroyPlayer(): void {
    player = undefined;
    updateAction('stopped');
    stateListener?.();
    destroyListener?.();
  }

  function checkPlayer(_player: FlightPlayer | undefined): void {
    if (_player?.flightInstanceName === instance.name) {
      player = _player;
      updateAction(player.state);
      stateListener = player.stateChanged.addEventListener((state) => {
        updateAction(state);
      });
      destroyListener = player.destroyed.addEventListener(() => {
        destroyPlayer();
      });
    } else {
      destroyPlayer();
    }
  }
  const playerListener = app.flights.playerChanged.addEventListener(
    (_player: FlightPlayer | undefined) => {
      checkPlayer(_player);
    },
  );
  checkPlayer(app.flights.player);

  return {
    action,
    destroy: (): void => {
      playerListener();
      if (player) {
        player.stop();
        player.destroy();
        player = undefined;
      }
    },
  };
}

export enum PlayerDirection {
  Forward = 'forward',
  Backward = 'backward',
}

export function createStepAction(
  app: VcsUiApp,
  instance: FlightInstance,
  direction: PlayerDirection,
): DestroyableAction {
  check(direction, ofEnum(PlayerDirection));

  let player: FlightPlayer | undefined;
  const action = reactive({
    name: `step-${direction}`,
    icon: `mdi-step-${direction}`,
    title: `flight.${direction}StepTooltip`,
    disabled: false,
    callback(): void {
      if (player) {
        player[direction]?.();
      }
    },
  });

  const playerChangedListener = app.flights.playerChanged.addEventListener(
    (activePlayer: FlightPlayer | undefined) => {
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

export function createFastAction(
  app: VcsUiApp,
  instance: FlightInstance,
  direction: PlayerDirection,
): {
  action: VcsAction & { listeners: Record<string, () => void> };
  destroy: () => void;
} {
  check(direction, ofEnum(PlayerDirection));

  let player: FlightPlayer | undefined;
  const sign = direction === PlayerDirection.Forward ? 1 : -1;
  const icon =
    direction === PlayerDirection.Forward ? 'mdi-fast-forward' : 'mdi-rewind';
  const { multiplier } = instance;

  function accelerate(): void {
    instance.multiplier = sign * 5 * multiplier;
    player?.play();
  }

  function reset(): void {
    instance.multiplier = multiplier;
    player?.pause();
  }

  const action = reactive({
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

export function createFlightPlayerActions(
  app: VcsUiApp,
  instance: FlightInstance,
): {
  actions: Array<VcsAction & { listeners?: Record<string, () => void> }>;
  destroy: () => void;
} {
  const array = [
    createStepAction(app, instance, PlayerDirection.Backward),
    createFastAction(app, instance, PlayerDirection.Backward),
    createPlayAction(app, instance),
    createFastAction(app, instance, PlayerDirection.Forward),
    createStepAction(app, instance, PlayerDirection.Forward),
  ];

  return {
    actions: array.map(({ action }) => action),
    destroy: (): void => {
      array.forEach(({ destroy }) => {
        destroy();
      });
    },
  };
}

export function setupFlightListItemPlayer(
  app: VcsUiApp,
  instance: FlightInstance,
  actions: Array<VcsAction>,
): () => void {
  function removeAction(action: VcsAction): void {
    const index = actions.findIndex((a) => a.name === action.name);
    if (index > -1) {
      actions.splice(index, 1);
    }
  }

  let player: FlightPlayer | undefined;
  const listener: Array<() => void> = [];

  function setupListener(playAction: VcsAction, stopAction: VcsAction): void {
    listener.forEach((cb) => {
      cb();
    });
    listener.slice(0);
    listener.push(
      player!.stateChanged.addEventListener((state) => {
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
      player!.destroyed.addEventListener(() => {
        player = undefined;
        removeAction(stopAction);
        playAction.icon = 'mdi-play';
      }),
      instance.anchorsChanged.addEventListener(() => {
        playAction.disabled = !instance.isValid();
      }),
    );
  }

  const stopAction = reactive({
    name: 'stop',
    icon: 'mdi-square',
    title: 'flight.stopTooltip',
    callback: (): void => {
      player?.stop();
    },
  });

  const playAction = reactive({
    name: 'play',
    icon: 'mdi-play',
    title: 'flight.playTooltip',
    disabled: !instance.isValid(),
    callback: async (): Promise<void> => {
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
    (flightPlayer: FlightPlayer | undefined) => {
      if (!player && flightPlayer?.flightInstanceName === instance.name) {
        player = flightPlayer;
        setupListener(playAction, stopAction);
      }
    },
  );

  return () => {
    listener.forEach((cb) => {
      cb();
    });
    playerChangedListener();
    if (player) {
      player.stop();
      player.destroy();
      player = undefined;
    }
    removeAction(playAction);
  };
}

export function createZoomToFlightAction(
  app: VcsUiApp,
  instance: FlightInstance,
): DestroyableAction {
  let flightVis: FlightVisualization | undefined;

  const action = reactive({
    name: 'components.flight.zoom',
    title: 'components.flight.zoom',
    disabled: !instance.isValid(),
    async callback(): Promise<void> {
      if (!flightVis) {
        flightVis = await createFlightVisualization(instance, app);
      }
      await flightVis.zoomToExtent();
    },
  });
  const listener = instance.anchorsChanged.addEventListener(() => {
    action.disabled = !instance.isValid();
  });
  return {
    action,
    destroy: (): void => {
      listener();
      flightVis?.destroy();
    },
  };
}

export function createFlightVisualizationAction(
  app: VcsUiApp,
  instance: FlightInstance,
  active = true,
): DestroyableAction {
  let flightVis: FlightVisualization | undefined;
  let flightVisListener: (() => void) | undefined;
  let flightVisStateListener: (() => void) | undefined;

  const action = reactive({
    name: 'components.flight.hidePath',
    title: 'components.flight.hidePath',
    icon: '$vcsEye',
    active: false,
    async callback(): Promise<void> {
      if (!flightVis) {
        flightVis = await createFlightVisualization(instance, app);
        flightVisListener?.();
        flightVisListener = flightVis.destroyed.addEventListener(() => {
          flightVis = undefined;
          flightVisListener?.();
          flightVisStateListener?.();
        });
        flightVisStateListener?.();
        flightVisStateListener = flightVis.stateChanged.addEventListener(
          (state) => {
            action.active = state === LayerState.ACTIVE;
          },
        );
      }
      if (flightVis.state === LayerState.ACTIVE) {
        flightVis.deactivate();
      } else {
        flightVis.activate().catch(() => {
          getLogger('flightActions').warning('Failed to activate layer');
          this.active = false;
        });
      }
      this.active = flightVis.state === LayerState.ACTIVE;
    },
  });

  if (active) {
    callSafeAction(action);
  }

  const destroy = (): void => {
    flightVis?.deactivate?.();
    flightVis?.destroy?.();
  };

  return { action, destroy };
}

export function createFlightMovieActions(
  app: VcsUiApp,
  instance: FlightInstance,
): { actions: VcsAction[]; destroy: () => void } {
  const progress = ref(0);

  function updateProgress(playerClock: FlightPlayerClock): void {
    const duration = playerClock.endTime - playerClock.startTime;
    const currentTime = playerClock.currentTime - playerClock.startTime;
    progress.value = currentTime / duration;
  }

  async function recordFlight(
    options: FlightPathRecorderOptions = {},
  ): Promise<void> {
    let player: FlightPlayer | undefined;
    let flightVis: FlightVisualization | undefined;
    let playerListener = (): void => {};
    let removeLoadingOverlay = (): void => {};
    try {
      flightVis = await createFlightVisualization(instance, app);
      if (flightVis.state === LayerState.ACTIVE) {
        flightVis.deactivate();
      }
      player = await createFlightPlayer(instance, app);
      playerListener = player.clock.changed.addEventListener(updateProgress);
      const { start, cancel } = createFlightMovie(app, player, options);
      removeLoadingOverlay = addLoadingOverlay(app, vcsAppSymbol, {
        progress,
        title: 'components.flight.record.inProgress',
        cancel,
      });
      const blob = await start();
      removeLoadingOverlay?.();
      app.notifier.add({
        type: NotificationType.SUCCESS,
        message: app.vueI18n.t('components.flight.record.success'),
      });
      const title = (instance.properties?.title as string) || 'flight';
      downloadBlob(blob, `${title}.webm`);
    } catch (e) {
      getLogger('flightActions').error('Error while creating flight movie', e);
    } finally {
      player?.destroy();
      flightVis?.destroy();
      playerListener?.();
      removeLoadingOverlay?.();
    }
  }

  const actions: VcsAction[] = [
    reactive({
      name: 'components.flight.record.standard',
      callback: (): Promise<void> => recordFlight(),
    }),
    reactive({
      name: 'components.flight.record.high',
      callback: (): Promise<void> =>
        recordFlight({
          fps: 60,
          highDefinition: true,
        }),
    }),
  ];

  const destroy = instance.anchorsChanged.addEventListener(() => {
    actions.forEach((action) => {
      action.disabled = !instance.isValid();
    });
  });

  return { actions, destroy };
}

/**
 * @param isPathExport - Set to true to export flight path. Per default flight is exported
 */
export function createExportFlightAction(
  instance: FlightInstance,
  isPathExport = false,
): DestroyableAction {
  const exportFunction = (i: FlightInstance): GeoJsonFeatureCollection =>
    isPathExport ? exportFlightPathAsGeoJson(i) : exportFlightAsGeoJson(i);

  const name = isPathExport
    ? 'components.flight.exportPath'
    : 'components.flight.export';

  const action = reactive({
    name,
    title: name,
    disabled: !instance.isValid(),
    callback() {
      const text = JSON.stringify(exportFunction(instance), null, 2);
      downloadText(
        text,
        `${(instance.properties.title as string) ?? instance.name}${
          isPathExport ? '-path' : ''
        }.json`,
      );
    },
  });

  const destroy = instance.anchorsChanged.addEventListener((): void => {
    action.disabled = !instance.isValid();
  });

  return { action, destroy };
}

/**
 * @param importSuccessCb - An optional success cb providing the indices of app's flight collection for successful imported flight instances
 */
export async function importFlights(
  app: VcsUiApp,
  files: File[],
  moduleId?: string,
  importSuccessCb?: (imported: number[]) => void,
): Promise<boolean> {
  check(moduleId, maybe(String));
  check(importSuccessCb, maybe(Function));

  const { vueI18n } = app;
  const results = await Promise.all(
    files.map(async (file) => {
      const text = await file.text();
      try {
        return parseFlightOptionsFromGeoJson(JSON.parse(text));
      } catch (e: unknown) {
        getLogger().error(getCaughtError(e).message);
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
      if (options) {
        const instance = new FlightInstance(options);
        if (!instance.isValid()) {
          return null;
        }
        if (moduleId) {
          instance[moduleIdSymbol] = moduleId;
        }
        return app.flights.add(instance);
      }
      return null;
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
