/* eslint import/no-extraneous-dependencies: ["error", { "devDependencies": false }] */
// eslint-disable-next-line import/no-extraneous-dependencies
import { build } from 'vite'; // vite is also a plugin-cli dep
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * @param {...string} pathSegments
 * @returns {string}
 */
export function getProjectPath(...pathSegments) {
  return path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    ...pathSegments,
  );
}

/**
 * returns the absolute path to the plugin directory
 * @returns {string}
 */
export function getPluginDirectory() {
  return getProjectPath('plugins');
}

/**
 * Gets the names of the plugins defined in the plugins/package.json
 * @returns {Promise<Array<string>>}
 */
export async function getPluginNames() {
  const pluginsDir = getPluginDirectory();
  const packageJsonContent = await fs.promises.readFile(
    path.join(pluginsDir, 'package.json'),
  );
  const { dependencies: plugins, optionalDependencies: internalPlugins } =
    JSON.parse(packageJsonContent.toString());
  const pluginNames = plugins ? Object.keys(plugins) : [];
  if (internalPlugins) {
    // internal plugins are mapped as optional dependencies only add them, if they exist
    Object.keys(internalPlugins).forEach((internalPlugin) => {
      if (
        fs.existsSync(
          path.join(pluginsDir, 'node_modules', ...internalPlugin.split('/')),
        )
      ) {
        pluginNames.push(internalPlugin);
      }
    });
  }
  return pluginNames;
}

/**
 * @returns {Promise<Array<string>>}
 */
export async function getInlinePlugins() {
  const pluginsDirectory = getPluginDirectory();
  const dirs = await fs.promises.readdir(pluginsDirectory, {
    withFileTypes: true,
  });
  const topLevelDirs = dirs.filter(
    (d) => d.isDirectory() && d.name !== 'node_modules',
  );
  const plugins = [];
  const scopes = [];
  topLevelDirs.forEach((d) => {
    if (d.name.startsWith('@')) {
      scopes.push(d.name);
    } else {
      plugins.push(d.name);
    }
  });

  await Promise.all(
    scopes.map(async (scope) => {
      const scopeDirs = await fs.promises.readdir(
        path.join(pluginsDirectory, scope),
        { withFileTypes: true },
      );
      scopeDirs
        .filter((d) => d.isDirectory() && d.name !== 'node_modules')
        .forEach((d) => {
          plugins.push(`${scope}/${d.name}`);
        });
    }),
  );

  return plugins;
}

/**
 * builds the given configuration and writes the library to the provided outputFolder. If the build contains css a .css
 * file will also be written and injected into the .js file.
 * @param {Object} libraryConfig Vitejs InlineConfig
 * @param {string} outputFolder
 * @param {string} library
 * @param {string} [hash]
 * @param {boolean} [base64Css = false] inline css. must be true for plugins
 * @returns {Promise<void>}
 */
export async function buildLibrary(
  libraryConfig,
  outputFolder,
  library,
  hash = '',
  base64Css = false,
) {
  // Base64 contains the characters '+', '/', and '=', which have a reserved meaning in URLs.
  // Base64url solves this by replacing '+' with '-' and '/' with '_'.
  // See https://stackoverflow.com/a/55389212
  const cssInjectorCode = `
function loadCss(href) {
  const base64url = href
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  return new Promise((resolve, reject) => {
    const elem = document.createElement('link');
    elem.rel = 'stylesheet';
    elem.href = base64url;
    elem.defer = false;
    elem.async = false;
    elem.onload = resolve;
    elem.onerror = reject;
    document.head.appendChild(elem);
  });
}`;

  const write = async (output) => {
    const addedHash = hash ? `.${hash}` : '';
    let css = false;
    if (output[1] && output[1].type === 'asset') {
      if (base64Css) {
        css = `data:text/css;base64,${Buffer.from(output[1].source).toString(
          'base64url',
        )}`;
      } else {
        await fs.promises.writeFile(
          path.join(
            process.cwd(),
            'dist',
            outputFolder,
            `${library}${addedHash}.css`,
          ),
          output[1].source,
        );
        css = `./${outputFolder}/${library}${addedHash}.css`;
      }
    }
    if (output[0] && output[0].type === 'chunk') {
      let code = css ? `${cssInjectorCode} await loadCss('${css}');` : '';
      code += output[0].code;
      await fs.promises.writeFile(
        path.join(
          process.cwd(),
          'dist',
          outputFolder,
          `${library}${addedHash}.js`,
        ),
        code,
      );
    }
  };

  const libraryBuilds = await build(libraryConfig);
  if (Array.isArray(libraryBuilds)) {
    await write(libraryBuilds[0].output);
  } else if (libraryBuilds.output) {
    await write(libraryBuilds.output);
  } else {
    libraryBuilds.prependListener('event', async (event) => {
      // debounce
      if (event.code === 'BUNDLE_END') {
        const res = await event.result.generate(
          libraryConfig?.build?.rollupOptions?.output ?? {},
        );
        await write(res.output);
      }
    });
  }
}

/**
 * A map, mapping external module name to output library name.
 * @enum {string}
 */
export const libraries = {
  vue: 'vue',
  '@vcmap-cesium/engine': 'cesium',
  '@cesium/engine': 'cesium',
  ol: 'ol',
  '@vcmap/core': 'core',
  '@vcmap/ui': 'ui',
  'vuetify/lib': 'vuetify',
};

const toCopy = [
  'plugin-assets',
  'package.json',
  'config.json',
  'LICENSE.md',
  'CHANGELOG.md',
  'README.md',
];

async function buildInlinePlugin(plugin, baseConfig, minify) {
  // the relative path between plugins and libraries, is not known beforehand, so we calculate the distance.
  // posixRelativePath is the relative path between the index.js of the plugin and the specific library.
  const relativePluginPaths = {};
  Object.entries(libraries).forEach(([key, value]) => {
    const libraryPath = path.join('dist', 'assets', `${value}.js`);
    const pluginPath = path.join(process.cwd(), `dist/plugins/${plugin}/`);
    const relativePath = path.relative(pluginPath, libraryPath);
    relativePluginPaths[key] = relativePath
      .split(path.sep)
      .join(path.posix.sep);
  });

  const pluginDir = getProjectPath('plugins', plugin);
  const pluginConfig = {
    ...baseConfig,
    esbuild: {
      minify,
    },
    build: {
      write: false,
      emptyOutDir: false,
      outDir: `dist/plugins/${plugin}/`,
      lib: {
        entry: path.join(pluginDir, 'index.js'),
        formats: ['es'],
        fileName: 'index',
      },
      rollupOptions: {
        external: Object.keys(libraries),
        output: {
          paths: relativePluginPaths,
        },
      },
    },
  };
  const distPath = path.join(process.cwd(), 'dist', 'plugins', plugin);
  if (!fs.existsSync(distPath)) {
    await fs.promises.mkdir(distPath, { recursive: true });
  }
  await buildLibrary(pluginConfig, `plugins/${plugin}`, 'index', '', true);
  await Promise.all(
    toCopy.map(async (entry) => {
      if (fs.existsSync(path.join(pluginDir, entry))) {
        await fs.promises.cp(
          path.join(pluginDir, entry),
          path.join(distPath, entry),
          { recursive: true, force: true },
        );
      }
    }),
  );
}

async function buildDependentPlugin(pluginName) {
  const pluginsDirectory = getPluginDirectory();
  let scope = '';
  let name = pluginName;
  if (pluginName.startsWith('@')) {
    [scope, name] = pluginName.split('/');
  }

  await fs.promises.cp(
    path.join(pluginsDirectory, 'node_modules', scope, name, 'dist'),
    path.join(process.cwd(), 'dist', 'plugins', scope, name),
    { recursive: true, force: true },
  );

  // must be copied one after the other to avoid race conditions
  await Promise.all(
    toCopy.map(async (entry) => {
      if (
        fs.existsSync(
          path.join(pluginsDirectory, 'node_modules', scope, name, entry),
        )
      ) {
        await fs.promises.cp(
          path.join(pluginsDirectory, 'node_modules', scope, name, entry),
          path.join(process.cwd(), 'dist', 'plugins', scope, name, entry),
          { recursive: true, force: true },
        );
      }
    }),
  );
}

/**
 * Will build a preview of all the current plugins & inline plugins
 * @param {import("vite").InlineConfig} [baseConfig={}] - the base config to use. build & esbuild will be completely overwritten
 * @param {boolean} [minify=true]
 * @returns {Promise<void>}
 */
export async function buildPluginsForPreview(baseConfig = {}, minify = true) {
  const inlinePlugins = await getInlinePlugins();
  const dependentPlugins = await getPluginNames();

  const promises = inlinePlugins.map((plugin) =>
    buildInlinePlugin(plugin, baseConfig, minify),
  );

  promises.push(
    ...dependentPlugins.map(async (pluginName) =>
      buildDependentPlugin(pluginName, baseConfig, minify),
    ),
  );
  await Promise.all(promises);
}

export async function buildPluginsForBundle(baseConfig = {}) {
  const inlinePlugins = await getInlinePlugins();
  const dependentPlugins = await getPluginNames();
  const promises = inlinePlugins
    .filter((plugin) => plugin.startsWith('@vcmap/'))
    .map((plugin) => buildInlinePlugin(plugin, baseConfig, true));

  promises.push(
    ...dependentPlugins.map(async (pluginName) =>
      buildDependentPlugin(pluginName),
    ),
  );
  await Promise.all(promises);
}
