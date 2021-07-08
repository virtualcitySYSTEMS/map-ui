import { v4 as uuid } from 'uuid'
import path from 'path';
import { build } from 'vite';


const libraries = {
  'vue': {
    hash: `vue.${uuid().substring(0,6)}`,
    lib: 'vue',
  },
  '@vue/composition-api': {
    hash: `vue-composition-api.${uuid().substring(0,6)}`,
    lib: 'vue-composition-api'
  }
};

const plugins = ['test'];

const libraryPaths = {};
const pluginLibraryPaths = {};
Object.entries(libraries).forEach(([key, value]) => {
  libraryPaths[key] = `./${value.hash}.es.js`;
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
        entry: path.resolve(process.cwd(), path.join('lib', `${value.lib}.js`)),
        formats: ['es'],
        fileName: `assets/${value.hash}`
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
        entry: path.resolve(process.cwd(), path.join('lib', `${value.lib}.js`)),
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

