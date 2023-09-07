# Context Menu

The context menu provides plugins with an API to add right click handlers to the map.
Each handler added to the context menu will receive every right click event in the map
and may return an Array of VcsAction, potentially wrapped in a Promise.

Should a handler return actions, said actions will be rendered at the clicked location
for as long as:

- The map is not moved.
- No layers are activated or removed.
- No interactions are made on the map.
- No action in the context menu has been executed.

The context menu is rendered with a dynamic width, with a max width of 320px.
Ensure that the title of your action is as short as possible. And double
check the result. Otherwise you must provide a tooltip for the ellipsis via the
actions title.

## Usage

The `ContextMenuManager` provides an API to add handlers based
on the `Owner` (e.g. the plugin name) concept. The handler receives the right click
event from the `ContextMenuManager` and may return an Array of VcsAction.

The following example illustrates how to add a handler. This handler always adds a
single action (multiple are allowed), which will log the events coordinate:

```javascript
import { VcsUiApp } from '@vcmap/ui';

const app = new VcsUiApp();
app.contextMenuManager.addEventHandler(
  (event) => [
    {
      name: 'Coordiante',
      callback() {
        console.log(event.position);
      },
    },
  ],
  'my-plugin',
);
```
