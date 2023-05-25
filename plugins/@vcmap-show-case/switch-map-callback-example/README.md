# @vcmap-show-case/switch-map-callback-example

This plugin adds a MapSwitcherCallback to the uiApp.

This can be used to switch the map i the ContentTree,
on Click of an Item.

```json

    {
      "name": "myMapSwitcherEntry",
      "type": "ContentTreeItem",
      "title": "SwitchMapCallback Test",
      "onClick": [
        {
          "type": "SwitchMapCallback",
          "mapName": "ol3"
        }
      ]
    },
```
