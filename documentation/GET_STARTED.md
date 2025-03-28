# Getting Started

## Requirements

- Node 16
- Npm 8

## Setup

Run the following scripts using `npm run` to setup your development environment.

- `start` serves a development server at http://localhost:8080. By default, the `app.config.json` is used to start the
  map. You can provide alternative `--module`s if you wish. `npm start -- --host -- --module "config/www.config.json" --module "config/dev.config.json"`
  will load the map with the above two modules loaded.
- `lint` runs _eslint_ for linting.
- `build` runs a build script, builds all javascript libraries to the `dist` folder. This is done for publishing the
  @vcmap/ui npm package.
- `build-preview` builds all javascript libraries including all plugins to the dist folder.
- `preview` serves the content of the `dist` folder at http://localhost:4173. Can be used to check the `build` application.
  Don't forget to run `build` and `build-preview` before using the preview command!
  You can provide a `plugin-regsitry` (e.g. a VC Publisher) from which to pull plugins instead
  of using the currently built ones. `npm run preview -- --host -- --plugin-registry http://localhost:3000` will
  pull plugins from a publisher running locally.
- `install-plugins` to integrate externally managed and developed plugins, use the `plugins/package.json` and this script to
  install them.

## NPM Link

Before linking a package, delete the vitejs dependency Cache in `node_modules/.vite/`. Otherwise vitejs will still use
the optimized dependency

To develop @vcmap/core at the same time, you can integrate it using `npm link`.

- call `npm link` in the @vcmap/core folder
- call `npm link @vcmap/core` in the @vcmap/ui folder

To develop @vcmap/core and @vcmap/cesium at the same time use.

- prepare @vcmap/cesium
  - install dependencies `npm i`
  - build cesium `npm run release`
  - call `npm link` in the @vcmap/cesium folder
- prepare @vcmap/core
  - install dependencies `npm i`
  - call `npm link`
- call `npm link @vcmap/core @vcmap/cesium` in the @vcmap/ui folder

For Source direct debuggable openlayers Source Code change the `vite.config.js` file and replace the optimizeDeps with the
following snippet:

```json
    optimizeDeps: {
      exclude: [
        'ol',
      ],
      include: [
        'ol > pbf',
      ],
    },
```

Or you can set the convenient env variable `NO_OPTIMIZED_CORE environment variable to not
optimize `@vcmap/core`.

```bash
NO_OPTIMIZED_CORE=true npm start
```

## Setting up IDE

Make sure ESlint and prettier are activated

### Webstorm

- eslint

```
Settings: Languages & Frameworks/JavaScript/CodeQuality Tools/ESLint
- set Eslint configuration: Automatic EsLint Configuration
```

- prettier

```
Settings: Languages & Frameworks/JavaScript/Prettier
- set Prettier configuration: Automatic Prettier Configuration
```

- select the `node_modules/@vcmap/core` package, right click and check `Include JavaScript Files` to jump
  to code instead of index.d.ts.

### VS Code

- eslint:

```
Side Panel: Extensions > Search for EsLint > Install
```

- prettier

```
Side Panel: Extensions > Search for Prettier > Install
Settings: Default Formatter: Prettier
```

> FormatOnSave does not work for Vue files in VS Code. Use shortcut "shift-alt-f" instead.

## Testing

To run the whole test Suite call `npm run test`; see [vitest](https://vitest.dev/) for API and testing documentation.

## Use of JSDoc

We use [jsdoc](https://jsdoc.app/) for a) documentation of our public API and b) for typechecking our
JS code using the [typescript compiler](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html).
To enforce these rules we use the [eslint jsdoc plugin](https://github.com/gajus/eslint-plugin-jsdoc#readme).

- You should add jsdoc doclets to:
  - Classes, function, enums and module scope constants
  - Class properties
  - Class methods
- You should add generic types to generics, such as `Array`, `Object`, `Promise` etc. (`Array<string>`).
- You should add _access_ tags to `@private` or `@protected` methods and properties. `@public` is implied
  for the rest.
- You should tag `getters` with `@type` and not `@returns`.
- You should denote properties which only have a `getter` with `@readonly`.
- Exporting Symbols:
  - All exported functions/Classes will be added to the index.js in the build step.
  - use @private to not add an exported function the index.js
- You should use the preferred tags outlined by [eslint jsdpc plugin](https://github.com/gajus/eslint-plugin-jsdoc#default-preferred-aliases)
  , with the following exceptions: `@extends` over `@augments` and `@const` over `@constant`.
- You should type inherited methods for typescript _and add `@inheritDoc`_ to use the
  parents description in the docs (if they are the same). This makes it easier to maintain descriptions
  and keeps them consistent.

## Overview UI Elements

![UI Elements Overview](UI_OVERVIEW.svg)

> RED: ButtonLocation;
> GREEN: WindowSlot;
> ORANGE: Toolbox;
> BLACK: other elements (not complete)

## Documentation

1. [Actions](ACTIONS.md)
2. [Attributions](ATTRIBUTIONS.md)
3. [Buttons](BUTTONS.md)
4. [Callbacks](CALLBACKS.md)
5. [Categories](CATEGORIES.md)
6. [Collections](COLLECTIONS.md)
7. [Content Tree](CONTENT_TREE.md)
8. [Context Menu](CONTEXT_MENU.md)
9. [Feature Info](FEATURE_INFO.md)
10. [Help](HELP.md)
11. [Init](INIT.md)
12. [Internationalization](INTERNATIONALIZATION.md)
13. [Legend](LEGEND.md)
14. [Notifier](NOTIFIER.md)
15. [Search](SEARCH.md)
16. [State](STATE.md)
17. [Toolbox](TOOLBOX.md)
18. [UI Theming](UI_THEMING.md)
19. [UI Components & Styles](UI_COMPONENTS_STYLES.md)
20. [UI Configuration](UI_CONFIG.md)
21. [Windows](WINDOWS.md)
