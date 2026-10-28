# VC Map Plugin Project Selector

This is a plugin to select and load `Projects` and `VcsModules`.

## configuration

You can add projects or modules and define the startup behavior of the plugin:

### ProjectSelectorConfig

| Property          | Type                     | default       | Description                                 |
| ----------------- | ------------------------ | ------------- | ------------------------------------------- |
| selected          | string                   | 'VC Map Base' | selected project on startup                 |
| selectedModules   | string[]                 | []            | selected modules on startup                 |
| open              | boolean                  | false         | open plugin on startup                      |
| projects          | Array<ProjectOptions>    | []            |                                             |
| modules           | Array<string>            | []            | list of config urls                         |
| additionalModules | Record<string, string[]> | {}            | child config urls keyed by parent module ID |

When a parent module loads, its `additionalModules` are loaded with it. They are removed before the parent is unloaded. Keys must match the parent config's `_id`; values are URLs to child module configs:

```json
{
  "additionalModules": {
    "dev": ["config/dev/geojson.config.json", "config/dev/i3s.config.json"]
  }
}
```

### ProjectOptions

| Property    | Type          | Description                |
| ----------- | ------------- | -------------------------- |
| name        | string        | name of the project        |
| description | string        | description of the project |
| modules     | Array<string> | list of config urls        |
