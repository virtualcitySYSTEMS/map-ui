# Initialize a VC Map Application

## index.html

The starting page of a VC Map application is per default the `index.html`.
It defines the `<head>`, `body` and loading `<style>` of the application.
It also loads the starting script, which initializes the VcsApp.

## start.js

The `start.js` calls a method which creates a new `VcsApp` instance.
You have two different options provided by the following methods:

- [initAppFromAppConfig](#initappfromappconfig)
- [initAppFromModule](#initappfromcontext)

### initAppFromAppConfig

This approach is for a modular loading of configs in a predefined order.
You have to provide a so called `app.config.json`, which defines a set of config urls to be loaded.
Each configuration file specified is fetched and the instantiated context is added to the VcsApp.

#### app.config.json

```json
{
  "modules": ["config/www.config.json", "config/codes.config.json"]
}
```

#### start.js

```js
import { initAppFromAppConfig } from '@vcmap/ui';

initAppFromAppConfig('#app', 'app.config.json');
```

> The order of configs is important, because map objects can be overwritten by other definitions specified in a context loaded afterwards.

### initAppFromModule

The second option is to load only one single config. In this case the complete application is defined in this single file.
Other configs cannot be referenced.

#### config.json

```json
{
  "mapcontainer": "vcs_map_container",
  "startingViewpointName": "berlin",
  "startingMapName": "cesium",
  "projection": {
    "epsg": "25833",
    "proj4": "+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs"
  },
  "styles": [...],
  "maps": [...],
  "layers": [...],
  "viewpoints": [...],
  "contentTree": [...],
  "obliqueCollections": [...],
  "plugins": [...]
}
```

#### start.js

```js
import { initAppFromModule } from '@vcmap/ui';

initAppFromModule('#app', 'config.json');
```
