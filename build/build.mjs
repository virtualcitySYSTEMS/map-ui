import { v4 as uuid } from 'uuid';
import path from 'path';
import { build } from 'vite';
import vcsOl from '@vcmap/rollup-plugin-vcs-ol';
import fs from 'fs';
import generateOLLib from './generateOLLib.mjs';
import buildCesium from './buildCesium.mjs';

/**
 * builds the given configuration and writes the library to the provided outputFolder. If the build contains css a .css
 * file will also be written and injected into the .js file.
 * @param {Object} libraryConfig Vitejs InlineConfig
 * @param {string} outputFolder
 * @param {string} library
 * @param {string} hash
 * @returns {Promise<void>}
 */
async function buildLibrary(libraryConfig, outputFolder, library, hash) {
  const cssInjectorCode = `
function loadCss(href) {
  return new Promise((resolve, reject) => {
    const elem = document.createElement('link');
    elem.rel = 'stylesheet';
    elem.href = href;
    elem.defer = false;
    elem.async = false;
    elem.onload = resolve;
    elem.onerror = reject;
    document.head.appendChild(elem);
  });
}`;
  const libraryBuilds = await build(libraryConfig);
  const addedHash = hash ? `.${hash}` : '';
  let css = false;
  if (libraryBuilds[0].output[1] && libraryBuilds[0].output[1].type === 'asset') {
    css = true;
    await fs.promises.writeFile(path.join(process.cwd(), 'dist', `${outputFolder}/${library}${addedHash}.css`), libraryBuilds[0].output[1].source);
  }
  if (libraryBuilds[0].output[0] && libraryBuilds[0].output[0].type === 'chunk') {
    let code = css ? `${cssInjectorCode} await loadCss('./${outputFolder}/${library}${addedHash}.css');` : '';
    code += libraryBuilds[0].output[0].code;
    await fs.promises.writeFile(path.join(process.cwd(), 'dist', outputFolder, `${library}${addedHash}.js`), code);
  }
}


const libraries = {
  vue: {
    lib: 'vue',
    entry: path.join('lib', 'vue.js'),
  },
  '@vue/composition-api': {
    lib: 'vue-composition-api',
    entry: path.join('lib', 'vue-composition-api.js'),
  },
  '@vcmap/cesium': {
    lib: 'cesium',
    entry: path.join('lib', 'cesium.js'),
  },
  ol: {
    lib: 'ol',
    entry: path.join('lib', 'olLib.js'),
    libraryEntry: path.join('lib', 'ol.js'), // openlayers special case, the entry to compile is the olLib, but the public entry must be ol.js
    rollupOptions: {
      output: {
        manualChunks: () => 'ol.js', // this is needed, otherwise vitejs will create multiple chunks for openlayers.
      },
    },
  },
  '@vcmap/core': {
    lib: 'core',
    entry: path.join('lib', 'core.js'),
    rollupOptions: {
      plugins: [vcsOl()],
    },
  },
  '@vcmap/ui': {
    lib: 'ui',
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
    lib: 'vuetify',
    entry: path.join('lib', 'vuetify.js'),
  },
  '@vcsuite/ui-components': {
    lib: 'uicomponents',
    entry: path.join('lib', 'uicomponents.js'),
  },
};

const plugins = ['test', 'example', 'categoryTest', 'buttonExamples', '@vcmap/pluginExample', '@vcmap/theme-changer'];

const libraryPaths = {};
const pluginLibraryPaths = {};
Object.entries(libraries).forEach(([key, value]) => {
  value.hash = `${uuid().substring(0, 6)}`;
  libraryPaths[key] = `./${value.lib}.${value.hash}.js`;
  pluginLibraryPaths[key] = `../../assets/${value.lib}.js`;
  value.rollupOptions = value.rollupOptions ? value.rollupOptions : {};
});

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
await Promise.all(Object.entries(libraries).map(async ([key, value]) => {
  console.log('Building Library: ', key);
  const external = Object.keys(libraries).filter((library) => { return key !== library; });
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

console.log('Building Plugins');
await Promise.all(plugins.map(async (plugin) => {
  console.log('Building Plugin: ', plugin);
  // the relative path between plugins and libraries, is not known beforehand, so we calculate the distance.
  // posixRelativePath is the relative path between the index.js of the plugin and the specific library.
  const relativePluginPaths = {};
  Object.entries(libraries).forEach(([key, value]) => {
    const libraryPath = path.join('dist', 'assets', `${value.lib}.js`);
    const pluginPath = path.join(process.cwd(), `dist/plugins/${plugin}/`);
    const relativePath = path.relative(pluginPath, libraryPath);
    const posixRelativePath = relativePath.split(path.sep).join(path.posix.sep);
    relativePluginPaths[key] = posixRelativePath;
  });
  const pluginConfig = {
    configFile: './build/commonViteConfig.js',
    esbuild: {
      minify: true,
    },
    build: {
      write: false,
      emptyOutDir: false,
      outDir: `dist/plugins/${plugin}/`,
      lib: {
        entry: path.resolve(process.cwd(), path.join('plugins', plugin, 'index.js')),
        formats: ['es'],
        fileName: 'index',
      },
      rollupOptions: {
        plugins: [vcsOl()],
        external: Object.keys(libraries),
        output: {
          paths: relativePluginPaths,
        },
      },
    },
  };
  await fs.promises.mkdir(path.join(process.cwd(), 'dist', 'plugins', plugin), { recursive: true });
  await buildLibrary(pluginConfig, `plugins/${plugin}`, 'index');
}));

await buildCesium();
await fs.promises.cp(path.join(process.cwd(), 'map.config.json'), path.join(process.cwd(), 'dist', 'map.config.json'));
console.log('Finished Building vcMap');
