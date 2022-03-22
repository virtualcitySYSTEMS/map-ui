# VC Map Plugin Project Selector

This is a plugin to select and load `VCMapProjects` and `VCMapContexts`.

## configuration

You can add projects or contexts and define the startup behavior of the plugin:

### ProjectSelectorConfig
| Property         | Type                       | default       | Description                  |
|------------------|----------------------------|---------------|------------------------------|
| selected         | string                     | 'VC Map Base' | selected project on startup  |
| selectedContexts | string[]                   | []            | selected contexts on startup |
| projects         | Array<VCMapProjectOptions> | []            |                              |
| contexts         | Array<VCMapContextOptions> | []            |                              |

### VCMapProjectOptions
| Property    | Type                       | Description                |
|-------------|----------------------------|----------------------------|
| name        | string                     | name of the project        |
| description | string                     | description of the project |
| contexts    | Array<VCMapContextOptions> |                            |

### VCMapContextOptions
| Property    | Type   | Description                |
|-------------|--------|----------------------------|
| name        | string | name of the context        |
| description | string | description of the context |
| configUrl   | string | url to config.json         |
