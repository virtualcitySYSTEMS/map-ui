# VC Map

### Dev Tipps
- In Webstorm: select the `@vcmap/core` package, right click and check `Include JavaScript Files` to jump to code instead of index.d.ts.

# VC Map plugins

- all plugins must provide:
  - `package.json` with name, description, version, vcMapVersion, author and dependencies
  - `config.json` with default parameters
  - `README.md` describing the plugins capabilities and usage
  - `index.js` or another entry point
  - `component(s)` (optionally)
- plugin names are defined by the plugin's package name and therefore must obey npm [package name guidelines](https://docs.npmjs.com/package-name-guidelines):
  - choose a name that
    - is unique
    - is descriptive
    - is lowercase
    - is uri encode-able
    - doesn't start with `.`, `_` or a digit
    - doesn't contain white spaces or any special characters like `~\'!()*"`
  - do not use scope `@vcmap`, since it is only to be used by official plugins provided by virtual city systems
- plugin dependencies have to be defined in the `package.json`
(DO NOT INSTALL the dependencies in the plugin folder! The build process will take care of your defined dependencies.)
  - `dependency`: all plugin specific dependencies NOT provided by the VC Map
  - `peerDependency`: dependencies provided by the VC Map, e.g. `@vcmap/core` or `vcmap/ui` (see [lib folder](./lib) for an extensive list)
  - `devDependency`: all dependencies only required for development, e.g. `eslint` or `vite`

