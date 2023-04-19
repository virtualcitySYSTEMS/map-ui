# FeatureInfo

Map features have context specific information, which are made accessible on click by the FeatureInfo tool.
The VcsApp provides some view classes per default and an API to register custom ones.
On context level views can be configured and assigned to a layer.
Configuration is context-sensitive, which allows configuring different views on one layer in different contexts.

## FeatureInfo Tool

The FeatureInfo tool can be activated via a button within the toolbox or using its API.
Whenever the tool is active, FeatureInfo listens to clicks on features, highlights a selected feature and opens a FeatureInfo window, if configured.

## View classes & class registry

FeatureInfo provides a class registry, where view classes can be registered.
A view class is registered by type and defines

- a Vue component rendering the feature's information (the actual view within the ui),
- additional options needed for the view,
- a logic which properties are passed to the Vue component and
- all options corresponding to the feature info window.

View classes should extend `AbstractFeatureInfoView` class.
Each implementation has to provide a Vue component in the class constructor passing it as second argument to the super class.
It may overwrite the following methods:

- `getAttributes`: A method returning all relevant attributes for a view.
- `getProperties`: A method returning all relevant properties passed to the VueComponent of a view.
- `getWindowComponentOptions`: A method being called by FeatureInfo, whenever a new window is created (added to the windowManager).

```js
/**
 * @typedef MyNewViewOptions
 * @property {string} [myProperty='sample']
 */

/**
 * @class
 * @description A new custom view.
 */
class MyNewViewClass extends BalloonFeatureInfoView {
  /**
   * @param {MyNewViewOptions} options
   */
  constructor(options) {
    super(options, MyNewVueComponent); // import a `.vue` file or define a component inline
    // You can define class options for your view class
    /**
     * @type {string}
     */
    this.myProperty = options.myProperty || 'sample';
  }

  /**
   * @param {undefined|import("ol").Feature<import("ol/geom/Geometry").default>|import("@vcmap/cesium").Cesium3DTileFeature|import("@vcmap/cesium").Cesium3DTilePointFeature} feature
   * @returns {Object}
   */
  getAttributes(feature) {
    const attributes = super.getAttributes(feature);
    // Do something with the attributes object, e.g. filtering, processing, ...
    return attributes;
  }

  /**
   * @param {FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {FeatureInfoProps}
   */
  getProperties(featureInfo, layer) {
    const properties = super.getProperties(featureInfo, layer);
    // Do something with the properties object or add your class properties to the object
    return {
      myProperty: this.myProperty,
      ...properties,
    };
  }

  /**
   * @param {FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {WindowComponentOptions}
   */
  getWindowComponentOptions(featureInfo, layer) {
    const options = super.getWindowComponentOptions(featureInfo, layer);
    // Change options of the window, e.g. manipulate window position, ...
    // You may not need to define a new component to customize a view, though.
    // Checkout the FeatureInfoViewOptions for configuration options.
    const { windowPosition } = featureInfo;
    options.position = getWindowPositionOptions(
      windowPosition.x,
      windowPosition.y,
      ['bottom', 'left'],
    );
    return options;
  }
}
```

Once defined, a view class can be registered at FeatureInfo using the API:

```js
app.featureInfo.classRegistry.registerClass(
  app.dynamicContextId,
  MyNewFeatureInfoView.className,
  MyNewFeatureInfoView,
);
```

By passing a Vue Component to your view class constructor, you actually register a pair containing the API within the view class and the user interface within the vue component.
A couple of default views are already registered on the VcsApp:

| View class                                                                           | VueComponent                                                              | description                                                          |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [TableFeatureInfoView](../src/featureInfo/tableFeatureInfoView.js)                   | [TableComponent](../src/components/tables/VcsTable.vue)                   | A sortable table view showing key value pairs of feature properties. |
| [IframeFeatureInfoView](../src/featureInfo/iframeFeatureInfoView.js)                 | Inline Iframe Component                                                   | An iframe view with templatable url.                                 |
| [BalloonFeatureInfoView](../src/featureInfo/balloonFeatureInfoView.js)               | [BalloonComponent](../src/featureInfo/BalloonComponent.vue)               | A balloon view rendering feature properties.                         |
| [AddressBalloonFeatureInfoView](../src/featureInfo/addressBalloonFeatureInfoView.js) | [AddressBalloonComponent](../src/featureInfo/AddressBalloonComponent.vue) | A balloon view rendering address information of a feature.           |

> **Balloon** Views are a special type of view. In contrast to the other view classes, the balloon is rendered at a certain position in the map. The balloon position is updated on scene render.
> To write a custom balloon view, simply extend [BalloonFeatureInfoView](../src/featureInfo/balloonFeatureInfoView.js).
> To change the balloon's design you should use the two slots (#balloon-header & #default) provided by [BalloonComponent](../src/featureInfo/BalloonComponent.vue).
> This will ensure the correct positioning of the balloon.

Other views for images, movies, links, etc. can be implemented and registered on the VcsApp's FeatureInfo through a map plugin.

## View collection (configuration)

The class registry provides a list of view types.
The FeatureInfo collection contains instances of those types, configured within the FeatureInfo section of a context according to the View class options.
For example, a table view can be configured as follows:

```json
{
  "featureInfo": [
    {
      "type": "TableFeatureInfoView",
      "name": "filteredTable",
      "attributeKeys": ["gml:name", "creationDate"]
    }
  ]
}
```

This configuration uses the pre-registered class `TableFeatureInfoView` and specifies which attribute keys are rendered on the table.
Whenever the context is loaded, this information is parsed and added to the FeatureInfo collection.

On a layer properties bag, this FeatureInfo definition can be assigned referencing it by its name, e.g.:

```json
{
  "layers": [
    {
      "name": "buildings",
      "type": "CesiumTilesetLayer",
      "url": "...",
      "properties": {
        "featureInfo": "filteredTable"
      }
    }
  ]
}
```

If a feature of this layer is clicked by a user or selected via FeatureInfo's API, the property is evaluated and the corresponding FeatureInfo view window is opened.

## Attribute Key Value Mapping & Filtering

[AbstractFeatureInfoView](../src/featureInfo/abstractFeatureInfoView.js) provides mapping options for attribute keys and values.
Mappings have to be defined as key-value pairs:

- key mapping: a pair of old and new attribute key (`Object<string, string>`)
- value mapping: a nested object with key, old value and new value (`Object<string,Object<string, string>>`) or an object with template strings (`Object<string, string>`).
- filters: a list of keys to filter attributes for.

> Mapping values can be [i18n](./INTERNATIONALIZATION.md), template or other strings.
> All attribute keys and values are translated, if a corresponding i18n entry is available.
> If a template is used on value mapping, `${value}` is replaced by the attribute value.

Example:

```json
{
  "type": "TableFeatureInfoView",
  "name": "tableAll",
  "keyMapping": {
    "roofType": "myKeyMappingRoofType",
    "function": "codeLists.keys.function"
  },
  "valueMapping": {
    "roofType": "codeLists.values.roofType.${value}",
    "function": {
      "1000": "codeLists.values.function.1000",
      "1111": "myValueMapping1111"
    }
  },
  "attributeKeys": ["function", "roofType"]
}
```

Example for corresponding code list:

```json
{
  "i18n": [
    {
      "en": {
        "codeLists": {
          "keys": {
            "roofType": "roof type",
            "function": "building function"
          },
          "values": {
            "roofType": {
              "1000": "flat roof",
              "1010": "monopitch roof"
            },
            "function": {
              "1111": "house"
            }
          }
        }
      }
    }
  ]
}
```

### Nested Keys

Nested keys can pose a problem for mappings & filtering. The following rules should
be taken into account:

**Filtering**:

- To filter for nested keys, use `.` as a separator
- Parents of child filters, will be present (although filtered). Thus, filtering for `foo.bar`,
  will recreate `foo` with just the `bar` property (if present) _or an empty foo_ if not
  present.
- Children of parent filters will be passed as reference.
- To filter for _top level_ keys which contain a `.`, use the key name as a string literal, e.g.
  `foo.bar` will filter for the `foo.bar` property or the nested property `bar` on the `foo` object
- Filtering for nested properties with a `.` in their key _is not possible_.

**Key Mapping**:

- To map nested keys, use `.` as a separator.
- All key mapping _are applied to the top level_. Mapping `foo.bar` to `foo.baz` will
  not replace the `bar` key on the `foo` object, but create the `foo.baz` top level key.
- To map for _top level_ keys which contain a `.`, use the key name as a string literal, e.g.
  `foo.bar` will map the `foo.bar` key or the nested `bar` key on the `foo` object
- Mapping for nested keys with a `.` _is not possible_.

**Value Mapping**

- To map nested values, use `.` as a separator.
- To map for _top level_ values which contain a `.` in their key, use the key name as a string literal, e.g.
  `foo.bar` will map the `foo.bar` key or the nested `bar` key on the `foo` object
- Mapping for nested values with a `.` in their key _is not possible_.
