# VC Map Plugin Simple Graph

This is a plugin adding a new Feature Info View using {@link https://vuetifyjs.com/en/api/v-sparkline/#props|vuetify v-sparkline }.

| View class                            | VueComponent                                     | description                                              |
| ------------------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| [SimpleGraphView](simpleGraphView.js) | [SimpleGraphComponent](SimpleGraphComponent.vue) | A simple graph view including trend lines and bar graph. |

## configuration

See `{FeatureInfoViewOptions}` for general configuration of Feature Views.
Use `{string[]} attributeKeys` to define, which feature properties contain graph data.
Use `{WindowComponentOptions} window` to define the position and size of the graph window.
The graph can be configured as follows:

| Property | Type                     | default   | Description                                          |
| -------- | ------------------------ | --------- | ---------------------------------------------------- |
| labels   | string[] &#124; number[] | []        | optional array of strings labeling all data points   |
| graph    | string                   | 'trend'   | Choose between a trendline or bars                   |
| color    | string                   | 'primary' | optional color of the sparkline of the graph         |
| gradient | string[]                 | []        | optional array of colors to use as a linear-gradient |
| fill     | boolean                  | false     | if true, filled area below sparkline                 |
| smooth   | number &#124; string     | 8         | optional number of px to use as a corner radius      |

### Example

```json
{
  "type": "SimpleGraphView",
  "name": "graphBar",
  "attributeKeys": [
    "globalRadRoofsMonth_01",
    "globalRadRoofsMonth_02",
    "globalRadRoofsMonth_03",
    "globalRadRoofsMonth_04",
    "globalRadRoofsMonth_05",
    "globalRadRoofsMonth_06",
    "globalRadRoofsMonth_07",
    "globalRadRoofsMonth_08",
    "globalRadRoofsMonth_09",
    "globalRadRoofsMonth_10",
    "globalRadRoofsMonth_11",
    "globalRadRoofsMonth_12"
  ],
  "labels": [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  "color": "secondary",
  "graph": "bar",
  "gradient": ["red", "orange", "yellow"],
  "window": {
    "slot": "detached",
    "position": {
      "left": "20%",
      "right": "20%",
      "bottom": "0%"
    }
  }
}
```
