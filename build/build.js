import path from 'path';
import fs from 'fs';
import { build } from 'vite';
import { v4 as uuid } from 'uuid';

import rollupPluginStripPragma from 'rollup-plugin-strip-pragma';
import vcsOl from '@vcmap/rollup-plugin-vcs-ol';

import generateOLLib from './generateOLLib.js';
import buildCesium from './buildCesium.js';
import {
  buildLibrary,
  getFileMd5,
  getFilesInDirectory,
  libraries,
  writeRewrittenFile,
} from './buildHelpers.js';

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
    '@vcmap-cesium/engine': {
      entry: path.join('lib', 'cesium.js'),
      rollupOptions: {
        plugins: [
          rollupPluginStripPragma({
            pragmas: ['debug'],
          }),
        ],
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
                return source.replace(
                  '/node_modules/@vcmap-cesium/engine/Build/',
                  './assets/cesium/',
                );
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
  Object.entries(libraryBuildOptions).forEach(([key, value]) => {
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

/** Cleaning/recreating Dist Folder */
if (await fs.existsSync(path.join(process.cwd(), 'dist'))) {
  await fs.promises.rm(path.join(process.cwd(), 'dist'), { recursive: true });
}
const assetsFolder = path.join(process.cwd(), 'dist', 'assets');
await fs.promises.mkdir(assetsFolder, { recursive: true });

/**
 * Prepare and Copy Public folder to dist Folder. This Process will also hash the static files using a MD5 File hash.
 * The renamed fileNames will be saved in the hashedPublicFiles Map. This can be used later to rewrite references
 * to the public assets to the correct new fileName.
 */

const publicFolder = path.join(process.cwd(), 'public');
const publicAssetsFolder = path.join(process.cwd(), 'public', 'assets');
const fileTypesToHash = ['.png', '.css', '.svg', '.woff2'];
/**
 * we exclude the materialDesignIcons font because we do not want to also rewrite the materialDesignIcons.css file.
 * The .woff2 is loaded with the materialDesignIcons Version number as a query parameter. So this also makes sure,
 * that the browser can cache the file.
 */
const filesToExclude = [
  path.join(
    'assets',
    '@mdi',
    'font',
    'fonts',
    'materialdesignicons-webfont.woff2',
  ),
];
const hashedPublicFiles = new Map();
const filesToCopy = new Map();
// eslint-disable-next-line no-restricted-syntax
for await (const filePath of getFilesInDirectory(publicAssetsFolder)) {
  const fileType = path.extname(filePath);
  const relativePath = path.relative(publicFolder, filePath);
  const relativePathInDist = path.relative(publicAssetsFolder, filePath);
  if (
    fileTypesToHash.includes(fileType) &&
    !filesToExclude.includes(relativePath)
  ) {
    const fileHash = await getFileMd5(filePath);
    const hashedFileUrl = path.posix.join(
      ...path.dirname(relativePathInDist).split(path.sep),
      `${path.basename(filePath, fileType)}.${fileHash.slice(0, 6)}${fileType}`,
    );
    hashedPublicFiles.set(
      path.posix.join(...relativePath.split(path.sep)),
      hashedFileUrl,
    );
    const newFilePath = path.join(
      assetsFolder,
      path.dirname(relativePathInDist),
      `${path.basename(relativePath, fileType)}.${fileHash.slice(
        0,
        6,
      )}${fileType}`,
    );
    filesToCopy.set(filePath, newFilePath);
  } else {
    const newFilePath = path.join(assetsFolder, relativePathInDist);
    filesToCopy.set(filePath, newFilePath);
  }
}
// eslint-disable-next-line no-restricted-syntax
for await (const [originalFilePath, newFilePath] of filesToCopy) {
  await fs.promises.cp(originalFilePath, newFilePath);
}

console.log('Building app');
const buildoutput = await build({
  configFile: './build/commonViteConfig.js',
  base: './',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    write: false,
    modulePreload: false,
    emptyOutDir: true,
    rollupOptions: {
      external: Object.keys(libraries),
      output: {
        paths: libraryPaths,
      },
    },
  },
});

/**
 * Building the Main entrypoint (index.html + index.js)
 * This will ensure that all references to public assets will be rewritten to the hashed filename
 */
await Promise.all(
  buildoutput.output?.map((output) => {
    if (output.type === 'asset') {
      const { source, fileName } = output;
      // remove loading of materialdesignicons from index.html, we will later inject this in the ui.js
      const fileContent = source.replace(
        /<link[^>]*href=".*materialdesignicons\.min\.css"[^>]*(>[^<]*<\/link>|\/>)/,
        '',
      );
      return writeRewrittenFile(
        path.join(process.cwd(), 'dist', fileName),
        fileContent,
        hashedPublicFiles,
        'assets',
      );
    }
    if (output.type === 'chunk') {
      const { code, fileName } = output;
      return writeRewrittenFile(
        path.join(process.cwd(), 'dist', fileName),
        code,
        hashedPublicFiles,
        'assets',
      );
    }
    return undefined;
  }),
);

/**
 * Building the Libraries, (vue, vuetify, openlayers, cesium, core, and ui). This will build one hashed library.hash.js
 * file and a second one library.js which will reexport all ES6 Modules. All references to these librarys will be
 * set as externals while building these libraries or later the plugins.
 */
console.log('Building Libraries');
await Promise.all(
  Object.entries(libraryBuildOptions).map(async ([key, value]) => {
    console.log('Building Library: ', key);
    const external = Object.keys(libraryBuildOptions).filter((library) => {
      return key !== library;
    });
    const output = {
      ...value.rollupOptions?.output,
      paths: libraryPaths,
    };
    const libraryConfig = {
      configFile: './build/commonViteConfig.js',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      build: {
        write: false,
        emptyOutDir: false,
        lib: {
          entry: path.resolve(process.cwd(), value.entry),
          formats: ['es'],
          fileName: `${value.lib}.${value.hash}`,
        },
        rollupOptions: {
          ...value.rollupOptions,
          output,
          external,
        },
      },
    };
    await buildLibrary(
      libraryConfig,
      'assets',
      value.lib,
      value.hash,
      false,
      hashedPublicFiles,
    );
    console.log('Building Library Entry: ', key);

    const libraryEntryConfig = {
      configFile: false,
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      build: {
        emptyOutDir: false,
        copyPublicDir: false,
        lib: {
          entry: path.resolve(process.cwd(), value.libraryEntry || value.entry),
          formats: ['es'],
          fileName: () => {
            return `assets/${value.lib}.js`;
          },
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
  }),
);
/**
 * Copy Cesium Static Assets to the dist/assets folder
 */
await buildCesium();
console.log('Finished Building vcMap');
