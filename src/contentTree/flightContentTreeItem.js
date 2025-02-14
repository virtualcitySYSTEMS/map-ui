import { CesiumMap } from '@vcmap/core';
import { parseBoolean } from '@vcsuite/parsers';
import { reactive } from 'vue';
import VcsObjectContentTreeItem from './vcsObjectContentTreeItem.js';
import { contentTreeClassRegistry } from './contentTreeItem.js';
import { executeCallbacks } from '../callback/vcsCallback.js';

/**
 * @typedef {import("./contentTreeItem.js").ContentTreeItemOptions & { flightName: string, showWhenNotSupported?: boolean }} FlightContentTreeItemOptions
 * @property {boolean} [showWhenNotSupported=false] - optional flag to show the item even if it is not supported by the activeMap.
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
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);

    /**
     * @type {string}
     * @private
     */
    this._flightName = options.flightName;

    /**
     * @type {boolean}
     * @private
     */
    this._showWhenNotSupported = parseBoolean(
      options.showWhenNotSupported,
      false,
    );

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
    /** @type {import("@vcmap/core").FlightPlayer|undefined} */
    let player;

    const stopAction = reactive({
      name: 'stop',
      icon: 'mdi-square',
      title: 'flight.stopTooltip',
      callback: () => {
        player?.stop();
      },
    });

    const playAction = reactive({
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
          player = await this._app.flights.setPlayerForFlight(this._flight);
          if (player) {
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
              stateListener();
              destroyListener();
            });
            player.play();
            executeCallbacks(this._app, this._onActivate);
          }
        }
      },
    });

    this.addAction(playAction, 12);

    this._listeners.push(() => {
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
      let isCesium = this._app.maps.activeMap instanceof CesiumMap;
      this.visible = isCesium || this.showWhenNotSupported;
      this.disabled = !isCesium && this.showWhenNotSupported;
      this._setupPlayer();
      this.setPropertiesFromObject(this._flight);

      this._listeners.push(
        this._app.flights.removed.addEventListener(resetHandler),
      );
      this._listeners.push(
        this._app.flights.added.addEventListener(resetHandler),
      );

      this._listeners.push(
        this._app.maps.mapActivated.addEventListener(() => {
          isCesium = this._app.maps.activeMap instanceof CesiumMap;
          this.visible = isCesium || this.showWhenNotSupported;
          this.disabled = !isCesium && this.showWhenNotSupported;
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
    if (this._showWhenNotSupported) {
      config.showWhenNotSupported = this._showWhenNotSupported;
    }
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
