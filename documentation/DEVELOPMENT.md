
### Requirements
- Node 16
- Npm 8

### Setup
Run the following scripts using `npm run` to setup your development environment.
- `start` serves a development server at http://localhost:8080.
- `lint` runs _eslint_ for linting.
- `build` runs a build script, builds all javascript libraries to the `dist` folder. This is done for publishing the 
@vcmap/ui npm package.
- `build-preview` builds all javascript libraries including all plugins to the dist folder.
- `preview` serves the content of the `dist` folder at http://localhost:4173. Can be used to check the `build` application.
- `install-plugins` to integrate externally managed and developed plugins, use the `plugins/package.json` and this script to 
install them. 

### NPM Link

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
Or you can set the convenienct env variable `NO_OPTIMIZED_CORE environment variable to not
optimize `@vcmap/core`.
```bash
NO_OPTIMIZED_CORE=true npm start
```

### Setting up Webstorm
Make sure ESlint is activated
```
Settings: Languages & Frameworks/JavaScript/CodeQuality Tools/ESLint
- set Eslint configuration: Automatic EsLint Configuration
```
In Webstorm: select the `node_modules/@vcmap/core` package, right click and check `Include JavaScript Files` to jump
to code instead of index.d.ts.

### Testing
To run the whole test Suite call `npm run test`; see [vitest](https://vitest.dev/) for API and testing documentation.

### Use of JSDoc
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
