# Search

Search API defines a [SearchImplementation](#SearchImplementation) interface and a [ResultItem](#ResultItem) interface.
Plugins implementing those interfaces can be registered and will then be used by the Search Bar of the Map UI.

## Search Bar

The Search Bar is located on the right side of the Navbar and can be activated via its button.
Search bar offers an input field and renders a list of result items. If result items contain feature, those are visualized within the map.
After a successful search, the map zooms to the layer extent, if result features are available.
Depending on the registered search plugins, the search bar can offer autocomplete.

## SearchImplementation

Search plugins must obey the interface defined as:

```js
/**
 * @interface SearchImpl
 * @property {string} name - Name of the implementation. Must be unique, best practice is to prefix with your plugin name to ensure uniqueness or use a uuid.
 * @property {function(q:string):Array<ResultItem>} search
 * @property {function(q:string):Array<string>} [suggest] - optional, provides suggestions for autocomplete.
 * @property{function():void} abort - should abort any ongoing requests to search or suggest without throwing an error
 * @property {function():void} destroy
 */
```

Each implementation must provide a search function. The suggest function for autocomplete is optional.
On adding an implementation to the app, an owner is required.
By providing an owner (name of the plugin) the app can remove implementations, if a plugin is unloaded.

> Name of SearchImpl's must be unique _to the application_. Best practice is to prefix with your plugin name to ensure uniqueness or use a uuid.

Example for adding a search implementation within an `index.js` of a plugin:

```js
import { version, name } from './package.json';
import MySearchImplementation from './mySearchImplemenation.js';

/**
 * @param {Object} config - the configuration of this plugin instance, passed in from the app.
 * @returns {import("@vcmap/ui/src/vcsUiApp").VcsPlugin<T>}
 * @template {Object} T
 * @template {Object} S
 */
export default function SearchPlugin(config) {
  return {
    _instance: null,
    _app: null,
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    /**
     * @param {import("@vcmap/ui").VcsUiApp} vcsUiApp
     */
    initialize(vcsUiApp) {
      this._instance = new MySearchImplementation(config, vcsUiApp);
      this._app = vcsUiApp;
      vcsUiApp.search.add(this._instance, name);
    },
  };
}
```

## ResultItem

Each search plugin can define its own result item, which must comply with the following interface:

```js
/**
 * A readonly rendering interface of a ResultItem.
 * A ResultItem must provide either a feature, a clicked handler or both.
 * @typedef {Object} ResultItem
 * @property {string} title
 * @property {string} [icon] An optional icon
 * @property {Array<VcsAction>} [actions]
 * @property {function():Promise<void>} [clicked] Obligatory, if no feature is provided. Can overwrite default zoom to feature behaviour.
 * @property {import("ol").Feature|undefined} [feature] If a feature (in web mercator) is provided, the feature is added to the result layer and search zooms to the layer's extent. Default clicked handler is zoom to feature, highlight feature and select feature, if feature has a FeatureInfoView.
 */
```

If a feature is provided, the Search API adds a default click handler.
Features must provide geometry in EPSG:3857 (web mercator).
This default click handler zooms to the feature.
If the feature has a FeatureInfoView (see [FeatureInfo](FEATURE_INFO.md)), the feature is selected and the corresponding FeatureInfoView is opened.

Example for a function creating a feature result item with FeatureInfoView:

```js
/**
 *
 * @param {import("ol").Feature} feature
 * @returns {ResultItem}
 */
function createFeatureResultItem(feature) {
  const title = feature.getProperty('title');
  const featureInfoView = new BalloonFeatureInfoView({
    name: 'SampleBalloon',
    title,
  });
  feature[featureInfoViewSymbol] = featureInfoView;

  return {
    title,
    feature,
  };
}
```

You can overwrite the default clicked handler for feature result items, if necessary.
If no feature is provided, a clicked handler is mandatory.

## Search API

All registered implementations are stored in an indexed collection.
The `search` function iterates over all registered implementations and calls their search function.
After resolving all promises invalid result items are filtered, default clicked handler for feature items are added, features are added to the result layer and the `resultsChanged` event is raised.
The function returns a flat array of result items, which is also stored on the search instance and accessible by its readonly getter `currentResults`.

```js
const resultItems = await app.search.search('Berlin');

// via getter
const resultItems = app.search.currentResults;

// listening to resultsChanged event
app.search.resultsChanged.addEventListener((newResults) =>
  console.log(newResults),
);
```

The suggest function iterates over all registered implementations providing a suggest function and returns a flat array of suggestions for autocomplete.
Suggest must only return an array of strings.

```js
const suggestions = await app.search.suggest('Berlin');
```

Before a new search or suggest request is done, ongoing requests are aborted, if search implementations provide an abort method.
The abort method of implementations should abort any ongoing requests to search or suggest without throwing an error.
You can use [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) to implement abort in a search implementation:

```js
/**
 * @class
 * @implements {SearchImpl}
 */
class MySearchImplementation {
  /**
   * @param {NominatimSearchOptions} options
   * @param {import("@vcmap/ui").VcsUiApp} app
   */
  constructor(options, app) {
    // ...

    /**
     * @type {AbortController}
     * @private
     */
    this._controller = new AbortController();
  }

  /**
   * @param {string} q - search value
   * @returns {Array<ResultItem>}
   */
  async search(q) {
    // ...

    const { signal } = this._controller.signal;
    const response = await fetch(url, { signal });
    const results = await response.json();
    // return search results
  }

  abort() {
    this._controller.abort();
  }
}
```

Clearing empties the currentResults array and removes all features from the result layer.
The `resultsChanged` event is raised afterward.

```js
app.search.clearResults();

app.search.resultsChanged.addEventListener((results) => {
  // returns an empty array
});
```
