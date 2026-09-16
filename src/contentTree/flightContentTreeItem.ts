import { CesiumMap, type FlightInstance, type FlightPlayer } from '@vcmap/core';
import { parseBoolean } from '@vcsuite/parsers';
import { reactive } from 'vue';
import type VcsUiApp from '../vcsUiApp.js';
import VcsObjectContentTreeItem from './vcsObjectContentTreeItem.js';
import {
  type ContentTreeItemOptions,
  contentTreeClassRegistry,
} from './contentTreeItem.js';
import { executeCallbacks } from '../callback/vcsCallback.js';

type FlightContentTreeItemOptions = ContentTreeItemOptions & {
  flightName: string;
  showWhenNotSupported?: boolean;
};

/**
 * A flight item. Allows for playing a flight from the content tree.
 * Callbacks for onActivate are called on play, when playing from a paused state and onDeactivate are called
 * on stop. Pausing and continueing a flight does not trigger any callbacks.
 */
class FlightContentTreeItem extends VcsObjectContentTreeItem {
  static get className(): string {
    return 'FlightContentTreeItem';
  }

  private _flightName: string;
  private _showWhenNotSupported: boolean;
  private _listeners: Array<() => void> = [];
  constructor(options: FlightContentTreeItemOptions, app: VcsUiApp) {
    super(options, app);

    this._flightName = options.flightName;
    this._showWhenNotSupported = parseBoolean(
      options.showWhenNotSupported,
      false,
    );

    this._setup();
  }

  private get _flight(): FlightInstance | undefined {
    return this._app.flights.getByKey(this._flightName);
  }

  private _clearListeners(): void {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }

  private _setupPlayer(): void {
    let stateListener = (): void => {};
    let destroyListener = (): void => {};
    let player: FlightPlayer | undefined;

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
          player = await this._app.flights.setPlayerForFlight(this._flight!);
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
              player = undefined;
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
        player = undefined;
      }
      this.removeAction(playAction.name);
    });
  }

  private _setup(): void {
    this._clearListeners();
    /**
     * Called when a flight is added or removed to reset the item if needed
     */
    const resetHandler = (flight: FlightInstance): void => {
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
      this.visible = isCesium || this._showWhenNotSupported;

      if (this._showWhenNotSupported) {
        this.disabled = !isCesium;
      }
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
          this.visible = isCesium || this._showWhenNotSupported;
          if (this._showWhenNotSupported) {
            this.disabled = !isCesium;
          }
        }),
      );
    }
  }

  toJSON(): FlightContentTreeItemOptions {
    const config = super.toJSON() as FlightContentTreeItemOptions;
    config.flightName = this._flightName;
    if (this._showWhenNotSupported) {
      config.showWhenNotSupported = this._showWhenNotSupported;
    }
    return config;
  }

  destroy(): void {
    super.destroy();
    this._clearListeners();
  }
}

export default FlightContentTreeItem;
contentTreeClassRegistry.registerClass(
  FlightContentTreeItem.className,
  FlightContentTreeItem,
);
