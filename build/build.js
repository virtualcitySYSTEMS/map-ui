import path from 'path';
import fs from 'fs';
import { readFile, writeFile } from 'node:fs/promises';
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
    vuetify: {
      entry: path.join('lib', 'vuetifyLib.js'),
      // vuetify special case, the entry to compile is the vuetifyLib, but the public entry must be vuetify.js
      // vuetifyLib will reexport the nested vuetify namespace as a flat namespace, so we can easily point all
      // nested namespaces to the vuetify entry file.
      libraryEntry: path.join('lib', 'vuetify.js'),
      rollupOptions: {
        output: {
          manualChunks: () => 'vuetify.js', // this is needed, otherwise vitejs will create multiple chunks.
        },
      },
    },
  };

  const libraryPaths = {};
  Object.entries(libraryBuildOptions).forEach(([key, value]) => {
    if (!libraries[key]) {
      throw new Error(`Trying to build unexported library ${key}`);
    }
    value.lib = libraries[key];
    value.hash = `${uuid().substring(0, 8)}`;
    libraryPaths[key] = `./${value.lib}-${value.hash}.js`;
    value.rollupOptions = value.rollupOptions ? value.rollupOptions : {};
  });

  // Handle extended Vuetify libraries
  Object.keys(libraries).forEach((key) => {
    if (!libraryPaths[key]) {
      if (key.startsWith('vuetify')) {
        libraryPaths[key] = libraryPaths.vuetify;
      }
      if (key.startsWith('@cesium')) {
        libraryPaths[key] = libraryPaths['@vcmap-cesium/engine'];
      }
    }
  });

  return { libraryBuildOptions, libraryPaths };
}

const { libraryBuildOptions, libraryPaths } = hashLibraries();
console.log('Building ol dump file');
await generateOLLib();

const distFolder = path.join(process.cwd(), 'dist');
const assetsFolder = path.join(distFolder, 'assets');

/** Cleaning/recreating Dist Folder */
if (await fs.existsSync(distFolder)) {
  await fs.promises.rm(distFolder, { recursive: true });
}
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
 *
 * we also exclude favicons from hashing, to just use the index.html as is.
 */
const filesToExclude = [
  path.join(
    'assets',
    '@mdi',
    'font',
    'fonts',
    'materialdesignicons-webfont.woff2',
  ),
  path.join('assets', 'favicon-4c4ce5df.svg'),
  path.join('assets', 'favicon-32-4c4ce5df.png'),
  path.join('assets', 'favicon-128-4c4ce5df.png'),
  path.join('assets', 'favicon-180-4c4ce5df.png'),
  path.join('assets', 'favicon-192-4c4ce5df.png'),
];
const hashedPublicFiles = new Map();
const filesToCopy = new Map();

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
      `${path.basename(filePath, fileType)}-${fileHash.slice(0, 8)}${fileType}`,
    );
    hashedPublicFiles.set(
      path.posix.join(...relativePath.split(path.sep)),
      hashedFileUrl,
    );
    const newFilePath = path.join(
      assetsFolder,
      path.dirname(relativePathInDist),
      `${path.basename(relativePath, fileType)}-${fileHash.slice(
        0,
        8,
      )}${fileType}`,
    );
    filesToCopy.set(filePath, newFilePath);
  } else {
    const newFilePath = path.join(assetsFolder, relativePathInDist);
    filesToCopy.set(filePath, newFilePath);
  }
}

for await (const [originalFilePath, newFilePath] of filesToCopy) {
  await fs.promises.cp(originalFilePath, newFilePath);
}

console.log('Building app');
let indexHTMLContent = await readFile('./index.html', { encoding: 'utf8' });
// remove mdi icons link, will be later loaded from the ui.js
indexHTMLContent = indexHTMLContent.replace(
  /<link[^>]*href=".*materialdesignicons\.min\.css"[^>]*>/,
  '',
);

// replace @vcmap/ui with './assets/ui.js' and outsource to start.js
// We do not want to have a script tag in the index.html, because of CSP Policies.
// see https://content-security-policy.com/unsafe-inline/
const scriptRegex = /<script type="module">([\s\S]*?)<\/script>/;
const match = indexHTMLContent.match(scriptRegex);
if (match && match[1]) {
  let scriptContent = match[1].trim();
  scriptContent = scriptContent.replace(/@vcmap\/ui/, './ui.js');
  await writeFile(path.join(assetsFolder, 'start.js'), scriptContent, {
    encoding: 'utf8',
  });
  indexHTMLContent = indexHTMLContent.replace(
    scriptRegex,
    '<script src="./assets/start.js" type="module"></script>',
  );
}
await writeFile(path.join(distFolder, 'index.html'), indexHTMLContent, {
  encoding: 'utf8',
});
const htaccessContent = `
    <FilesMatch "-[\\w\\d]{8}\\.(js|css)$">
        Header set Cache-Control "public, max-age=31540000, immutable"
    </FilesMatch>
    <FilesMatch "(index\\.html|start\\.js|ui\\.js|vue\\.js|vuetify\\.js|ol\\.js|cesium\\.js|core\\.js)$">
        Header set Cache-Control "no-store, max-age=0"
    </FilesMatch>
`;
await writeFile(path.join(distFolder, '.htaccess'), htaccessContent, {
  encoding: 'utf8',
});

/**
 * Building the Libraries, (vue, vuetify, openlayers, cesium, core, and ui). This will build one hashed library.hash.js
 * file and a second one library.js which will reexport all ES6 Modules. All references to these librarys will be
 * set as externals while building these libraries or later the plugins.
 */
console.log('Building Libraries');
await Promise.all(
  Object.entries(libraryBuildOptions).map(async ([key, value]) => {
    console.log('Building Library: ', key);
    const external = Object.keys(libraries).filter((library) => {
      return key !== library && !library.startsWith(key);
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
          fileName: `${value.lib}-${value.hash}`,
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
