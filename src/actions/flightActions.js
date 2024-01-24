import { reactive } from 'vue';
import { check } from '@vcsuite/check';
import { createFlightVisualization } from '@vcmap/core';

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
 *
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").FlightInstance} flightInstance
 * @param {boolean} [active=true]
 * @returns {Promise<{action: import("./actionHelper.js").VcsAction, destroy:()=>void}>}
 */
export async function createFlightVisualizationAction(
  app,
  flightInstance,
  active = true,
) {
  let flightVis = await createFlightVisualization(flightInstance, app);

  const action = reactive({
    name: 'components.flight.hidePath',
    title: 'components.flight.hidePath',
    icon: 'mdi-eye-outline',
    active,
    async callback() {
      if (!flightVis) {
        flightVis = await createFlightVisualization(flightInstance, app);
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
