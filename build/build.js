import path from 'path';
import { build } from 'vite';
import generateOLLib from './generateOLLib.js';
import buildCesium from './buildCesium.js';
import { buildLibrary, libraries, libraryPaths } from './buildHelpers.js';

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

await buildCesium();
console.log('Finished Building vcMap');
