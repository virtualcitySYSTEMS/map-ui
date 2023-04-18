# State
The `State` of an app describes _the difference_ of the current applications state and
the modules it has loaded. For instance, the currently active layers (or inactive layers, 
which would be active on startup), a style defined on an active layer, the current viewpoint
are all stored within the state.

On loading the app, the state is set **once** for each module for which the state was defined.
Once all modules for which the state was defined have been loaded once, reloading them
will no longer set the state.

Furthermore, each plugin may provide its own state via the `getState(forUrl: boolean):*` API. During
initialization of the plugin, the state is passed into the plugin (if the plugin is loaded
in a module for which the state applies). Plugins may define any number of state
parameters, for instance the current window position of their windows, include form values,
drawn geometries, selected features etc. Since the state can also be used
to create a link to the current application, including a subset of the state,
the API uses a boolean flag to indicate this. It is **crucial** that plugins only provide
a minimal set of state parameters when setting the state for an URL and _do not provide
sensitive information_ within the state.

The following outlines how a plugin might implement the `getState` API:

```javascript
import { createToggleAction, ButtonLocation } from '@vcmap/ui';

/**
 * @typedef {Object} PluginConfig
 * @property {string} title
 */

/**
 * @typedef {Object} PluginState
 * @property {WindowPositionOptions} [windowPosition]
 * @property {boolean} active
 */

/**
 * @param {PluginConfig} config
 * @returns {VcsPlugin<PluginConfig, PluginState>}
 */
export default function (config) {
  const name = 'state-test';
  return {
    title: config.title ?? name,
    name,
    /**
     * @param {VcsUiApp} app
     * @param {PluginState} state
     */
    initialize(app, state) {
      const { action, destroy } = createToggleAction(
        { name: this.title },
        { id: 'pluginState', component: { template: '<div>HELLO</div>' } },
        app.windowManager,
        name,
      );
      app.navbarManager.add(
        {
          id: 'pluginState',
          action,
        },
        name,
        ButtonLocation.TOOL,
      );

      if (state?.active) {
        action.callback();
      }
      if (state?.position) {
        app.windowManager.get('pluginState').position = state.position;
      }
      this._destroyAction = destroy;
      this._app = app;
    },
    /**
     * @param {boolean} forUrl
     * @returns {PluginState}
     */
    getState(forUrl) {
      const state = {
        active: this._app.windowManager.has('pluginState'),
      };
      if (!forUrl) {
        state.position = this._app.windowManager.get('pluginState').position;
      }
      return state;
    },
    /**
     * @returns {PluginConfig}
     */
    toJSON() {
      return {
        title: this.title,
      };
    },
    destroy() {
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
```
