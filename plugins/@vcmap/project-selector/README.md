# VC Map Plugin Project Selector

This is a plugin to select and load `Projects` and `VcsModules`.

## configuration

You can add projects or modules and define the startup behavior of the plugin:

### ProjectSelectorConfig
| Property        | Type                  | default       | Description                 |
|-----------------|-----------------------|---------------|-----------------------------|
| selected        | string                | 'VC Map Base' | selected project on startup |
| selectedModules | string[]              | []            | selected modules on startup |
| open            | boolean               | false         | open plugin on startup      |
| projects        | Array<ProjectOptions> | []            |                             |
| modules         | Array<string>         | []            | list of config urls         |

### ProjectOptions
| Property    | Type          | Description                |
|-------------|---------------|----------------------------|
| name        | string        | name of the project        |
| description | string        | description of the project |
| modules     | Array<string> | list of config urls        |
