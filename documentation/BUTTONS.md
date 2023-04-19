# Buttons

The map user interface has at various places buttons arranged in groups.
The [ButtonManager](../src/manager/buttonManager.js) and its specialisation the [NavbarManager](../src/manager/navbarManager.js) take care of a reactive list of buttons.
Both implement the `VcsComponentManager` interface:

```js
/**
 * @interface VcsComponentManager
 * @template {Object} T - the component type
 * @template {Object} O - component options
 * @property {import("@vcmap/core").VcsEvent<T>} added
 * @property {import("@vcmap/core").VcsEvent<T>} removed
 * @property {string[]} componentIds - all registered component ids as reactive array
 * @property {function(string):T} get - get component by id
 * @property {function(string):boolean} has - has component with id
 * @property {function(string)} remove - remove component by id
 * @property {function(O, string|vcsAppSymbol):T} add - add component of owner
 * @property {function(string|vcsAppSymbol)} removeOwner - remove all components of owner
 * @property {function()} clear - remove all registered components
 * @property {function()} destroy
 * @api
 */
```

The interface is also implemented by [WindowManager](./WINDOWS.md) and [ToolboxManager](./TOOLBOX.md).

## ButtonManager

The ButtonManager is a basic container for a set of buttons.
Buttons can be added and removed.

To add a button, provide `ButtonComponentOptions` consisting of an optional id and an action, plus the owner of the button.

```js
/**
 * @typedef ButtonComponentOptions
 * @property {string} [id] Optional ID, If not provided an uuid will be generated.
 * @property {VcsAction} action Action performed by button.
 */

const buttonManager = app.toolboxManager.get('miscellaneous').buttonManager; // Toolbox groups use the buttonManager to manage their buttons. It could be used in other contexts, too.
buttonManager.add(
  {
    id: 'buttonId',
    action: {
      name: 'action',
      callback() {},
    },
  },
  'myPlugin',
);
```

All added buttons are stored in a key value store. To access a button call:

```js
const buttonComponent = buttonManager.get('buttonId');
```

If you need to track state changes, you can listen to `added` and `removed` events emitted, whenever a button is added or removed.
In ui components it might be enough to make use of the reactive component ids array by a computed property:

```js
computed(() =>
  [...buttonManager.componentIds.value].map((id) => buttonManager.get(id)),
);
```

To remove a button use the button component's id.

```js
buttonManager.remove('buttonId');
```

You can also remove all buttons of a specific owner, which is performed by the app on the [NavbarManager](#NavbarManager), whenever plugins are unloaded:

```js
buttonManager.removeOwner('myPlugin');
```

To clear all buttons from the manager call:

```js
buttonManager.clear();
```

## NavbarManager

The NavbarManager controls all buttons displayed on the VC Map navbar.
The navbar is separated in different locations, where buttons can be placed.

NavbarManager extends the add method of ButtonManager. Additionally, to `buttonComponentOptions` and `owner`,
you have to provide a render position.

Possible render positions from left to right are defined by the `ButtonLocation` enumeration object:

```js
/**
 * Possible render positions of buttons in navbar from left to right
 * @enum
 * @property {number} MAP - map buttons (2D, 3D, oblique)
 * @property {number} CONTENT - content buttons (tree, category component view)
 * @property {number} TOOL - tool buttons (toolbox, legend)
 * @property {number} PROJECT - project buttons (project selector)
 * @property {number} SHARE - share buttons rendered in dropdown menu (create link, print)
 * @property {number} MENU - menu buttons rendered in dropdown menu (settings)
 */
export const ButtonLocation = {
  MAP: 0,
  CONTENT: 1,
  TOOL: 2,
  PROJECT: 3,
  SHARE: 4,
  MENU: 5,
};

app.navbarManager.add(
  { id: 'myPlugin', action },
  'myPlugin',
  ButtonLocation.TOOL,
);
```

All other methods behave similar to the ButtonManager.
