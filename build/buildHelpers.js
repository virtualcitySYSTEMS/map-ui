// eslint-disable-next-line import/no-extraneous-dependencies
import { build } from 'vite'; // vite is also a plugin-cli dep
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
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

export async function getFileMd5(filePath) {
  const hash = createHash('md5');
  const stream = fs.createReadStream(filePath);
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}

export async function* getFilesInDirectory(filePath) {
  const entries = await fs.promises.readdir(filePath, { withFileTypes: true });
  // eslint-disable-next-line no-restricted-syntax
  for (const file of entries) {
    if (file.isDirectory()) {
      yield* getFilesInDirectory(path.join(filePath, file.name));
    } else if (file.isFile()) {
      yield path.join(filePath, file.name);
    }
  }
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
 * @param {boolean} [noOptional=false]
 * @returns {Promise<Array<string>>}
 */
export async function getPluginNames(noOptional) {
  const pluginsDir = getPluginDirectory();
  const packageJsonContent = await fs.promises.readFile(
    path.join(pluginsDir, 'package.json'),
  );
  const { dependencies: plugins, optionalDependencies: internalPlugins } =
    JSON.parse(packageJsonContent.toString());
  const pluginNames = plugins ? Object.keys(plugins) : [];
  if (!noOptional && internalPlugins) {
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
 * Writes content in the file and replaces references to public assets with the hashed url.
 * @param {string} filePath
 * @param {string} content
 * @param {Map<string, string>?} rewrittenPublicAssets
 * @param {string?} assetsPrefix prefixes the hashed asset url with this string
 * @returns {Promise<void>}
 */
export async function writeRewrittenFile(
  filePath,
  content,
  rewrittenPublicAssets,
  assetsPrefix,
) {
  let fileContent = content;
  if (rewrittenPublicAssets) {
    rewrittenPublicAssets.forEach((hashed, ori) => {
      const rewrittenUrl = assetsPrefix
        ? path.posix.join(assetsPrefix, hashed)
        : hashed;
      fileContent = fileContent.replaceAll(ori, rewrittenUrl);
    });
  }
  return fs.promises.writeFile(filePath, fileContent);
}

/**
 * builds the given configuration and writes the library to the provided outputFolder. If the build contains css a .css
 * file will also be written and injected into the .js file.
 * @param {Object} libraryConfig Vitejs InlineConfig
 * @param {string} outputFolder
 * @param {string} library
 * @param {string} [hash]
 * @param {boolean} [base64Css = false] inline css. must be true for plugins
 * @param {undefined|Map} [rewrittenPublicAssets=undefined] rewrittenPublicAssets Map of original filename to Hashed Filename in public folder
 * @returns {Promise<void>}
 */
export async function buildLibrary(
  libraryConfig,
  outputFolder,
  library,
  hash = '',
  base64Css = false,
  rewrittenPublicAssets = undefined,
) {
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

  const write = async (output) => {
    const addedHash = hash ? `-${hash}` : '';
    let css = false;
    if (output[1] && output[1].type === 'asset') {
      if (base64Css) {
        css = `data:text/css;base64,${Buffer.from(output[1].source).toString(
          'base64url',
        )}`;
      } else {
        await writeRewrittenFile(
          path.join(
            process.cwd(),
            'dist',
            outputFolder,
            `${library}${addedHash}.css`,
          ),
          output[1].source,
          rewrittenPublicAssets,
        );
        if (outputFolder) {
          css = `./${outputFolder}/${library}${addedHash}.css`;
        } else {
          css = `./${library}${addedHash}.css`;
        }
      }
    }
    if (output[0] && output[0].type === 'chunk') {
      let code = css ? `${cssInjectorCode} await loadCss('${css}');` : '';
      // inject materialDesignIcons here. We removed it earlier from the index.html
      if (library === 'ui') {
        const hashedPath = rewrittenPublicAssets.get(
          'assets/@mdi/font/css/materialdesignicons.min.css',
        );
        code += `await loadCss('./${path.posix.join('assets', hashedPath)}');`;
      }

      code += output[0].code;
      await writeRewrittenFile(
        path.join(
          process.cwd(),
          'dist',
          outputFolder,
          `${library}${addedHash}.js`,
        ),
        code,
        rewrittenPublicAssets,
      );
    }
  };

  const libraryBuilds = await build(libraryConfig);
  if (Array.isArray(libraryBuilds)) {
    await write(libraryBuilds[0].output);
  } else if (libraryBuilds.output) {
    await write(libraryBuilds.output);
  } else {
    /**
     * This is used by the plugin-cli. If the libraryConfic includes watch: { }
     * Rollup will start in Watch Mode. So we restart the browser on filechanges in the plugin-cli preview mode.
     * See: https://rollupjs.org/javascript-api/#rollup-watch
     * Also we need to add our BUNDLE_END event onCurrentRun, otherwise the bundle is already closed by vitejs.
     * See: https://github.com/vitejs/vite/blob/main/packages/vite/src/node/build.ts#L674
     */
    libraryBuilds.on('event', (event) => {
      if (event.code === 'START') {
        libraryBuilds.onCurrentRun('event', async (innerEvent) => {
          if (innerEvent.code === 'BUNDLE_END') {
            const res = await innerEvent.result.generate(
              libraryConfig?.build?.rollupOptions?.output ?? {},
            );
            await write(res.output);
          }
        });
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
  vuetify: 'vuetify',
  'vuetify/components': 'vuetify',
  'vuetify/styles': 'vuetify',
  'vuetify/directives': 'vuetify',
  'vuetify/blueprints': 'vuetify',
  'vuetify/labs/components': 'vuetify',
};

const toCopy = [
  'plugin-assets',
  'package.json',
  'config.json',
  'LICENSE.md',
  'CHANGELOG.md',
  'README.md',
];

async function buildInlinePlugin(
  plugin,
  baseConfig,
  minify,
  isDependend = false,
) {
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

  const pluginDir = isDependend
    ? getProjectPath('plugins', 'node_modules', plugin)
    : getProjectPath('plugins', plugin);
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
        entry: path.join(pluginDir, 'src', 'index.js'),
        formats: ['es'],
        fileName: 'index',
      },
      rollupOptions: {
        external: Object.keys(libraries),
        output: {
          manualChunks: () => 'index.js',
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

function filterDependentPlugins(dependentPlugins, pluginIsBuild = true) {
  const pluginsDir = getPluginDirectory();
  return dependentPlugins.filter((pluginName) => {
    const pluginExists = fs.existsSync(
      path.join(pluginsDir, 'node_modules', ...pluginName.split('/'), 'dist'),
    );
    if (pluginIsBuild) {
      return pluginExists;
    }
    return !pluginExists;
  });
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
  // only take already build plugins into account.
  // Plugins loaded from a git repository do not have a dist folder.
  // These plugins need to be build, same as the inline plugins
  const buildDependentPlugins = filterDependentPlugins(dependentPlugins, true);
  const notBuildDependentPlugins = filterDependentPlugins(
    dependentPlugins,
    false,
  );

  const promises = inlinePlugins.map((plugin) =>
    buildInlinePlugin(plugin, baseConfig, minify),
  );

  promises.push(
    ...buildDependentPlugins.map(async (pluginName) =>
      buildDependentPlugin(pluginName, baseConfig, minify),
    ),
    ...notBuildDependentPlugins.map(async (pluginName) =>
      buildInlinePlugin(pluginName, baseConfig, minify, true),
    ),
  );
  await Promise.all(promises);
}

export async function buildPluginsForBundle(baseConfig = {}) {
  const inlinePlugins = await getInlinePlugins();
  const dependentPlugins = await getPluginNames(false);
  const buildDependentPlugins = filterDependentPlugins(dependentPlugins, true);
  const promises = inlinePlugins
    .filter((plugin) => plugin.startsWith('@vcmap/'))
    .map((plugin) => buildInlinePlugin(plugin, baseConfig, true));

  promises.push(
    ...buildDependentPlugins.map(async (pluginName) =>
      buildDependentPlugin(pluginName),
    ),
  );
  await Promise.all(promises);
}
