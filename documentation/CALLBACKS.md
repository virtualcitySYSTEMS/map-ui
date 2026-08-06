# Callback

The callback concept executes parametrized actions on certain events, e.g. on item clicked, activated or deactivated.
The callback class is instantiated from its options directly before [executing](#execution) the callback.

In contrary to [VcsAction](./ACTIONS.md)s [VcsCallback](#vcscallback) have no state.
In general the callback execution is not asynchronous awaited.
If you need callbacks to be executed sequentially and await promise-returning callbacks, use `executeAsyncCallbacks`.

## Use case and configuration

This concept is used by content tree items incorporating three events:

- onClick (executing callbacks, when item is clicked)
- onActivate (executing callback, when item, e.g. layer is activated)
- onDeactivate (executing callback, when item, e.g. layer is deactivated)

For each event, one or more callbacks can be configured:

```json
{
  "name": "building.texturedBuildings",
  "layerName": "buildings",
  "type": "LayerContentTreeItem",
  "onActivate": [
    {
      "type": "DeactivateLayersCallback",
      "layerNames": ["mesh_surface", "buildings_untextured"]
    },
    { "type": "GoToViewpointCallback", "viewpoint": "alexanderplatz" }
  ],
  "onDeactivate": [
    {
      "type": "ActivateLayersCallback",
      "layerNames": ["buildings_untextured"]
    }
  ]
}
```

## VcsCallback

[VcsCallback](../src/callback/vcsCallback.ts) is an abstract class to be extended for specific use cases.

Per default, the folllowing extensions are available:

- [ActivateLayersCallback](../src/callback/activateLayersCallback.ts) - activates one or more layers
- [DeactivateLayersCallback](../src/callback/deactivateLayersCallback.ts) - deactivates one or more layers
- [GoToViewpointCallback](../src/callback/goToViewpointCallback.ts) - jumps to a provided viewpoint
- [ApplyLayerStyleCallback](../src/callback/applyLayerStyleCallback.ts) - applies a provided style on a layer
- [StartRotationCallback](../src/callback/startRotationCallback.ts) - rotates around a given or the current viewpoint
- [StopRotationCallback](../src/callback/stopRotationCallback.ts) - stops the rotation
- [ActivateClippingPolygonCallback](../src/callback/activateClippingPolygonCallback.ts) - activates one or more Clipping Polygon
- [DeactivateClippingPolygonCallback](../src/callback/deactivateClippingPolygonCallback.ts) - deactivates one or more Clipping Polygon
- [AddModuleCallback](../src/callback/addModuleCallback.ts) - adds a module
- [RemoveModuleCallback](../src/callback/removeModuleCallback.ts) - removes a module
- [OpenSplashScreenCallback](../src/callback/openSplashScreenCallback.ts) - opens the SplashScreen if defined
- [CloseSplashScreenCallback](../src/callback/closeSplashScreenCallback.ts) - closes the SplashScreen
- [ToggleNavbarButtonCallback](../src/callback/toggleNavbarButtonCallback.ts) - calls the callback of a registered navbar action
- [ToggleToolbarButtonCallback](../src/callback/toggleToolbarButtonCallback.ts) - calls the callback of a registered toolbar component
- [ActivateMapCallback](../src/callback/activateMapCallback.ts) - activates the map
- [ActivateOverviewMapCallback](../src/callback/activateOverviewMapCallback.ts) - activates the overview map
- [DeactivateOverviewMapCallback](../src/callback/deactivateOverviewMapCallback.ts) - deactivates the overview map
- [HighlightObjectsCallback](../src/callback/highlightObjectsCallback.ts) - highlights objects on a feature layer
- [UnHighlightObjectsCallback](../src/callback/unHighlightObjectsCallback.ts) - removes object highlighting on a feature layer
- [HideObjectsCallback](../src/callback/hideObjectsCallback.ts) - hides objects on a feature layer or globally
- [ShowObjectsCallback](../src/callback/showObjectsCallback.ts) - shows previously hidden objects on a feature layer or globally
- [StartFlightCallback](../src/callback/startFlightCallback.ts) - starts a flight by name or inline options
- [StopFlightCallback](../src/callback/stopFlightCallback.ts) - stops the currently running flight by name

## CallbackClassRegistry

Custom Callback classes can be implemented and registered on the `callbackClassRegistry`.
You can write a plugin providing a new class extending `VcsCallback`:

```js
/**
 * @class
 * @extends {VcsCallback}
 */
class MyCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'MyCallback';
  }

  callback() {
    // your callback action
  }
}
```

On plugin initialize, you can register the Callback class on the registry.
Also, make sure to unregister the class, when you're plugin is destroyed.

```js
/**
 * @returns {import("@vcmap/ui/src/vcsUiApp").VcsPlugin<T>}
 * @template {Object} T
 */
export default function myPlugin() {
  return {
    /**
     * @param {import("@vcmap/ui").VcsUiApp} vcsUiApp
     */
    initialize(vcsUiApp) {
      vcsUiApp.callbackClassRegistry.registerClass(
        vcsUiApp.dynamicModuleId,
        MyCallback.className,
        MyCallback,
      );
    },
    destroy() {
      this._app.callbackClassRegistry.unregisterClass(
        this._app.dynamicModuleId,
        SwitchMapCallback.className,
      );
    },
  };
}
```

> See [@vcmap-show-case/switch-map-callback-example](../plugins/@vcmap-show-case/switch-map-callback-example) for a full example.

## Execution

VcsCallbacks are executed on certain events. The instance should be created right before execution.
You can use the `executeCallbacks` helper function to instantiate and execute a list of callbacks.
This helper does not await promise-returning callbacks.

If you need sequential execution and want to await promise-returning callbacks before continuing with the next one, use `executeAsyncCallbacks`.
Imagine you have a item, which provides a click method:

```js
import { executeAsyncCallbacks, executeCallbacks } from '@vcmap/ui';

class MyItem {
  constructor(app, options) {
    /**
     * @type {VcsUiApp}
     * @private
     */
    this._app = app;
    /**
     * @type {Array<VcsCallbackOptions>}
     * @private
     */
    this._callbacks = options.callbacks;
  }

  /**
   * A callback called once the item is clicked.
   * Executes callbacks, but does not await promise-returning callbacks.
   * @returns {void}
   */
  clicked() {
    executeCallbacks(this._app, this._callbacks);
  }

  /**
   * A callback called once the item is clicked.
   * Executes callbacks sequentially and awaits promise-returning callbacks.
   * @returns {Promise<void>}
   */
  async clickedAsync() {
    await executeAsyncCallbacks(this._app, this._callbacks);
  }
}
```

> See [ContentTreeItem](../src/contentTree/contentTreeItem.js) for a full example.
