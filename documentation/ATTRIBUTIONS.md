# Attributions

Attributions are listed within the VC Map's footer. The component has an overflow mechanism and a button at the right end to open an attributions window.
The attributions window lists entries per layer, whereas in the footer attributions with same provider are merged.
Only attributions of active objects are shown.

## Configuration

Attributions can be added to maps, layers and oblique collections.
An attributions entry within the objects property bag, can be either an object for a single attribution or an array to store multiple attributions.
The entry options are defined as:

```js
/**
 * @typedef {Object} AttributionOptions
 * @property {string} provider - name of the data provider
 * @property {number} [year] - year of dataset
 * @property {URL} url - link to data provider
 * @property {string} [icon] - provider logo. Can be an URL or a custom icon, see [CUSTOM_ICONS.md](./CUSTOM_ICONS.md)
 */
```

### Map Example

```json
{
  "type": "ObliqueMap",
  "name": "Oblique Map",
  "defaultCollectionName": "Schrägluftbilder 2020",
  "properties": {
    "attributions": [
      {
        "provider": "Open Layers",
        "url": "https://openlayers.org/"
      },
      {
        "provider": "VCS",
        "url": "https://vc.systems/en/"
      }
    ]
  }
}
```

### Layer Example

```json
{
  "type": "CesiumTilesetLayer",
  "name": "mesh_surface",
  "url": "https://a.3d.blc.shc.eu/WAB/base_layer/cesium_mesh_2020/",
  "activeOnStartup": false,
  "allowPicking": false,
  "screenSpaceError": 16,
  "screenSpaceErrorMobile": 32,
  "tilesetOptions": {
    "skipLevelOfDetail": true
  },
  "exclusiveGroups": ["3D", "terrain"],
  "properties": {
    "title": "3D-Mesh 2020",
    "attributions": {
      "provider": "Berlin Partner für Wirtschaft und Technologie",
      "url": "https://www.berlin-partner.de",
      "year": "2020"
    }
  }
}
```

### Oblique Collection Example

```json
{
  "name": "Schrägluftbilder 2020",
  "activeOnStartup": true,
  "dataSets": [
    {
      "url": "https://a.3d.blc.shc.eu/WAB/base_layer/obliques_2020/image_tiled.json",
      "terrainProvider": {
        "url": "https://www.virtualcitymap.de/datasource-data/globalterrain_5_9"
      },
      "projection": {
        "epsg": "25833",
        "proj4": "+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs"
      }
    }
  ],
  "maxZoom": 7,
  "minZoom": 0,
  "properties": {
    "attributions": {
      "provider": "Berlin Partner für Wirtschaft und Technologie",
      "url": "https://www.berlin-partner.de",
      "year": "2020"
    }
  }
}
```
