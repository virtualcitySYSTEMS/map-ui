# Panels

The PanelManager manages the four available panels:

- MAIN: centered panel, always active (cannot be changed via API)
- LEFT: toggable, width adjustable left panel
- RIGHT: toggable, width adjustable right panel
- BOTTOM: toggable, height adjustable bottom panel

The main panel is set up by the VcsApp with the VC Map canvas. It will always be visible and it's content cannot be changed.
The other panels can be toggled and used by different plugins.
If a panel is already in use by a plugin, it's content will be replaced.
The PanelManager tracks the [PanelPosition](#Position) and [PanelState](#State).

> For full examples take a look at the [@vcmap-show-case/panel-tester](../plugins/@vcmap-show-case/panel-tester) plugin.

# PanelComponent

PanelComponent defines the properties of a VC Map panel.

```js
/**
 * @typedef {Object} PanelComponent
 * @property {string} id
 * @property {import("vue").Component} component
 * @property {Partial<PanelState>} state
 * @property {Object} props
 * @property {Object} provides
 */
```

A new PanelComponent can be created from `PanelComponentOptions` by passing the options to the `add` method of the PanelManager:

```js
/**
 * @typedef {Object} PanelComponentOptions
 * @property {string} [id] - Optional id, which will be set as HTML container ID. If not provided an uuid will be generated.
 * @property {import("vue").Component} [component] Optional component to be rendered in the panel.
 * @property {Partial<PanelState>} [state]
 * @property {Partial<VerticalPanelPositionOptions|HorizontalPanelPositionOptions>} [position] Will be merged with default position for panel
 * @property {Object} [props]
 * @property {Object} [provides]
 */
```

> The position of a panel is mostly defined by its location. For vertical panels (left, right) you can provide width options, for the bottom panel height options.

On add you always have to provide a PanelLocation, which defines the panel to be used:

```js
/**
 * @readonly
 * @enum {string}
 * @property {string} LEFT - left panel (vertical)
 * @property {string} RIGHT - right panel (vertical)
 * @property {string} BOTTOM - bottom panel (horizontal)
 */
```

A minimal example of adding a panel component by an owner called `'owner'` would look like:

```js
const panel = app.panelManager.add({}, 'owner', PanelLocation.LEFT);
```

To fill the panel with content, you can optionally provide your own Vue Component.
Alternatively you can use the container id to register your own DOM Element.

To check whether a panel is currently registered on the manager (hence visible), call:

```js
app.panelManager.has(panel.id);
```

Or you can check by location:

```js
app.panelManager.hasLocation(PanelLocation.LEFT);
```

Similar you can get the panel component from the PanelManager:

```js
const panel = app.panelManager.get(panel.id);
```

or

```js
const panel = app.panelManager.getLocation(PanelLocation.LEFT);
```

In the same manner a panel can be removed from the manager to hide said panel:

```js
app.panelManager.remove(panel.id);
```

or

```js
app.panelManager.removePanelAtLocation(PanelLocation.LEFT);
```

You can also remove all panels of a specific owner, which is performed by the app, whenever plugins are unloaded:

```js
app.panelManager.removeOwner('pluginXY');
```

## Position

The position of a panel follows CSS position properties.

```js
/**
 * @typedef {Object} PanelPosition
 * @property {string} left - The left CSS property participates in specifying the horizontal position of a panel.
 * @property {string} top - The top CSS property participates in specifying the vertical position of a panel.
 * @property {string} right - The right CSS property participates in specifying the horizontal position of a panel.
 * @property {string} bottom - The bottom CSS property participates in specifying the vertical position of a panel.
 * @property {string} width - The width CSS property sets an element's width.
 * @property {string} height - The height CSS property sets an element's height.
 * @property {string} maxHeight - The maxHeight CSS property sets an element's maximal height.
 * @property {string} maxWidth - The maxWidth CSS property sets an element's maximal width.
 * @property {string} minHeight - The minHeight CSS property sets an element's minimal height.
 * @property {string} minWidth - The minWidth CSS property sets an element's minimal width.
 */
```

The PanelPosition is internally updated by the Panel Manager.
You can provide initial width or height information on add.

For vertical panels (left/right) width definitions can be provided:

```js
/**
 * @typedef {Object} VerticalPanelPositionOptions
 * @property {string|number|undefined} [width] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [maxWidth] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [minWidth] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 */
```

For the horizontal panel (bottom) height definitions can be provided:

```js
/**
 * @typedef {Object} HorizontalPanelPositionOptions
 * @property {string|number|undefined} [height] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [maxHeight] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 * @property {string|number|undefined} [minHeight] Can be a css position string (e.g. '320px' or '50%') number values are treated as `px` values
 */
```

To update the width or height of a panel via API use:

```js
panelManager.setPanelPosition(panelId, { width: '35%' }); // this will only be applied for vertical panels
panelManager.setPanelPosition(panelId, { height: '15%' }); // this will only be applied for bottom panel
```

### Default Position & Cached Position

Each panel location has default position options, which are applied on a panel, when it is added to the PanelManager.
When a panel is removed, it's current width and height options are cached by the PanelManager.
When re-adding a panel with the same ID, the cached position options will be applied on top of the default position, but can be overridden by provided position options.

> Depending on the registered (visible) panels, the size of all panels will be adapted.

## State

The PanelState can be provided with the `PanelComponentOptions` and will be updated by the PanelManager.
Apart from general panel information the state includes a resizable flag, which defines whether the panel is (currently) resizable or not.
The state enable custom css classes or style definitions, which are applied on the panel root element.

```js
/**
 * @typedef {Object} PanelState
 * @property {string} id
 * @property {string|vcsAppSymbol} owner Owner of the panel, set by panelManager on add
 * @property {PanelLocation} location Location of the panel, set by panelManager on add
 * @property {boolean} [resizable=true] Whether size of panel can be adapted
 * @property {Object<string, string>} [styles] Can be used to add additional styles to the root PanelComponent. Use Vue Style Bindings Object Syntax https://vuejs.org/v2/guide/class-and-style.html
 * @property {Array<string>|Object<string,string>} [classes] Can be used to add additional classes to the root PanelComponent. Use Vue Class Bindings Syntax https://vuejs.org/v2/guide/class-and-style.html
 */
```

## Props & Provide/Inject

Properties can be passed to a panel component using a `props` object on the `PanelComponentOptions`.
To avoid prop drilling, `PanelManager` implements the provide API of vue.
You can pass properties to be used in any child component of your panel component using a `provides` object on the `PanelComomponentOptions` and inject the property within the child.
For more information on provide/inject see [Vue API](https://vuejs.org/guide/components/provide-inject.html).
