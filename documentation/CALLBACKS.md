# Callback

The callback concept executes parametrized actions on certain events, e.g. on item clicked, activated or deactivated.
The callback class is instantiated from its options directly before [executing](#execution) the callback.

In contrary to [VcsAction](./ACTIONS.md)s [VcsCallback](#vcscallback) have no state.
In general the callback execution is not asynchronous awaited.

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

[VcsCallback](../src/callback/vcsCallback.js) is an abstract class to be extended for specific use cases.

Per default, the folllowing extensions are available:

- [ActivateLayersCallback](../src/callback/activateLayersCallback.js) - activates one or more layers
- [DeactivateLayersCallback](../src/callback/deactivateLayersCallback.js) - deactivates one or more layers
- [GoToViewpointCallback](../src/callback/goToViewpointCallback.js) - jumps to a provided viewpoint
- [ApplyLayerStyleCallback](../src/callback/applyLayerStyleCallback.js) - applies a provided style on a layer
- [StartRotationCallback](../src/callback/startRotationCallback.js) - rotates around a given or the current viewpoint
- [StopRotationCallback](../src/callback/stopRotationCallback.js) - stops the rotation
- [ActivateClippingPolygonCallback](../src/callback/activateClippingPolygonCallback.js) - activates one or more Clipping Polygon
- [DeactivateClippingPolygonCallback](../src/callback/deactivateClippingPolygonCallback.js) - deactivates one or more Clipping Polygon
- [AddModuleCallback](../src/callback/addModuleCallback.js) - adds a module
- [RemoveModuleCallback](../src/callback/removeModuleCallback.js) - removes a module
- [OpenSplashScreenCallback](../src/callback/openSplashScreenCallback.js) - opens the SplashScreen if defined
- [CloseSplashScreenCallback](../src/callback/closeSplashScreenCallback.js) - closes the SplashScreen
- [ToggleNavbarButtonCallback](../src/callback/toggleNavbarButtonCallback.js) - calls the callback of a registered navbar action
- [ToggleToolbarButtonCallback](../src/callback/toggleToolbarButtonCallback.js) - calls the callback of a registered toolbar component

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
You can use the `executeCallbacks` helper function to instantiated and execute a list of callbacks.
Imagine you have a item, which provides a click method:

```js
import { executeCallbacks } from '@vcmap/ui';

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
   * @returns {Promise<void>}
   */
  async clicked() {
    executeCallbacks(this._app, this._callbacks);
  }
}
```

> See [ContentTreeItem](../src/contentTree/contentTreeItem.js) for a full example.
