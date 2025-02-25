# Action

The VcsAction is an interface describing a bi-state system linked to a user interaction.
The bi-state can be extended to a tri-state logic using the `background` property.

The standard use case for a bi-state action is toggling a window's state active and deactive.
The tri-state use case is for tool's that can run in background.
The tri-state action callback toggles a tool active and deactive taking the tool's WindowComponents state into account.
If the tool's WindowComponent is closed, the tool remains active, now running in background, which is indicated by an outlined in primary color button.

```js
/**
 * @interface VcsAction
 * @property {string} name - reactive and translatable name rendered in overflow
 * @property {string} [title] - reactive and translatable title rendered as tooltip
 * @property {string} [icon] - icon rendered on the button. If no icon provided, item is rendered in overflow
 * @property {Function} callback - callback function is triggered when the button is clicked
 * @property {boolean} [active=false] - optional state of button. If active, button is rendered in primary color
 * @property {boolean} [background=false] - optional background state. If active and background, button is rendered in primary color outlined
 * @property {boolean} [disabled=false] - optional flag to indicate that the action is disabled
 */
```

An object implementing VcsAction can be used inside a [VcsActionButtonList](../src/components/buttons/VcsActionButtonList.vue) or on a [VcsButton](../src/components/buttons/VcsButton.vue):

```js
const action = {
  name: 'alertAction',
  tooltip: 'This will open an alert',
  icon: 'mdi-alert',
  active: false,
  callback() {
    window.alert('Alert Action');
    this.active = !this.active;
  },
};
```

```vue
<VcsButton
  :data-action-name="action.name"
  :id="action.name"
  :tooltip="action.title"
  :icon="action.icon"
  :active="action.active"
  :disabled="actions.disabled"
  @click.stop="action.callback($event)"
/>
```

VcsAction can be validated using [validateAction()](../src/components/lists/VcsActionList.vue).
There is a set of helper functions providing standard user interactions. See [actionHelper.js](../src/actions/actionHelper.js) for more information.
Action should be discoverable via the `data-action-name` HTML attribute. This is applied
to buttons automatically when using a VcsActionList to render an action.

## Toggle Action

The most frequently used action is a toggle action, which switches a tool between active and inactive state.
Writing a plugin you can use `createToggleAction()` to create a button which toggles a plugin window.
You may provide a name, icon and title as `ActionOptions`. You must provide an id and a VueComponent on the `WindowComponentOptions`.
As 3rd parameter the windowManager of the app has to be provided, as 4th parameter the owner of the window being created.

```js
import { createToggleAction } from '@vcmap/ui'; // (../src/actions/actionHelper.js)

const { action, destroy } = createToggleAction(
  {
    name: 'myToogleAction',
  },
  {
    id: 'myPlugin',
    component: PluginWindowComponent,
  },
  app.windowManager,
  'myPlugin',
);
```

The function returns an object with the action object and a destroy function.
You can now add the created action on the Navbar, where it will be rendered as VcsButton. For more information on the Navbar, see [Buttons](./BUTTONS.md):

```js
app.navbarManager.add(
  { id: 'myPlugin', action },
  'myPlugin',
  ButtonLocation.TOOL,
);
```

Use the returned `destroy` function to destroy your action, when it's not needed anymore.
This may be in a `unmounted` hook or in the `destroy` function of your plugin:

```js
if (destroy) {
  destroy();
}
```

## Disabling Actions

Actions can have a disabled flag. If your action is only executable for a specific condition, you need to maintain its compatibility.
For example, if a tool can only be used in 3D, make use of the `mapActivated` event:

```js
const { action, destroy } = createToggleAction();

const mapChangedListener = app.maps.mapActivated.addEventListener((map) => {
  if (!(map instanceof CesiumMap)) {
    if (app.windowManager.has(windowComponent.id)) {
      app.windowManager.remove(windowComponent.id);
    }
    action.disabled = true;
  } else {
    action.disabled = false;
  }
});
```

> For toggle actions it is best practice to remove windows of currently not compatible tools.

## Usage within VC Map UI

The following image illustrates where different actions are used on the VC Map user interface:
![UI Actions Overview](UI_ACTIONS.svg)
