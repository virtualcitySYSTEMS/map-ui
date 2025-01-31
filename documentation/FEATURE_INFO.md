# FeatureInfo

Map features have context specific information, which are made accessible on click by the FeatureInfo tool.
The VcsApp provides some view classes per default and an API to register custom ones.
On context level views can be configured and assigned to a layer.
Configuration is context-sensitive, which allows configuring different views on one layer in different contexts.

## FeatureInfo Tool

The FeatureInfo tool can be activated via a button within the toolbox or using its API.
Whenever the tool is active, FeatureInfo listens to clicks on features, highlights a selected feature and opens a FeatureInfo window, if configured.

If a cluster feature is clicked, the tool opens a window listing all features of the cluster.
Clicking a list item opens the FeatureInfo window of the corresponding feature.
List items of features not providing a FeatureInfo are disabled.

## View classes & class registry

FeatureInfo provides a class registry, where view classes can be registered.
A view class is registered by type and defines

- a Vue component rendering the feature's information (the actual view within the ui),
- additional options needed for the view,
- a logic which properties are passed to the Vue component and
- all options corresponding to the feature info window.

> With vue 3 it is important, that your VueComponent either defines a prop `attributes` or sets `inheritAttrs: false`.
>
> Explanation:
> The window manager v-binds all props of a window component per default.
> On your custom component they are either defined as props or passed on as attrs.
> On HTML Elements `attributes` is a readonly key, which cannot be set by vue.
> Hence, you need to prevent the binding of the `attributes` key on the HTML element either by defining a prop or disabling attrs inheritance.
> For more information see https://vuejs.org/guide/components/attrs#disabling-attribute-inheritance

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
   * @param {VcsUiApp} app
   * @param {import("@vcmap/core").Layer} layer
   * @returns {WindowComponentOptions}
   */
  getWindowComponentOptions(app, featureInfo, layer) {
    const options = super.getWindowComponentOptions(app, featureInfo, layer);
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
app.featureInfoClassRegistry.registerClass(
  app.dynamicContextId,
  MyNewFeatureInfoView.className,
  MyNewFeatureInfoView,
);
```

By passing a Vue Component to your view class constructor, you actually register a pair containing the API within the view class and the user interface within the vue component.
A couple of default views are already registered on the VcsApp:

| View class                                                                             | VueComponent                                                              | description                                                                |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [TableFeatureInfoView](../src/featureInfo/tableFeatureInfoView.js)                     | [TableComponent](../src/components/tables/VcsTable.vue)                   | A sortable table view showing key value pairs of feature properties.       |
| [IframeFeatureInfoView](../src/featureInfo/iframeFeatureInfoView.js)                   | [IframeComponent](../src/featureInfo/IframeComponent.vue)                 | An iframe view with templatable url.                                       |
| [IframeWmsFeatureInfoView](../src/featureInfo/iframeWmsFeatureInfoView.js)             | [IframeComponent](../src/featureInfo/IframeComponent.vue)                 | An iframe view for text/html feature info responses of WMS layer           |
| [BalloonFeatureInfoView](../src/featureInfo/balloonFeatureInfoView.js)                 | [BalloonComponent](../src/featureInfo/BalloonComponent.vue)               | A balloon view rendering feature properties.                               |
| [AddressBalloonFeatureInfoView](../src/featureInfo/addressBalloonFeatureInfoView.js)   | [AddressBalloonComponent](../src/featureInfo/AddressBalloonComponent.vue) | A balloon view rendering address information of a feature.                 |
| [MarkdownBalloonFeatureInfoView](../src/featureInfo/markdownBalloonFeatureInfoView.js) | Inline rendered markdown template as a balloon                            | A markdown based view, see [this section](#Markdown-Rendering) for details |
| [MarkdownFeatureInfoView](../src/featureInfo/markdownFeatureInfoView.js)               | Inline rendered markdown template                                         | A markdown based view, see [this section](#Markdown-Rendering) for details |

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

## Feature Info Title

The default title of a feature info window is the name of the clicked layer.
For balloons there is additionally a subtitle, which is set to the clicked feature's id.

Both, window and balloon title can be configured, though.

### Window Title

The window title can be configured via the window state. It supports strings, i18n keys or template strings using feature properties.
Here some examples:

- simple string

```json
{
  "type": "TitleFeatureInfoView",
  "name": "stringTitle",
  "window": {
    "state": {
      "headerTitle": "My Feature Info Title"
    }
  }
}
```

- i18n key

```json
{
  "type": "TitleFeatureInfoView",
  "name": "i18nTitle",
  "window": {
    "state": {
      "headerTitle": "myI18nEntry.featureInfo.title"
    }
  }
}
```

- template string

```json
{
  "type": "TitleFeatureInfoView",
  "name": "stringTitle",
  "window": {
    "state": {
      "headerTitle": "{{gml:name}}"
    }
  }
}
```

or multiple templates

```json
{
  "type": "TitleFeatureInfoView",
  "name": "stringTitle",
  "window": {
    "state": {
      "headerTitle": "{{layerName}}: {{gml:name}}"
    }
  }
}
```

- concatenated title using i18n and template

```json
{
  "type": "TitleFeatureInfoView",
  "name": "stringTitle",
  "window": {
    "state": {
      "headerTitle": ["myI18n.key", ": ", "{{gml:name}}"]
    }
  }
}
```

> For concatenating a title all kind of combinations (string, i18n, template) are possible. Be aware, that the window header space is limited!

### Balloon Title & Subtitle

The balloon title and subtitle are options of the [BalloonFeatureInfoView](../src/featureInfo/balloonFeatureInfoView.js).
It supports again strings and, i18n keys. Feature properties are also evaluated. In contrary to window title they must not be wrapped in template brackets!
A balloon with a string title and a feature property as subtitle would look like:

```json
{
  "type": "BalloonFeatureInfoView",
  "name": "genericBalloon",
  "title": "This is a Balloon Title",
  "subtitle": "olcs_altitudeMode"
}
```

> Do not use template brackets for balloon title or subtitle!

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

### Tags

The [AbstractFeatureInfoView](../src/featureInfo/abstractFeatureInfoView.js) provides another concept to render attribute values within a special HTML element tag.
The default tag is a `span` element within tables and `div` element for balloons.
The `tags` object within `FeatureInfoViewOptions` defines a key-value pair, where the value defines the tag type and its HTML options.
You can still use key and value mapping including template strings.

Supported tags are:

- [a](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a): anchor
- [audio](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio): embed audio
- [b](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b): bold text
- [i](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i): idiomatic text
- [iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe): embed iframe
- [img](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img): embed image
- [meter](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter): scalar value within known range
- [progress](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress): progress indicator
- [s](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s): strikethrough text
- [strong](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong): strong text
- [video](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video): embed video

If you like to render a specific attribute value as a link, you can configure for the corresponding attribute key an HTML anchor tag and its options:

```json
{
  "type": "TableFeatureInfoView",
  "name": "tableLink",
  "tags": {
    "gemeinde": {
      "tag": "a",
      "href": "https://de.wikipedia.org/wiki/${value}",
      "target": "_blank"
    }
  }
}
```

To render an image, simply define:

```json
{
  "type": "TableFeatureInfoView",
  "name": "tableLink",
  "tags": {
    "typ2": {
      "tag": "img",
      "src": "https://sgx.geodatenzentrum.de/wms_poi_open?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=heliports"
    }
  }
}
```

### Markdown Rendering

Markdown feature info views can render most markdown text, without special flavoring.
You can expand feature properties by wrapping them in two braces: `{{foo}}` would expand the
feature property `foo`. This also works for array accessors and nested properties, simply use
java script dot notation: `foo.bar` to access an object `{ foo: { bar: 'bar' } }` or brackets: `foo[0]` to access
an array `{ foo: ['bar'] }` where `foo["bar"]` is equivalent to `foo.bar`. Currently
only string and number properties are rendered correctly. Missing keys are rendered as an empty string `''`.

Alternatively, you can use [openlayers style expressions](https://openlayers.org/en/latest/apidoc/module-ol_style_expressions.html)
which evaluate to a string within
the expansion brackets, so `{{ ["round", ["get", "value"]] }}` would render the value
attribute rounded. Using the above property shorthand is equivalent to writing a `["get", ...keys]`
style expression. If writing expressions, you must use `"` for strings and not `'`, the expression within the brackets
must be JSON parsable (`{{ ['round', ['get', 'value]] }}` will not work).

The following example can illustrate this:

```markdown
# Title

- this is a listing
- with the {{ property }} "property"
- and the {{ missing }} missing property
- with image ![](https://vc.systems/images/{{logo}}.png)
- with video <video src=\"path/to/video.mp4\" width=\"{{ ["round", ["get", "videoWidth"]] }}\" height=\"240\" controls></video>
- with link [Link text Here](https://vc.systems/?id={{id}})
```

#### Conditional rendering

You can use conditional rendering to only render certain blocks, if
an ol style expression evaluates to a truthy value.
You can replace `$expression` with a property key or an ol style expression which
evaluates to a boolean. Using a property key is shorthand for the `["get", ...keys]`
same as with the `{{}}` property expansion. Statements can be nested. You
can use the following building blocks to manage conditional rendering:

- `{{#if $expression }}` is the beginning of a conditional block
- `{{elseif $expresson}}` alternate expression, can be placed within an if block
- `{{else}}` catch all if any of the previous conditions fail
- `{{/if}}` end clause of a conditional statement. Failing to place this, will break the template.

```markdown
# Title

{{#if property}}
{{#if headerProperty}}

### {{ headerProperty }}

{{/if}}
**property** is {{ property }}
{{elseif ["!", ["get", "otherProperty"]]}}
cannot find otherProperty in this obect
{{else}}
there are no properties i expected here.
{{/if}}
```

#### Iteration

You can iterate over `Array`s and `Object`s using the following syntax for arrays
`{{#each (value, index) in array}}{{value}}: {{index}}{{/each}}` and for objects
`{{#each (value, key, index) in object}}{{key}}: {{value}} ({{index}}){{/each}}`.
Where the `(value, key?, index?)` is the parameter list and will determine the
name of these values within the data context of the block. The object you are
accessing from the data can be shorthanded to its name (which in turn is equal
o the expression: `["get", "name"]`, or an openlayers expression same as with conditions.

You must provide an `item` parameter, `index` and `key` are optional.
Make sure to provide an item parameter name that does not potentially collide with a key
in your current contexts data, otherwise you cannot access it within the block.

```markdown
# List of stuff

- **key**: value
  {{#each (item) in arrayOfItems}}
  {{#each (subItemValue, key) in item}}
- **{{key}}**: {{subItemValue}}
  {{/each}}
  {{/each}}
```

Given an input of `[{ foo: 1 }, { foo: 2, bar: 3 }, { bar: 1}]` the above template would render:

```markdown
- **key**: value
- **foo**: 1
- **foo**: 2
- **bar**: 3
- **bar**: 1
```
