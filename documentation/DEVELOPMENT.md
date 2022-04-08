
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

To develop @vcmap/core and @vcsuite/ui-components at the same time, they can be integrated using `npm link`

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
