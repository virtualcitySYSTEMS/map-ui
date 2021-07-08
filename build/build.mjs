import { v4 as uuid } from 'uuid'
import path from 'path';
import { build } from 'vite';


const libraries = {
  'vue': {
    lib: 'vue',
    entry: path.join('lib', 'vue.js')
  },
  '@vue/composition-api': {
    lib: 'vue-composition-api',
    entry: path.join('lib', 'vue-composition-api.js')
  },
  '@vcmap/cesium': {
    lib: 'cesium',
    entry: path.join('lib', 'cesium.js')
  }
};

const plugins = ['test'];

const libraryPaths = {};
const pluginLibraryPaths = {};
Object.entries(libraries).forEach(([key, value]) => {
  value.hash = `${uuid().substring(0,6)}`;
  libraryPaths[key] = `./${value.lib}.${value.hash}.es.js`;
  pluginLibraryPaths[key] = `../../assets/${value.lib}.es.js`;
});


await build({
  resolve: {
    alias: {
      "@": `${path.resolve(process.cwd(), "src")}`,
      '@vcsuite/uicomponents': `${path.resolve(process.cwd(), "components")}`,
      'vue': `${path.resolve(process.cwd(), path.join("node_modules", "vue", "dist", "vue.runtime.esm.js"))}`
    },
  },

  build: {
    minify: true,
    emptyOutDir: true,
    rollupOptions: {
      external: Object.keys(libraries),
      output: {
        paths: libraryPaths
      },
    },
  },
});

Object.entries(libraries).forEach(async ([key, value]) => {
  await build({
    build: {
      minify: true,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(process.cwd(), value.entry),
        formats: ['es'],
        fileName: `assets/${value.lib}.${value.hash}`
      },
      rollupOptions: {
        external: Object.keys(libraries).filter((library) => { return key !== library}),
        output: {
          paths: libraryPaths
        },
      },
    },
  });
  await build({
    build: {
      minify: true,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(process.cwd(), value.entry),
        formats: ['es'],
        fileName: `assets/${value.lib}`
      },
      rollupOptions: {
        external: Object.keys(libraries),
        output: {
          paths: libraryPaths
        },
      },
    },
  });
});

plugins.forEach(async (plugin) => {
  await build({
    build: {
      minify: true,
      emptyOutDir: false,
      outDir: `dist/plugins/${plugin}/`,
      lib: {
        entry: path.resolve(process.cwd(), path.join('plugins', plugin, `${plugin}.es.js`)),
        formats: ['es'],
        fileName: `${plugin}`
      },
      rollupOptions: {
        external: Object.keys(libraries),
        output: {
          paths: pluginLibraryPaths
        },
      },
    },
  });
});

