# @vcmap-show-case/switch-map-callback-example

This plugin demonstrates the concept of `VcsCallback` by adding a MapSwitcherCallback to the uiApp.

This can be used to switch the map i the ContentTree,
on Click of a ContentTreeItem.

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
