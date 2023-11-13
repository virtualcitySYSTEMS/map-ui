import { CesiumMap, createFlightPlayer } from '@vcmap/core';
import VcsObjectContentTreeItem from './vcsObjectContentTreeItem.js';
import { contentTreeClassRegistry } from './contentTreeItem.js';
import { executeCallbacks } from '../callback/vcsCallback.js';

/**
 * @typedef {ContentTreeItemOptions} FlightContentTreeItemOptions
 * @property {string} flightName
 */

/**
 * A flight item. Allows for playing a flight from the content tree.
 * Callbacks for onActivate are called on play, when playing from a paused state and onDeactivate are called
 * on stop. Pausing and continueing a flight does not trigger any callbacks.
 * @class
 * @extends {VcsObjectContentTreeItem}
 */
class FlightContentTreeItem extends VcsObjectContentTreeItem {
  /**
   * @returns {string}
   */
  static get className() {
    return 'FlightContentTreeItem';
  }

  /**
   * @param {FlightContentTreeItemOptions} options
   * @param {VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);

    /**
     * @type {string}
     * @private
     */
    this._flightName = options.flightName;

    /**
     * @type {Array<Function>}
     * @private
     */
    this._listeners = [];

    this._setup();
  }

  /**
   * @type {import("@vcmap/core").FlightInstance}
   * @private
   */
  get _flight() {
    return this._app.flights.getByKey(this._flightName);
  }

  /**
   * @private
   */
  _clearListeners() {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }

  /**
   * @private
   */
  _setupPlayer() {
    let stateListener = () => {};
    let destroyListener = () => {};
    /** @type {import("@vcmap/core").FlightPlayer} */
    let player;

    const stopAction = {
      name: 'stop',
      icon: 'mdi-square',
      title: 'flight.stopTooltip',
      callback: () => {
        player?.stop();
      },
    };

    const playAction = {
      name: 'play',
      icon: 'mdi-play',
      title: 'flight.playTooltip',
      callback: async () => {
        if (player) {
          if (player.state === 'playing') {
            player.pause();
          } else {
            player.play();
          }
        } else {
          player = await createFlightPlayer(this._flight, this._app);
          stateListener = player.stateChanged.addEventListener((state) => {
            if (state === 'stopped') {
              this.removeAction(stopAction.name);
              playAction.icon = 'mdi-play';
              playAction.title = 'flight.playTooltip';
              executeCallbacks(this._app, this._onDeactivate);
            } else {
              if (!this.actions.includes(stopAction)) {
                this.addAction(stopAction);
              }
              if (state === 'paused') {
                playAction.icon = 'mdi-play';
                playAction.title = 'flight.playTooltip';
              } else {
                playAction.icon = 'mdi-pause';
                playAction.title = 'flight.pauseTooltip';
              }
            }
          });
          destroyListener = player.destroyed.addEventListener(() => {
            player = null;
            this.removeAction(stopAction.name);
            playAction.icon = 'mdi-play';
          });
          player.play();
          executeCallbacks(this._app, this._onActivate);
        }
      },
    };

    this.addAction(playAction, 12);

    this._listeners.push(() => {
      stateListener();
      destroyListener();
      if (player) {
        player.stop();
        player.destroy();
        player = null;
      }
      this.removeAction(playAction.name);
    });
  }

  /**
   * @private
   */
  _setup() {
    this._clearListeners();
    /**
     * Called when a flight is added or removed to reset the item if needed
     * @param {import("@vcmap/core").FlightInstance} flight
     */
    const resetHandler = (flight) => {
      if (flight.name === this._flightName) {
        this._setup();
      }
    };

    if (!this._flight) {
      this.visible = false;
      this._listeners.push(
        this._app.flights.added.addEventListener(resetHandler),
      );
    } else {
      this.visible = this._app.maps.activeMap instanceof CesiumMap;
      this._setupPlayer();

      this._listeners.push(
        this._app.flights.removed.addEventListener(resetHandler),
      );
      this._listeners.push(
        this._app.flights.added.addEventListener(resetHandler),
      );

      this._listeners.push(
        this._app.maps.mapActivated.addEventListener(() => {
          this.visible = this._app.maps.activeMap instanceof CesiumMap;
        }),
      );
    }
  }

  /**
   * @returns {FlightContentTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.flightName = this._flightName;
    return config;
  }

  destroy() {
    super.destroy();
    this._clearListeners();
  }
}

export default FlightContentTreeItem;
contentTreeClassRegistry.registerClass(
  FlightContentTreeItem.className,
  FlightContentTreeItem,
);
