# Legend

The Legend Tool is located within the Navbar's TOOL section.
The Tool Button is shown, if at least one legend entry is available.
The window opening on activation contains information on all active layers with a legend or having an active style with a legend.

## Configuration

The legend has to be configured at a `VectorClusterGroup`, `layer` or `style` property bag.
Using the key `legend` one (or more) [LegendItems](#LegendItems) can be added.

> Legend definition on styles are preferred over legend definitions on layers! Legend definition on VectorClusterGroup are handled separately, and can therefore be shown at the same time than a layer/style legend.

You may define both, legend on a layer and on its style(s).
If a style is active, the style legend will be rendered.
If style changes, the legend updates accordingly.
If layer style is cleared, the layer legend definition is shown.

### Adding a legend to a layer

Legends can be defined on all layer types.
The legend will be rendered within the legends window, whenever the layer is active.
The legend for this layer is static as long as no style with legend definition is set.

Example:

```json
{
  "type": "CzmlLayer",
  "name": "czmlPoint",
  "activeOnStartup": false,
  "url": "exampleData/point.czml",
  "properties": {
    "title": "czmlPoint",
    "legend": [
      {
        "type": "ImageLegendItem",
        "src": "https://myUrl/someImage.png"
      }
    ]
  }
}
```

### Adding a legend to a style

Legends belonging to styles should always be defined on the style and not on the layer!
Legends of styles are shown whenever the style is active on an active layer.
It overwrites a legend definition on the layer, if one is existing.
If style changes, the legend updates accordingly.

Example:

```json
{
  "type": "DeclarativeStyleItem",
  "name": "Transparentbuildings",
  "title": "Transparent buildings",
  "declarativeStyle": {
    "show": "true",
    "color": {
      "conditions": [["true", "color('#cccccc', 0.7)"]]
    }
  },
  "properties": {
    "legend": [
      {
        "type": "StyleLegendItem",
        "rows": [
          {
            "type": "FillLegendRow",
            "fill": {
              "color": "#cccccc"
            },
            "title": "Transparent buildings"
          }
        ]
      }
    ]
  }
}
```

### Adding a legend to a VectorClusterGroup

Legends on VectorClusterGroups are handled separately from legends on Layers and Styles. They are shown whenever one of the layers of the group is active. The `title` property defined in the `properties` bag of the VectorclusterGroup is used as the title of the Legend Entry. If a layer with a legend is part of a VectorClusterGroup with a legend, both legends will be shown.

Example:

```json
{
  "type": "VectorClusterLayer",
  "name": "clusterLayerLocations",
  "showInContent": true,
  "clusterDistance": 90,
  "properties": {
    "title": "VectorClusterGroup of Locations",
    "legend": [
      {
        "type": "IframeLegendItem",
        "src": "/exampleData/legendExample.html"
      }
    ]
  }
}
```

### LegendItems

Each LegendItem must provide a type. The type determines the rendering of an item.
Specialised options of a legend item are type based.
The following **LegendTypes** are available:

##### ImageLegendItem

An item rendering the image of a provided source. Use an i18n string as `src`, if you want to provide a translatable legend.
Each ImageLegendItems with the `popoutBtn` flag set to true will get a popout button overlaying the top-right corner of the image.
For further explanations a tooltip can be defined, showing up on hover.

```js
/**
 * @typedef {LegendItem} ImageLegendItem
 * @property {boolean} [popoutBtn=false] - show a button in the top-right corner of the image to open legend in new tab
 * @property {string} src - the source url. Can be an i18n string.
 * @property {string} [tooltip] - Optional further explanation of the legend
 */
```

Example:

```json
{
  "type": "ImageLegendItem",
  "src": "https://www.lfu.bayern.de/gdi/wms/laerm/hauptverkehrsstrassen?request=GetLegendGraphic%26version=1.3.0%26format=image/png%26layer=mroadbylden"
}
```

##### IframeLegendItem

An item rendering a provided source as iframe. Use an i18n string as `src`, if you want to provide a translatable legend.
Each IframeLegendItems with the `popoutBtn` flag set to true will get a popout button overlaying the top-right corner of the iframe body.

```js
/**
 * @typedef {LegendItem} IframeLegendItem
 * @property {boolean} [popoutBtn=false] - show a button in the top-right corner of the item to open legend in new tab
 * @property {string} src - the source url. Can be an i18n string.
 */
```

Example:

```json
{
  "type": "IframeLegendItem",
  "src": "/exampleData/legendExample.html"
}
```

#### StyleLegendItem

A list of parametrized style items, configured row by row. Each row consists of an icon derived from a Style definition and a corresponding title.
If long titles are used, item can be configured to have only one column (`nrCol: 1`). Default are two columns in a flexbox.
Each row of type `StyleLegendRow` can be either [StrokeLegendRow](#StrokeLegendRow), [FillLegendRow](#FillLegendRow),
[CircleLegendRow](#CircleLegendRow), [IconLegendRow](#IconLegendRow), [RegularShapeLegendRow](#RegularShapeLegendRow) or
[TextLegendRow](#TextLegendRow). For further explanations rows can have a tooltip, showing up on hover.

```js
/**
 * @typedef {LegendItem} StyleLegendItem
 * @property {number} [colNr=2] Number of columns. Valid values are 1 or 2. Per default 2.
 * @property {Array<StyleLegendRow>} rows - style definitions with description
 */

/**
 * @typedef {Object} StyleLegendRow
 * @property {StyleRowType} type - determines rendering of the row, specialised properties are type based.
 * @property {string} title - Description of the style. Can be an i18n string
 * @property {string} [tooltip] - Optional further explanation of the legend row. If no tooltip is provided, the title is used instead.
 */
```

Example:

```json
{
  "type": "StyleLegendItem",
  "rows": [
    {
      "type": "StrokeLegendRow",
      "title": "Line",
      "stroke": {
        "color": [0, 0, 0, 1],
        "width": 1.2
      }
    },
    {
      "type": "StrokeLegendRow",
      "title": "Line blue",
      "stroke": {
        "color": [118, 165, 204, 1],
        "width": 1.2
      }
    }
  ]
}
```

##### StrokeLegendRow

A row rendering a line according to provided stroke options with a title.

```js
/**
 * @typedef {StyleLegendRow} StrokeLegendRow
 * @property {import("ol/style/Stroke").Options} stroke
 */
```

Example:

```json
{
  "type": "StrokeLegendRow",
  "title": "Line blue",
  "stroke": {
    "color": [118, 165, 204, 1],
    "width": 1.2
  }
}
```

##### FillLegendRow

A row rendering a filled polygon according to provided fill (and stroke) options with a title.

```js
/**
 * @typedef {StyleLegendRow} FillLegendRow
 * @property {import("ol/style/Fill").Options} fill
 * @property {import("ol/style/Stroke").Options} [stroke]
 */
```

Example:

```json
{
  "type": "FillLegendRow",
  "title": "Polygon blue",
  "fill": {
    "color": [118, 165, 204, 1]
  },
  "stroke": {
    "color": [68, 68, 68, 1],
    "width": 2
  }
}
```

#### CircleLegendRow

A row rendering a circle according to provided fill (and stroke) options with a title.

```js
/**
 * @typedef {StyleLegendRow} CircleLegendRow
 * @property {import("ol/style/Circle").Options} image
 */
```

Example:

```json
{
  "type": "CircleLegendRow",
  "title": "Point Circle",
  "image": {
    "radius": 8,
    "scale": 4,
    "fill": {
      "color": "rgba(255, 0, 0, 1)"
    },
    "stroke": {
      "color": "#00FF00",
      "width": 2
    }
  }
}
```

#### IconLegendRow

A row rendering an icon according to provided image icon options with a title.

```js
/**
 * @typedef {StyleLegendRow} IconLegendRow
 * @property {import("ol/style/Icon").Options} image
 */
```

Example:

```json
{
  "type": "IconLegendRow",
  "title": "Flughäfen",
  "image": {
    "src": "https://sgx.geodatenzentrum.de/wms_poi_open?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=flughaefen",
    "scale": 0.2
  }
}
```

#### RegularShapeLegendRow

A row rendering a shape according to provided image options with a title.

```js
/**
 * @typedef {StyleLegendRow} RegularShapeLegendRow
 * @property {import("ol/style/RegularShape").Options} image
 */
```

Example:

```json
{
  "type": "RegularShapeLegendRow",
  "title": "Star Shape",
  "image": {
    "fill": {
      "color": "rgba(255, 0, 0, 1)"
    },
    "stroke": {
      "color": "#00FF00",
      "width": 2
    },
    "points": 5,
    "radius": 10,
    "radius2": 4,
    "angle": 0
  }
}
```

#### TextLegendRow

A row rendering a text according to provided text options with a title.
Optional `label` is used as text content (might not be displayed completely due to size).

```js
/**
 * @typedef {StyleLegendRow} TextLegendRow
 * @property {import("ol/style/Text").Options} text
 * @property {string} [label='Text']
 */
```

Example:

```json
{
  "type": "TextLegendRow",
  "title": "Text",
  "text": {
    "font": "italic bold 32px Courier New, monospace",
    "fill": {
      "color": "#73D9D1"
    },
    "stroke": {
      "color": "#000000",
      "width": 2
    }
  },
  "label": "Test!"
}
```
