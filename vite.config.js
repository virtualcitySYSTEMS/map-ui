import path from "path";
import { defineConfig } from "vite";
import { createVuePlugin } from "vite-plugin-vue2";
import ViteComponents, {
  VuetifyResolver,
} from 'vite-plugin-components'

/*
const configPlugin = defineConfig({
  resolve: {
    alias: {
      "@": `${path.resolve(__dirname, "src")}`,
    },
  },

  build: {
    minify: true,
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'plugins/test/index.js'),
      formats: ['es'],
      fileName: 'test'
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue', '@vue/composition-api'],
      output: {
        paths:{
          vue: './vue.es.js',
          '@vue/composition-api': './vue-composition-api.es.js'
        },
      },
    },
  },

  plugins: [
    createVuePlugin(),
    ViteComponents({
      customComponentResolvers: [
        ViteIconsResolver({
          componentPrefix: "",
        }),
      ],
    }),
    ViteIcons({
      defaultStyle: "",
    }),
    WindiCSS(),
  ],

  server: {
    port: 8080,
  },
});
      external: ['vue', '@vue/composition-api'],
      output: {
        paths:{
          vue: './vue.es.js',
          '@vue/composition-api': './vue-composition-api.es.js'
        },
      },
*/
const configMain = defineConfig({
  resolve: {
    alias: {
      "@": `${path.resolve(__dirname, "src")}`,
      '@vcsuite/uicomponents': `${path.resolve(__dirname, "components")}`,
      'vue': `${path.resolve(__dirname, path.join("node_modules", "vue", "dist", "vue.esm.js"))}`
    },
  },

  build: {
    minify: true,
    emptyOutDir: false,
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
    },
  },

  plugins: [
    createVuePlugin(),
    ViteComponents({
      customComponentResolvers: [
        VuetifyResolver({
          componentPrefix: "",
        }),
      ],
    }),
  ],

  server: {
    https: false,
    port: 8080,
    proxy: {
      'datasource-data': {
        target: 'https://berlin.virtualcitymap.de',
        changeOrigin: true,
      },
    },
  },
});
/*
const configVue = defineConfig({
  build: {
    minify: true,
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'libs/vue.js'),
      formats: ['es'],
      fileName: 'vue'
    },
  },
  plugins: [
    createVuePlugin(),
    ViteComponents({
      customComponentResolvers: [
        ViteIconsResolver({
          componentPrefix: "",
        }),
      ],
    }),
    ViteIcons({
      defaultStyle: "",
    }),
    WindiCSS(),
  ],

  server: {
    port: 8080,
  },
});

const configCompositionApi = defineConfig({
  build: {
    minify: true,
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'libs/vue-composition-api.js'),
      formats: ['es'],
      fileName: 'vue-composition-api'
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        paths: {
          vue: './vue.es.js',
        },
      },
    },
  },
  plugins: [
    createVuePlugin(),
    ViteComponents({
      customComponentResolvers: [
        ViteIconsResolver({
          componentPrefix: "",
        }),
      ],
    }),
    ViteIcons({
      defaultStyle: "",
    }),
    WindiCSS(),
  ],

  server: {
    port: 8080,
  },
});
*/
export default configMain;
