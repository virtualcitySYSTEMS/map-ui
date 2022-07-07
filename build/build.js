import path from 'path';
import { build } from 'vite';
import { v4 as uuid } from 'uuid';
import rollupPluginStripPragma from 'rollup-plugin-strip-pragma';
import vcsOl from '@vcmap/rollup-plugin-vcs-ol';
import generateOLLib from './generateOLLib.js';
import buildCesium from './buildCesium.js';
import { buildLibrary, libraries } from './buildHelpers.js';

/**
 * @typedef {Object} LibraryBuildOption
 * @property {string} lib
 * @property {string} entry
 * @property {string} [libraryEntry]
 * @property {import("rollup").RollupOptions} [rollupOptions]
 */

/**
 * @returns {{ libraryBuildOptions: Object<string, LibraryBuildOption>, libraryPaths: Object<string, string> }}
 */
function hashLibraries() {
  /** @type {Object<string, LibraryBuildOption>} */
  const libraryBuildOptions = {
    vue: {
      entry: path.join('lib', 'vue.js'),
    },
    '@vcmap/cesium': {
      entry: path.join('lib', 'cesium.js'),
      rollupOptions: {
        plugins: [rollupPluginStripPragma({
          pragmas: ['debug'],
        })],
      },
    },
    ol: {
      entry: path.join('lib', 'olLib.js'),
      libraryEntry: path.join('lib', 'ol.js'), // openlayers special case, the entry to compile is the olLib, but the public entry must be ol.js
      rollupOptions: {
        output: {
          manualChunks: () => 'ol.js', // this is needed, otherwise vitejs will create multiple chunks for openlayers.
        },
      },
    },
    '@vcmap/core': {
      entry: path.join('lib', 'core.js'),
      rollupOptions: {
        plugins: [vcsOl()],
      },
    },
    '@vcmap/ui': {
      rollupOptions: {
        plugins: [
          vcsOl(),
          {
            transform(source, sid) {
              if (/src(\/|\\)setup.js/.test(sid)) {
                return source.replace('/node_modules/@vcmap/cesium/Source/', './assets/cesium/');
              }
              return source;
            },
          },
        ],
      },
      entry: path.join('lib', 'ui.js'),
    },
    'vuetify/lib': {
      entry: path.join('lib', 'vuetify.js'),
    },
  };

  const libraryPaths = {};
  Object.entries(libraryBuildOptions)
    .forEach(([key, value]) => {
      if (!libraries[key]) {
        throw new Error(`Trying to build unexported library ${key}`);
      }
      value.lib = libraries[key];
      value.hash = `${uuid().substring(0, 6)}`;
      libraryPaths[key] = `./${value.lib}.${value.hash}.js`;
      value.rollupOptions = value.rollupOptions ? value.rollupOptions : {};
    });

  return { libraryBuildOptions, libraryPaths };
}

const { libraryBuildOptions, libraryPaths } = hashLibraries();
console.log('Building ol dump file');
await generateOLLib();

console.log('Building app');
await build({
  configFile: './build/commonViteConfig.js',
  base: './',
  build: {
    minify: true,
    emptyOutDir: true,
    rollupOptions: {
      external: Object.keys(libraries),
      output: {
        paths: libraryPaths,
      },
    },
  },
});

console.log('Building Libraries');
await Promise.all(Object.entries(libraryBuildOptions).map(async ([key, value]) => {
  console.log('Building Library: ', key);
  const external = Object.keys(libraryBuildOptions).filter((library) => { return key !== library; });
  const output = {
    ...value.rollupOptions?.output,
    paths: libraryPaths,
  };
  const libraryConfig = {
    configFile: './build/commonViteConfig.js',
    esbuild: {
      minify: true,
    },
    build: {
      write: false,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(process.cwd(), value.entry),
        formats: ['es'],
        fileName: `assets/${value.lib}.${value.hash}`,
      },
      rollupOptions: {
        ...value.rollupOptions,
        output,
        external,
      },
    },
  };
  await buildLibrary(libraryConfig, 'assets', value.lib, value.hash);
  console.log('Building Library Entry: ', key);

  const libraryEntryConfig = {
    configFile: false,
    build: {
      emptyOutDir: false,
      lib: {
        entry: path.resolve(process.cwd(), value.libraryEntry || value.entry),
        formats: ['es'],
        fileName: () => { return `assets/${value.lib}.js`; },
      },
      rollupOptions: {
        ...value.rollupOptions,
        external: [key],
        output: {
          paths: libraryPaths,
        },
      },
    },
  };
  await build(libraryEntryConfig);
}));

await buildCesium();
console.log('Finished Building vcMap');
