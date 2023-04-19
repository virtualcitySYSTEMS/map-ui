# Toolbox

The toolbox is a container for tools. Plugins can add [ToolboxComponents](#ToolboxComponents) or buttons to predefined groups of `@vcmap/ui` or own groups.
The ToolboxManager manages these groups and group's content. It implements the `VcsComponentManager<ToolboxComponent,ToolboxComponentOptions>` interface.
Each registered `ToolboxComponent` has an id, a type and an owner:

```js
/**
 * @typedef {Object} ToolboxComponent
 * @property {string} id
 * @property {ToolboxType} type - Group type, defining the behaviour of the group
 * @property {string|vcsAppSymbol} owner
 */
```

This basic ToolboxComponent schema is extended by three different types:

- [SingleToolboxComponent](#SingleToolboxComponent)
- [SelectToolboxComponent](#SelectToolboxComponent)
- [GroupToolboxComponent](#GroupToolboxComponent)

To add a new ToolboxComponent, you have to provide `ToolboxComponentOptions` (again extended by options for three different types):

```js
/**
 * @typedef {Object} ToolboxComponentOptions
 * @property {string} [id] - Optional ID, If not provided an uuid will be generated.
 * @property {ToolboxType} type - Group type, defining the behaviour of the group
 */
```

Important notes on ToolboxComponents:

- ToolboxComponents are static. Once added, they cannot be changed or updated.
- ToolboxComponents of plugins are removed from the app, when the plugin is removed.
- GroupToolboxComponent is a special case. It can be changed by adding or removing buttons.

> Avoid adding buttons to groups owned by other plugin, since this may lead to unexpected behaviour (see [GroupToolboxComponent](#GroupToolboxComponent)).

The `ToolboxComponents` are sorted by owner and plugin order. For VcsApp owned app a predefined defaultOrder exists.
To be rendered in Toolbox components must meet certain conditions:

- SingleToolboxComponent: no further conditions
- SelectToolboxComponent: must have at least two tools
- GroupToolboxComponent: must have at least one member (button)

## ToolboxComponents

The ToolboxManager supports three different `ToolboxType`s with different behaviour:

```js
/**
 * Possible group types. Define behaviour of group:
 * @property {number} SINGLE - SingleToolboxComponent with single toggle action rendered as VcsButton
 * @property {number} SELECT - SelectToolboxComponent with one selected item of a list of items
 * @property {number} GROUP - GroupToolboxComponent with multiple non-exclusive items rendered as VcsButton
 * @enum {number}
 */
```

### SingleToolboxComponent

Renders one **single** toggle button.

```js
/**
 * @typedef {ToolboxComponent} SingleToolboxComponent
 * @property {VcsAction} action
 */
```

To add a SingleToolboxComponent, use `add()` method of ToolboxManager providing `SingleToolboxComponentOptions`:

```js
/**
 * @typedef {ToolboxComponentOptions} SingleToolboxComponentOptions
 * @property {VcsAction} action - An action of a single tool
 */

app.toolboxManager.add(
  {
    id: 'sample',
    action: {
      name: 'sampleToggle',
      title: 'sample',
      icon: 'mdi-sample',
      active: false,
      callback() {},
    },
  },
  'sample-plugin',
);
```

### SelectToolboxComponent

The **select** type offers an exclusive selection of a tool within this group.
It implements an extended `VcsAction` called `ToolboxSelectAction` with a selected callback, a list of tools and a currentIndex.
By default, the first item of the group is rendered next to a dropdown arrow.
Clicking the dropdown a menu shows up, listing all available tools of this group.
Selecting one tool selects it. The item rendered on top level is switched accordingly.
This behaviour has to be implemented by the `selected` callback of `ToolboxSelectAction`, which is called on select.
It is proposed `selected` also activates the item, if this is not already the case.
Clicking the selected item, calls the `callback` of `ToolboxSelectAction`.
It is proposed `callback` activates or deactivates the tool, e.g. by starting or stopping a session.

```js
/**
 * @typedef {ToolboxComponent} SelectToolboxComponent
 * @property {ToolboxSelectAction} action
 */

/**
 * @typedef {VcsAction} ToolboxSelectAction
 * @property {function(index:number):void} selected - A callback determining the select behavior of the group. Should set the currentIndex.
 * @property {Array<ToolboxSelectItem>} tools - A list of exclusive tools belonging to the group
 * @property {number} currentIndex - Index of the current item
 */

/**
 * @typedef {Object} ToolboxSelectItem
 * @property {string} name
 * @property {string} [title]
 * @property {string} icon
 */
```

To add a SelectToolboxComponent with tools, use `add()` method of ToolboxManager providing `SelectToolboxComponentOptions`.
Snippet shows a dummy ToolboxSelectAction, starting and stopping a session on toggle. On select the session is updated:

```js
/**
 * @typedef {ToolboxComponentOptions} SelectToolboxComponentOptions
 * @property {ToolboxSelectAction} action - An action determining the behaviour of the select group
 */

const selectGroup = app.toolboxManager.add(
  {
    id: 'multiSelect',
    type: ToolboxType.SELECT,
    action: {
      name: 'multiSelect',
      title: 'multi select',
      active: false,
      currentIndex: 0,
      _stop() {
        console.log('stopping session', this._session);
        this._session = null;
        this.active = false;
      },
      _start() {
        const startSession = (tool) => ({ type: tool });
        this._session = startSession(this.tools[this.currentIndex].name);
        this.active = true;
        console.log('starting session', this._session);
      },
      callback() {
        if (this.active) {
          this._stop();
        } else {
          this._start();
        }
      },
      selected(index) {
        this.currentIndex = index;
        if (this.active) {
          this._session.type = this.tools[this.currentIndex].name;
          console.log('updating active session', this._session);
        } else {
          this._start();
        }
      },
      tools: [
        {
          name: 'pen',
          title: 'Item 1',
          icon: '$vcsPen',
        },
        {
          name: 'object',
          title: 'Item 2',
          icon: '$vcsObjectSelect',
        },
      ],
    },
  },
  'sample-plugin',
);
```

### GroupToolboxComponent

The **group** type provides a non-exclusive group of tools. The group button with dropdown arrow is always rendered on top level.
Multiple group items can be activated. The group button shows an active state, as soon as one of the group's tools is active.

```js
/**
 * @typedef {ToolboxComponent} GroupToolboxComponent
 * @property {string|undefined} icon
 * @property {string|undefined} title
 * @property {ButtonManager} buttonManager
 */
```

To add a GroupToolboxComponent, use `add()` method of ToolboxManager providing `GroupToolboxComponentOptions`:

```js
/**
 * @typedef {ToolboxComponentOptions} GroupToolboxComponentOptions
 * @property {string} icon - Group icon
 * @property {string} [title] - Optional group title, for dropdown
 */

const group = app.toolboxManager.add(
  {
    id: 'group',
    type: ToolboxType.GROUP,
    icon: 'mdi-group',
    title: 'group',
  },
  'sample-plugin',
);
```

To add buttons to the group request the ButtonManager and use its `add()` method.
Buttons in the group are rendered in the order they are added.

```js
const buttonComponents = [
  {
    action: {
      name: 'sampleToggle',
      title: 'sample',
      icon: 'mdi-sample',
      active: false,
      callback() {},
    },
  },
  {
    action: {
      name: 'sampleToggle2',
      title: 'sample2',
      icon: 'mdi-sample',
      active: false,
      callback() {},
    },
  },
];
buttonComponents.forEach((button) =>
  group.buttonManager.add(button, 'sample-plugin'),
);
```

You can also add buttons to existing groups. Be aware, that groups can be removed.
You shouldn't add buttons to a group owned by another plugin!
This may lead to unexpected behaviour, since the order of loading and unloading plugins is not defined.
Therefore, a plugin you are dependent on might not or no longer exist.
Add your own group instead or use a group owned by the VcsUiApp:

```js
app.toolboxManager.get('miscellaneous').buttonManager.add(
  {
    action: {
      name: 'mySpecialTool',
      title: 'a special tool',
      icon: 'mdi-special',
      active: false,
      callback() {},
    },
  },
  'sample-plugin',
);
```

Predefined groups of VcsUiApp are:

- flight (group for flight tools)
- miscellaneous (container group for miscellaneous tools)
