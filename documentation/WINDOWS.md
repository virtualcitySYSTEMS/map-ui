# Windows

The WindowManager manages all active windows of a VC Map.
It tracks the state ([Slot](#Slot) and [Position](#Position)) of windows and provides an API to `add` and `remove` windows.

# Slot
// tbd

# Position
// tbd

# Props & Provide/Inject
Properties can be passed to a window component using a `props` object on the `WindowComponentOptions`.
To avoid prop drilling, `WindowManager` implements the provide API of vue. 
You can pass properties to be used in any child component of your window component using a `provides` object on the `WindowComomponentOptions` and inject the property within the child.
For more information on provide/inject see [Vue API](https://vuejs.org/guide/components/provide-inject.html).

# Header

The default header component provides a drag functionality and a close button.

The `WindowState` object contains four properties to configure the header:
- `hideHeader` to be used to not show the header
- `headerTitle` defining the window title
- `headerIcon` defining an optional icon
- `headerActions` an array of `VcsActions` providing additional functionality and
- `headerActionsOverflowCount` the number of buttons rendered until overflow (default 3).

```js
vcsUiApp.windowManager.add({
        id: 'windowId',
        component: MyComponent,
        WindowSlot: WindowSlot.DETACHED,
        position: {
          left: '40%',
          right: '40%',
        },
        state: {
          headerTitle: 'pluginExample.title',
          headerIcon: '$vcsCircle',
          headerActions: [ { name: 'MyAction', icon: '$vcsPoint', callback: () => {} } ]
        }
      }, 'sample');
```

Alternatively you can define a custom HeaderComponent using the named slot `headerComponent`.
All props specified on the WindowComponentOptions are passed to the HeaderComponent slot.
