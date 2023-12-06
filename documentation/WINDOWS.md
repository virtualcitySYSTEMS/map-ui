# Windows

The WindowManager manages all active windows of a VC Map.
It tracks the [WindowState](#windowstate), the current [Slot](#Slot) and [Position](#Position) of windows and provides an API to `add`, `get` and `remove` windows.
The WindowManager caches the position of closed windows, if they were moved from there initial position, and restores the position on reopen.
It also takes care of window resize by applying the size of the current map target to all windows and by repositioning windows, which would be shifted out of screen.

> For full examples take a look at the [@vcmap-show-case/window-tester](../plugins/@vcmap-show-case/window-tester) plugin.

## WindowComponent

WindowComponent defines the properties of a VC Map window. All parts will be explained later on.

```js
/**
 * @typedef WindowComponent
 * @property {string} id
 * @property {string} [parentId]
 * @property {import("vue").Component} component
 * @property {import("vue").Component} [headerComponent]
 * @property {WindowState} state
 * @property {WindowPosition} [position]
 * @property {WindowPositionOptions} initialPositionOptions
 * @property {import("vue").Ref<WindowSlot>} slot
 * @property {WindowSlot} initialSlot
 * @property {Object} props
 * @property {Object} provides
 * @property {import("vue").ComputedGetter<number>} zIndex
 */
```

A new WindowComponent can be created from `WindowComponentOptions` by passing the options to the `add` method of the WindowManager:

```js
/**
 * @typedef WindowComponentOptions
 * @property {string} [id] Optional ID, If not provided an uuid will be generated.
 * @property {string} [parentId] An optional ID of a parent window for 'dynamicChild' slot. Parent windows with slot dynamicRight are not supported.
 * @property {import("vue").Component} component Main Component which is shown below the header.
 * @property {import("vue").Component} [headerComponent] Replaces the Header Component.
 * @property {WindowState} [state]
 * @property {WindowPositionOptions} [position] Will be merged with default position for slot
 * @property {WindowSlot} [slot]
 * @property {Object} [props]
 * @property {Object} [provides]
 */
```

You always have to provide a Vue Component defining the window's content. All other options are optional.
A minimal example of adding a window component by an owner called `'owner'` would look like:

```js
app.windowManager.add({ component: MyComponent }, 'owner');
```

To check whether a component is registered on the manager or get said component, call:

```js
app.windowManager.has('windowId');
```

```js
const component = app.windowManager.get('windowId');
```

In the same manner a component can be removed from the manager:

```js
app.windowManager.remove('windowId');
```

> If you plan to get or remove your window at some point from the manager, you should provide an id on `add`.
> Using this id, you can easily get or remove your component.

You can also remove all windows of a specific owner, which is performed by the app, whenever plugins are unloaded:

```js
app.windowManager.removeOwner('pluginXY');
```

## WindowState

The WindowState can be provided with the `WindowComponentOptions` and will be updated by the WindowManager.
The state contains properties defining the window's header, its behaviour and style:

```js
/**
 * @typedef WindowState
 * @property {string} id
 * @property {string|vcsAppSymbol} owner Owner of the window, set by windowManager on add
 * @property {boolean} [hideHeader] be used to not show the header.
 * @property {boolean} [hidePin] be used to not show the pin button.
 * @property {string} [headerTitle]
 * @property {string} [headerIcon]
 * @property {Array<VcsAction>} [headerActions]
 * @property {number} [headerActionsOverflow]
 * @property {string} [infoUrl] An optional url referencing help or further information on the window's content.
 * @property {boolean} [dockable] Auto derived from hidePin, current slot, current position and initial position.
 * @property {Object<string, string>} [styles] Can be used to add additional styles to the root WindowComponent. Use Vue Style Bindings Object Syntax https://vuejs.org/v2/guide/class-and-style.html
 * @property {Array<string>|Object<string,string>} [classes] Can be used to add additional classes to the root WindowComponent. Use Vue Class Bindings Syntax https://vuejs.org/v2/guide/class-and-style.html
 */
```

### Header

Usually each window has a header. The default header component provides a drag functionality and a close button.
Optionally it can have a help and a pin button.

The [WindowState](#windowstate) object contains a couple of properties to configure the header:

- `hideHeader` to be used to not show the header (default false)
- `hidePin` to be used to not show the pin button on the header (default false)
- `headerTitle` defining the window title
- `headerIcon` defining an optional window icon
- `headerActions` an array of `VcsActions` providing additional functionality
- `headerActionsOverflow` the number of buttons rendered until overflow (default 3) and
- `infoUrl` an optional url referencing a help page (see [Help](./HELP.md#window-info)).

```js
vcsUiApp.windowManager.add(
  {
    component: MyComponent,
    state: {
      headerTitle: 'pluginExample.title',
      headerIcon: '$vcsCircle',
      headerActions: [
        { name: 'MyAction', icon: '$vcsPoint', callback: () => {} },
      ],
      infoUrl: 'https://vc.systems/help/pluginExample',
    },
  },
  'owner',
);
```

Alternatively you can define a custom HeaderComponent using `headerComponent` on the [WindowComponentOptions](#windowcomponent).
This will make use of the named slot `headerComponent`.
All props specified on the WindowComponentOptions are passed to the HeaderComponent slot.

In `detached` state windows usually have a pin button.
On click windows are repositioned at their initial [slot](#slot) or [position](#position).
To prevent a window from being pinned, this button can be hidden setting `hidePin` to true.

### Style

The style of the root window component can be affected using `styles` or `classes` on the [WindowState](#windowstate) object.

Example for binding a style:

```js
app.windowManager.add(
  {
    state: {
      headerTitle: 'Example style',
      styles: { 'background-color': 'red' },
    },
    component: MyComponent,
  },
  'owner',
);
```

Example for binding a class:

```js
app.windowManager.add(
  {
    state: {
      headerTitle: 'Example class',
      classes: {
        vcsTest: computed(() => {
          return showTestClass.value;
        }),
      },
    },
    component: MyComponent,
  },
  'owner',
);
```

## Position

The position of a window follows CSS position properties:

```js
/**
 * @typedef {Object} WindowPosition
 * @property {string} left - The left CSS property participates in specifying the horizontal position of a window.
 * @property {string} top - The top CSS property participates in specifying the vertical position of a window.
 * @property {string} right - The right CSS property participates in specifying the horizontal position of a window.
 * @property {string} bottom - The bottom CSS property participates in specifying the vertical position of a window.
 * @property {string} width - The width CSS property sets an element's width.
 * @property {string} height - The height CSS property sets an element's height.
 * @property {string} [maxHeight] -  It prevents the used value of the height property from becoming larger than the value specified for max-height. (max is target height, will be automatically updated)
 * @property {string} [maxWidth] - It prevents the used value of the width property from becoming larger than the value specified by max-width. (max is target width, will be automatically updated)
 * @property {string} [minHeight] - It prevents the used value of the height property from becoming smaller than the value specified for min-height.
 * @property {string} [minWidth] - It prevents the used value of the width property from becoming smaller than the value specified for min-width.
 */
```

The following options can be defined:

```js
/**
 * @typedef {Object} WindowPositionOptions
 * @property {string|number|undefined} left Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} top Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} right Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} bottom Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} width Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} height Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} maxHeight Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} maxWidth Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} minHeight Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} minWidth Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 */
```

> Depending on the provided slot the position options will be merged on `add` with the default position of the WindowSlot.

Do not update the position property of a window Component directly. Use the WindowManager's `setWindowPositionOptions` method instead:

```js
app.windowManager.setWindowPositionOptions('windowId', {
  left: '30%',
  right: '30%',
  top: '40%',
  bottom: '20%',
});
```

To parse WindowPosition from options use:

```js
const parsedPosition = windowPositionFromOptions(
  windowPositionOptions,
  (windowPosition = {}),
);
```

This will set default values and assign the options on a provided windowPosition (2nd parameter).

### WindowHelper

To get numerical absolute position values use:

```js
const targetSize = getTargetSize(app.maps.target); // the current map target
const numericPosition = optionsFromWindowPosition(windowPosition, targetSize);
```

There are more helper functions to work with the window's position (see [WindowHelper](../src/manager/window/windowHelper.js)):

- `getWindowPositionOptions` Get WindowPositionOptions from client position relative to a HTMLElement.
- `getWindowPositionOptionsFromMapEvent` Get window position options based on a pixel in the map.
- `getFittedWindowPositionOptions` Fits a window aligned top left, so it fits into the parent.
- `getFittedWindowPositionOptionsFromMapEvent` Fits a window aligned top left, so it fits into currently active map.
- `updateWindowPosition` Returns an updated WindowPosition by applying new options keeping the original object unchanged.
- `moveWindow` Move window position in x and y.
- `clipToTargetSize` Clips a provided WindowPosition corresponding to the size of its target.
- `getPositionAppliedOnTarget` Returns the position applied on the target by clipping the position to the target's size.

## Slot

The WindowManager offers five slot types:

```js
/**
 * @readonly
 * @enum {string}
 * @property {string} STATIC - Static windows cannot be moved and will be positioned top-left.
 * @property {string} DYNAMIC_LEFT - Positioned top-left, if no static window is present. Can be moved by user interaction.
 * @property {string} DYNAMIC_RIGHT - Positioned top-right. Can be moved by user interaction.
 * @property {string} DYNAMIC_CHILD - Positioned top-right of a parent window. Can be moved by user interaction. Will be moved with parent window, if docked. Requires parentId.
 * @property {string} DETACHED - Positioned at initial provided position. Can be moved by user interaction.
 */
```

See [GET_STARTED](./GET_STARTED.md#overview-ui-elements) for a visualization of the slot positions.

Depending on the provided slot the position options will be merged on `add` with the default position of the WindowSlot.

### Dynamic Child Slot

The dynamic child slot binds a window to a parent window, which is defined by a `parentId`:

```js
const parentWindowComponentOptions = {
  id: 'parent',
  componet: ParentComponent,
  slot: WindowSlot.DYNAMIC_LEFT,
};

const childWindowComponentOptions = {
  id: 'child',
  parentId: 'parent',
  component: ChildComponent,
  slot: WindowSlot.DYNAMIC_CHILD,
  position: {
    width: '200px',
    // left and top will be overwritten by the derived child position next to its parent
  },
};
```

Behaviour of the child window:

- The child window is always opened top-right of the parent window.
- The child window can be moved away from and docked to the parent window.
- The child window is moved with the parent window, if it is docked.
- The child window is closed, when the parent window is closed.
- If the parent window is not open, the child window is automatically
  position like a `DYNAMIC_LEFT` window. This means, it acts as
  any other `DYNAMIC_LEFT` window: it will be closed, if said slot is
  used, it will be moved if opening a `STATIC` window and it closes
  any window already placed at `DYNAMIC_LEFT`.

## Props & Provide/Inject

Properties can be passed to a window component using a `props` object on the `WindowComponentOptions`.
To avoid prop drilling, `WindowManager` implements the provide API of vue.
You can pass properties to be used in any child component of your window component using a `provides` object on the `WindowComomponentOptions` and inject the property within the child.
For more information on provide/inject see [Vue API](https://vuejs.org/guide/components/provide-inject.html).
